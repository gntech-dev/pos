import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { getSessionFromCookie } from "../../../../lib/session"
import { z } from "zod"

const ProductUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  taxRate: z.number().min(0).optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  minStock: z.number().int().optional(),
  stock: z.number().int().optional(),
  isActive: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  hasBatch: z.boolean().optional(),
  hasExpiration: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      batches: {
        orderBy: { receivedDate: 'desc' }
      },
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 10 // Last 10 movements
      }
    }
  })
  if (!product) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parseResult = ProductUpdateSchema.safeParse(body)
  if (!parseResult.success) {
    return new NextResponse(JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 })

  try {
    const updated = await prisma.product.update({ where: { id }, data: parseResult.data })

    await prisma.auditLog.create({ data: {
      userId: session.userId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: updated.id,
      oldValue: JSON.stringify(product),
      newValue: JSON.stringify(updated)
    }})

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update product error', err)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookie()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404 })

  try {
    await prisma.product.delete({ where: { id } })

    await prisma.auditLog.create({ data: {
      userId: session.userId,
      action: 'DELETE',
      entity: 'Product',
      entityId: product.id,
      oldValue: JSON.stringify(product)
    }})

    return new NextResponse(JSON.stringify({ success: true }))
  } catch (err) {
    console.error('Delete product error', err)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
