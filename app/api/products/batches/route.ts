import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"

const ProductBatchSchema = z.object({
  productId: z.string(),
  batchNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  expirationDate: z.string().optional(), // ISO date string
  receivedDate: z.string().optional(), // ISO date string
})

// Note: UpdateProductBatchSchema is not used in this file - defined in [id]/route.ts
// const UpdateProductBatchSchema = z.object({
//   batchNumber: z.string().min(1).optional(),
//   quantity: z.number().int().positive().optional(),
//   expirationDate: z.string().optional(),
//   receivedDate: z.string().optional(),
// })

/**
 * GET /api/products/batches - List product batches with pagination and filters
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100)
  const skip = (Math.max(page, 1) - 1) * limit
  const productId = url.searchParams.get("productId") || undefined
  const expired = url.searchParams.get("expired") === "true"
  const expiringSoon = url.searchParams.get("expiringSoon") === "true"

  const where: Record<string, unknown> = {}

  if (productId) {
    where.productId = productId
  }

  if (expired) {
    where.expirationDate = { lt: new Date() }
  } else if (expiringSoon) {
    // Expiring within 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    where.expirationDate = {
      gte: new Date(),
      lte: thirtyDaysFromNow
    }
  }

  try {
    const [items, total] = await Promise.all([
      prisma.productBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: 'desc' },
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
      }),
      prisma.productBatch.count({ where })
    ])

    return NextResponse.json({ data: items, total, page, limit })
  } catch (error) {
    console.error('Error fetching product batches:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/products/batches - Create a new product batch
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = ProductBatchSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }),
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    // Verify product exists and has batch tracking enabled
    const product = await prisma.product.findUnique({
      where: { id: data.productId }
    })

    if (!product) {
      return new NextResponse(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404 }
      )
    }

    if (!product.hasBatch) {
      return new NextResponse(
        JSON.stringify({ error: 'Product does not have batch tracking enabled' }),
        { status: 400 }
      )
    }

    // Check if batch number already exists for this product
    const existingBatch = await prisma.productBatch.findUnique({
      where: {
        productId_batchNumber: {
          productId: data.productId,
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

    const batch = await prisma.$transaction(async (tx) => {
      // Create the batch
      const newBatch = await tx.productBatch.create({
        data: {
          productId: data.productId,
          batchNumber: data.batchNumber,
          quantity: data.quantity,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
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

      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: {
          stock: { increment: data.quantity }
        }
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          type: 'PURCHASE',
          quantity: data.quantity,
          reason: `Batch ${data.batchNumber} received`,
          reference: newBatch.id,
          createdBy: session.userId
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          entity: 'ProductBatch',
          entityId: newBatch.id,
          newValue: JSON.stringify({
            productId: data.productId,
            batchNumber: data.batchNumber,
            quantity: data.quantity,
          })
        }
      })

      return newBatch
    })

    return new NextResponse(JSON.stringify(batch), { status: 201 })
  } catch (error) {
    console.error('Error creating product batch:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}