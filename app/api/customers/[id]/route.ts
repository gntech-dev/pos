import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { validateRNC, validateCedula } from "@/lib/utils"
import { z } from "zod"

const CustomerUpdateSchema = z.object({
   name: z.string().min(1),
   rnc: z.string().optional().transform(val => val === "" ? undefined : val),
   cedula: z.string().optional().transform(val => val === "" ? undefined : val),
   email: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().email().optional()),
   phone: z.string().optional().transform(val => val === "" ? undefined : val),
   address: z.string().optional().transform(val => val === "" ? undefined : val),
   isCompany: z.boolean().optional(),
   emailPreference: z.boolean().optional().default(false),
 }).transform((data) => ({
   ...data,
   isCompany: data.isCompany ?? (data.rnc ? true : false)
 })).refine(
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
     message: "Invalid RNC or Cédula format, or missing required fields for company"
   }
 )

/**
 * GET /api/customers/[id] - Get a single customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            quotations: true,
            refunds: true
          }
        }
      }
    })

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * PUT /api/customers/[id] - Update a customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  const body = await request.json().catch(() => null)
  const parseResult = CustomerUpdateSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }), 
      { status: 400 }
    )
  }  const data = parseResult.data

  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 })
    }

    // Check for duplicate RNC or Cédula (excluding current customer)
    if (data.rnc && data.rnc !== existingCustomer.rnc) {
      const duplicate = await prisma.customer.findFirst({
        where: { rnc: data.rnc, id: { not: id } }
      })
      if (duplicate) {
        return new NextResponse(
          JSON.stringify({ error: 'Customer with this RNC already exists' }),
          { status: 409 }
        )
      }
    }

    if (data.cedula && data.cedula !== existingCustomer.cedula) {
      const duplicate = await prisma.customer.findFirst({
        where: { cedula: data.cedula, id: { not: id } }
      })
      if (duplicate) {
        return new NextResponse(
          JSON.stringify({ error: 'Customer with this Cédula already exists' }),
          { status: 409 }
        )
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId as string,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: id,
        oldValue: JSON.stringify(existingCustomer),
        newValue: JSON.stringify(updatedCustomer)
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

/**
 * DELETE /api/customers/[id] - Delete a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { id } = await params

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            quotations: true,
            refunds: true
          }
        }
      }
    })

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 })
    }

    // Check if customer has related records
    if (customer._count.sales > 0 || customer._count.quotations > 0 || customer._count.refunds > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Cannot delete customer with existing sales, quotations, or refunds. Consider deactivating instead."
        }),
        { status: 409 }
      )
    }

    await prisma.customer.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId as string,
        action: 'DELETE',
        entity: 'Customer',
        entityId: id,
        oldValue: JSON.stringify(customer)
      }
    })

    return new NextResponse(JSON.stringify({ message: "Customer deleted successfully" }), { status: 200 })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}