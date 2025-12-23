import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"

interface RouteParams {
  params: Promise<{ id: string }>
}

const UpdateQuotationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  expiresAt: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
  })).optional(),
})

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

/**
 * PUT /api/quotations/[id] - Update quotation status and notes
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = UpdateQuotationSchema.parse(body)

    // Check if quotation exists and user has permission
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: { userId: true, status: true }
    })

    if (!existingQuotation) {
      return new NextResponse(JSON.stringify({ error: 'Quotation not found' }), { status: 404 })
    }

    // Check permissions - users can only update their own quotations unless admin/manager
    if (!['ADMIN', 'MANAGER'].includes(session.role) && existingQuotation.userId !== session.userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    }

    // Validate products exist if items are being updated
    if (validatedData.items) {
      const productIds = validatedData.items.map(item => item.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      })

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id)
        const missingIds = productIds.filter(id => !foundIds.includes(id))
        return new NextResponse(JSON.stringify({
          error: 'Some products not found',
          missingProducts: missingIds
        }), { status: 400 })
      }
    }

    // Build update data object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (validatedData.customerId !== undefined) {
      updateData.customerId = validatedData.customerId
    }
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = new Date(validatedData.expiresAt)
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.items) {
      updateData.items = {
        deleteMany: {}, // Delete existing items
        create: validatedData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.quantity * item.unitPrice - item.discount,
          total: (item.quantity * item.unitPrice - item.discount) * 1.18, // Include ITBIS
        }))
      }
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            rnc: true,
          }
        },
        user: {
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

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid data', details: error.issues }), { status: 400 })
    }
    console.error('Error updating quotation:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * DELETE /api/quotations/[id] - Delete a quotation (only if PENDING)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    // Check if quotation exists and can be deleted
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: { userId: true, status: true }
    })

    if (!existingQuotation) {
      return new NextResponse(JSON.stringify({ error: 'Quotation not found' }), { status: 404 })
    }

    // Check permissions - users can only delete their own quotations unless admin/manager
    if (!['ADMIN', 'MANAGER'].includes(session.role) && existingQuotation.userId !== session.userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    }

    // Only allow deletion of PENDING quotations
    if (existingQuotation.status !== 'PENDING') {
      return new NextResponse(JSON.stringify({ error: 'Can only delete pending quotations' }), { status: 400 })
    }

    await prisma.quotation.delete({
      where: { id }
    })

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}