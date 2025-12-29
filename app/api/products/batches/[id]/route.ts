import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

const UpdateProductBatchSchema = z.object({
  batchNumber: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  expirationDate: z.string().optional(),
  receivedDate: z.string().optional(),
})

/**
 * GET /api/products/batches/[id] - Get a specific product batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const id = (await params).id

  try {
    const batch = await prisma.productBatch.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            hasExpiration: true
          }
        }
      }
    })

    if (!batch) {
      return new NextResponse(JSON.stringify({ error: 'Product batch not found' }), { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Error fetching product batch:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * PATCH /api/products/batches/[id] - Update a product batch
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const id = (await params).id
  const body = await request.json().catch(() => null)
  const parseResult = UpdateProductBatchSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }),
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    // Get current batch
    const currentBatch = await prisma.productBatch.findUnique({
      where: { id },
      include: { product: true }
    })

    if (!currentBatch) {
      return new NextResponse(JSON.stringify({ error: 'Product batch not found' }), { status: 404 })
    }

    // Check batch number uniqueness if changing
    if (data.batchNumber && data.batchNumber !== currentBatch.batchNumber) {
      const existingBatch = await prisma.productBatch.findUnique({
        where: {
          productId_batchNumber: {
            productId: currentBatch.productId,
            batchNumber: data.batchNumber
          }
        }
      })

      if (existingBatch) {
        return new NextResponse(
          JSON.stringify({ error: 'Batch number already exists for this product' }),
          { status: 409 }
        )
      }
    }

    const quantityDiff = data.quantity ? data.quantity - currentBatch.quantity : 0

    const batch = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Update the batch
      const updatedBatch = await tx.productBatch.update({
        where: { id },
        data: {
          ...(data.batchNumber && { batchNumber: data.batchNumber }),
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.expirationDate && { expirationDate: new Date(data.expirationDate) }),
          ...(data.receivedDate && { receivedDate: new Date(data.receivedDate) }),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        }
      })

      // Update product stock if quantity changed
      if (quantityDiff !== 0) {
        await tx.product.update({
          where: { id: currentBatch.productId },
          data: {
            stock: { increment: quantityDiff }
          }
        })

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: currentBatch.productId,
            type: 'ADJUSTMENT',
            quantity: quantityDiff,
            reason: `Batch ${updatedBatch.batchNumber} adjustment`,
            reference: updatedBatch.id,
            createdBy: session.userId
          }
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'UPDATE',
          entity: 'ProductBatch',
          entityId: id,
          oldValue: JSON.stringify({
            batchNumber: currentBatch.batchNumber,
            quantity: currentBatch.quantity,
          }),
          newValue: JSON.stringify({
            batchNumber: updatedBatch.batchNumber,
            quantity: updatedBatch.quantity,
          })
        }
      })

      return updatedBatch
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Error updating product batch:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * DELETE /api/products/batches/[id] - Delete a product batch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Only admin and manager can delete batches
  if (!['ADMIN', 'MANAGER'].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 })
  }

  const id = (await params).id

  try {
    // Get current batch
    const currentBatch = await prisma.productBatch.findUnique({
      where: { id },
      include: { product: true }
    })

    if (!currentBatch) {
      return new NextResponse(JSON.stringify({ error: 'Product batch not found' }), { status: 404 })
    }

    // Check if batch has been used in sales (simplified check)
    const saleItems = await prisma.saleItem.findMany({
      where: { productId: currentBatch.productId },
      take: 1
    })

    if (saleItems.length > 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Cannot delete batch that has been used in sales' }),
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: currentBatch.productId },
        data: {
          stock: { decrement: currentBatch.quantity }
        }
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: currentBatch.productId,
          type: 'ADJUSTMENT',
          quantity: -currentBatch.quantity,
          reason: `Batch ${currentBatch.batchNumber} deleted`,
          reference: currentBatch.id,
          createdBy: session.userId
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'DELETE',
          entity: 'ProductBatch',
          entityId: id,
          oldValue: JSON.stringify({
            productId: currentBatch.productId,
            batchNumber: currentBatch.batchNumber,
            quantity: currentBatch.quantity,
          })
        }
      })

      // Delete the batch
      await tx.productBatch.delete({
        where: { id }
      })
    })

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error deleting product batch:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}