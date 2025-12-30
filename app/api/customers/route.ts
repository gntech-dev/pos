import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { validateRNC, validateCedula, arePotentialDuplicates } from "@/lib/utils"
import { z } from "zod"

const CustomerCreateSchema = z.object({
   name: z.string().min(1),
   rnc: z.string().optional().transform(val => val === "" ? undefined : val),
   cedula: z.string().optional().transform(val => val === "" ? undefined : val),
   email: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().email().optional()),
   phone: z.string().optional().transform(val => val === "" ? undefined : val),
   address: z.string().optional().transform(val => val === "" ? undefined : val),
   isCompany: z.boolean().optional().default(false),
   emailPreference: z.boolean().optional().default(false),
 }).refine(
   (data) => {
     // If it's a company, RNC is required
     if (data.isCompany && !data.rnc) {
       return false
     }
     // Validate RNC format if provided
     if (data.rnc && !validateRNC(data.rnc)) {
       return false
     }
     // Validate Cédula format if provided
     if (data.cedula && !validateCedula(data.cedula)) {
       return false
     }
     return true
   },
   {
     message: "Invalid RNC or Cédula format, or missing required fields"
   }
 )

/**
 * GET /api/customers - List customers with pagination and search
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q") || undefined
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25", 10), 100)
  const skip = (Math.max(page, 1) - 1) * limit

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { rnc: { contains: q } },
      { cedula: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ]
  }

  try {
    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              sales: true,
              quotations: true,
            }
          }
        }
      }),
      prisma.customer.count({ where })
    ])

    return NextResponse.json({ data: items, total, page, limit })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * POST /api/customers - Create a new customer
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = CustomerCreateSchema.safeParse(body)
  
  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), 
      { status: 400 }
    )
  }

  const data = parseResult.data

  try {
    // Check for duplicate RNC or Cédula
    if (data.rnc) {
      const existing = await prisma.customer.findUnique({
        where: { rnc: data.rnc }
      })
      if (existing) {
        return new NextResponse(
          JSON.stringify({ error: 'Customer with this RNC already exists' }), 
          { status: 409 }
        )
      }
    }

    if (data.cedula) {
      const existing = await prisma.customer.findUnique({
        where: { cedula: data.cedula }
      })
      if (existing) {
        return new NextResponse(
          JSON.stringify({ error: 'Customer with this Cédula already exists' }), 
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId as string,
        action: 'CREATE',
        entity: 'Customer',
        entityId: customer.id,
        newValue: JSON.stringify(customer)
      }
    })

    return new NextResponse(JSON.stringify(customer), { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return new NextResponse(
        JSON.stringify({ error: 'Unique constraint failed', meta: (error as { meta?: unknown }).meta }),
        { status: 409 }
      )
    }

    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
