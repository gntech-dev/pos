import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

export async function GET(_request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(_request.url)
  const form = url.searchParams.get("form") // 606, 607, 608
  const startDate = url.searchParams.get("startDate")
  const endDate = url.searchParams.get("endDate")

  if (!form) {
    return new NextResponse(JSON.stringify({ error: "Form parameter required" }), { status: 400 })
  }

  const dateFilter: Record<string, unknown> = {}

  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  try {
    switch (form) {
      case "606":
        const form606 = await generateForm606(dateFilter, startDate, endDate)
        return NextResponse.json(form606)

      case "607":
        const form607 = await generateForm607(dateFilter, startDate, endDate)
        return NextResponse.json(form607)

      case "608":
        const form608 = await generateForm608(dateFilter, startDate, endDate)
        return NextResponse.json(form608)

      default:
        return new NextResponse(JSON.stringify({ error: "Invalid form" }), { status: 400 })
    }
  } catch (error) {
    console.error('Error generating DGII report:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

async function generateForm606(_dateFilter: Record<string, unknown>, _startDate?: string | null, _endDate?: string | null) {
  // Form 606: Compras y Servicios (Purchases and Services)
  // In a real implementation, this would include purchase records
  // For now, return a placeholder structure

  return {
    form: "606",
    period: "Mensual",
    rnc: "000000000", // Should come from business settings
    businessName: "Nombre de la Empresa",
    records: [],
    totals: {
      totalPurchases: 0,
      totalITBIS: 0,
      totalRetainedITBIS: 0
    },
    note: "Implementación pendiente - Requiere registros de compras"
  }
}

async function generateForm607(_dateFilter: Record<string, unknown>, _startDate?: string | null, _endDate?: string | null) {
  // Form 607: Ventas (Sales)
  const sales = await prisma.sale.findMany({
    where: {
      ..._dateFilter,
      ncf: { not: null } // Only sales with NCF
    },
    include: {
      customer: {
        select: { rnc: true, cedula: true, name: true }
      },
      items: {
        include: {
          product: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const records = sales.map((sale: {
    ncf: string | null;
    createdAt: Date;
    total: number;
    tax: number;
    ncfType: string | null;
    customer: { rnc: string | null; cedula: string | null; name: string | null } | null;
    items: Array<{ quantity: number; unitPrice: number; taxRate: number; subtotal: number; product: { name: string } }>;
  }) => ({
    ncf: sale.ncf,
    saleDate: sale.createdAt.toISOString().split('T')[0],
    customerRNC: sale.customer?.rnc || '',
    customerCedula: sale.customer?.cedula || '',
    customerName: sale.customer?.name || 'Cliente Final',
    saleType: sale.ncfType || 'B02', // Default to B02 for final consumer
    totalAmount: sale.total,
    itbis: sale.tax,
    retainedITBIS: 0, // Would need business logic for retention
    items: sale.items.map(item => ({
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itbis: item.taxRate * item.subtotal
    }))
  }))

  const totals = records.reduce((acc, record) => ({
    totalSales: acc.totalSales + record.totalAmount,
    totalITBIS: acc.totalITBIS + record.itbis,
    totalRetainedITBIS: acc.totalRetainedITBIS + record.retainedITBIS
  }), { totalSales: 0, totalITBIS: 0, totalRetainedITBIS: 0 })

  return {
    form: "607",
    period: _startDate && _endDate ? `${_startDate} - ${_endDate}` : "Período completo",
    rnc: "000000000", // Should come from business settings
    businessName: "Nombre de la Empresa",
    records,
    totals,
    recordCount: records.length
  }
}

async function generateForm608(_dateFilter: Record<string, unknown>, _startDate?: string | null, _endDate?: string | null) {
  // Form 608: ITBIS (VAT)
  // This is a summary of ITBIS operations
  const [salesITBIS, purchasesITBIS] = await Promise.all([
    prisma.sale.aggregate({
      where: _dateFilter,
      _sum: { tax: true, total: true }
    }),
    // In a real implementation, purchases would have ITBIS data
    // For now, placeholder
    Promise.resolve({ _sum: { tax: 0, total: 0 } })
  ])

  const totalITBISSales = salesITBIS._sum.tax || 0
  const totalITBISPurchases = purchasesITBIS._sum.tax || 0
  const netITBIS = totalITBISSales - totalITBISPurchases

  return {
    form: "608",
    period: _startDate && _endDate ? `${_startDate} - ${_endDate}` : "Período completo",
    rnc: "000000000", // Should come from business settings
    businessName: "Nombre de la Empresa",
    operations: {
      totalITBISSales,
      totalITBISPurchases,
      netITBIS
    },
    note: "Implementación básica - Requiere datos completos de compras para cálculo preciso"
  }
}