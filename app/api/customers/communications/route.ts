import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"

const CreateCommunicationSchema = z.object({
  customerId: z.string(),
  type: z.enum(["email", "call", "note", "sms", "meeting", "other"]),
  direction: z.enum(["inbound", "outbound"]),
  subject: z.string().optional(),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * GET /api/customers/communications?customerId=... - Get communications for a customer
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get("customerId")

  if (!customerId) {
    return new NextResponse(JSON.stringify({ error: "Customer ID is required" }), { status: 400 })
  }

  try {
    const communications = await prisma.communication.findMany({
      where: { customerId },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(communications)
  } catch (error) {
    console.error("Error fetching communications:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch communications" }), { status: 500 })
  }
}

/**
 * POST /api/customers/communications - Create a new communication
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = CreateCommunicationSchema.parse(body)

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId }
    })

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 })
    }

    const communication = await prisma.communication.create({
      data: {
        ...validatedData,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: session.userId,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    })

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: "Invalid data", details: error.issues }), { status: 400 })
    }

    console.error("Error creating communication:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to create communication" }), { status: 500 })
  }
}