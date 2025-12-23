import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/sales/[id] - Get a single sale
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rnc: true,
            cedula: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        cashier: {
          select: {
            id: true,
            name: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              }
            }
          }
        },
      }
    })

    if (!sale) {
      return new NextResponse(JSON.stringify({ error: 'Sale not found' }), { status: 404 })
    }

    // Check permissions - users can only see their own sales unless admin/manager
    if (!['ADMIN', 'MANAGER'].includes(session.role) && sale.cashierId !== session.userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}