import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { z } from "zod"
import { getSessionFromCookie } from "../../../lib/session"

const ProductCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
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

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") || undefined
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100)
  const skip = (Math.max(page, 1) - 1) * limit

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.product.count({ where })
  ])

  return NextResponse.json({ data: items, total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = ProductCreateSchema.safeParse(body)
  if (!parseResult.success) {
    return new NextResponse(JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), { status: 400 })
  }

  const data = parseResult.data

  try {
    const product = await prisma.product.create({ data })

    await prisma.auditLog.create({ data: {
      userId: session.userId,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      newValue: JSON.stringify(product)
    }})

    return new NextResponse(JSON.stringify(product), { status: 201 })
  } catch (err) {
    // Check for unique constraint error
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return new NextResponse(JSON.stringify({ error: 'Unique constraint failed', meta: (err as { meta?: unknown }).meta }), { status: 409 })
    }
    console.error('Create product error', err)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
