import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/quotations/[id] - Get a single quotation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    const quotation = await prisma.quotation.findUnique({
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
        user: {
          select: {
            id: true,
            name: true,
            username: true,
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

    if (!quotation) {
      return new NextResponse(JSON.stringify({ error: 'Quotation not found' }), { status: 404 })
    }

    // Check permissions - users can only see their own quotations unless admin/manager
    if (!['ADMIN', 'MANAGER'].includes(session.role) && quotation.userId !== session.userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error fetching quotation:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}