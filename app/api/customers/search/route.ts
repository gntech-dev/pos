import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Se requiere una búsqueda de al menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Search in Customer table (manually created customers)
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { rnc: { contains: query } },
          { cedula: { contains: query } }
        ]
      },
      take: Math.min(limit, 20),
      select: {
        id: true,
        name: true,
        rnc: true,
        cedula: true,
        email: true,
        phone: true,
        isCompany: true
      }
    })

    // Search in RNCRegistry table (DGII synchronized data)
    const rncRecords = await prisma.rNCRegistry.findMany({
      where: {
        AND: [
          {
            OR: [
              { rnc: { contains: query } },
              { businessName: { contains: query } }
            ]
          },
          { status: 'ACTIVE' }
        ]
      },
      take: Math.min(limit, 20),
      select: {
        id: true,
        rnc: true,
        businessName: true,
        businessType: true,
        address: true,
        province: true,
        phone: true,
        email: true
      }
    })

    // Combine and format results
    const customerResults = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      rnc: customer.rnc,
      cedula: customer.cedula,
      email: customer.email,
      phone: customer.phone,
      isCompany: customer.isCompany,
      source: 'manual' as const
    }))

    const rncResults = rncRecords.map(record => ({
      id: `rnc-${record.id}`, // Prefix to avoid ID conflicts
      name: record.businessName,
      rnc: record.rnc,
      businessType: record.businessType,
      address: record.address,
      province: record.province,
      phone: record.phone,
      email: record.email,
      source: 'dgii' as const
    }))

    // Combine results, prioritizing manual customers
    const allResults = [...customerResults, ...rncResults]

    return NextResponse.json({
      success: true,
      results: allResults.slice(0, limit),
      total: allResults.length,
      breakdown: {
        manual: customerResults.length,
        dgii: rncResults.length
      }
    })

  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json(
      { error: 'Error en la búsqueda de clientes' },
      { status: 500 }
    )
  }
}