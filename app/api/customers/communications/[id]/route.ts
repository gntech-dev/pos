import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { z } from "zod"

const UpdateCommunicationSchema = z.object({
  type: z.enum(["email", "call", "note", "sms", "meeting", "other"]).optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  subject: z.string().optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * GET /api/customers/communications/[id] - Get a specific communication
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!communication) {
      return new NextResponse(JSON.stringify({ error: "Communication not found" }), { status: 404 })
    }

    return NextResponse.json(communication)
  } catch (error) {
    console.error("Error fetching communication:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch communication" }), { status: 500 })
  }
}

/**
 * PUT /api/customers/communications/[id] - Update a communication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = UpdateCommunicationSchema.parse(body)

    // Check if communication exists and user has permission
    const existingCommunication = await prisma.communication.findUnique({
      where: { id }
    })

    if (!existingCommunication) {
      return new NextResponse(JSON.stringify({ error: "Communication not found" }), { status: 404 })
    }

    // Only allow the creator or admin to update
    if (existingCommunication.createdBy !== session.userId && session.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 403 })
    }

    const updateData: Record<string, unknown> = { ...validatedData }
    if (validatedData.metadata) {
      updateData.metadata = JSON.stringify(validatedData.metadata)
    }

    const communication = await prisma.communication.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(communication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: "Invalid data", details: error.issues }), { status: 400 })
    }

    console.error("Error updating communication:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to update communication" }), { status: 500 })
  }
}

/**
 * DELETE /api/customers/communications/[id] - Delete a communication
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    // Check if communication exists and user has permission
    const existingCommunication = await prisma.communication.findUnique({
      where: { id }
    })

    if (!existingCommunication) {
      return new NextResponse(JSON.stringify({ error: "Communication not found" }), { status: 404 })
    }

    // Only allow the creator or admin to delete
    if (existingCommunication.createdBy !== session.userId && session.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 403 })
    }

    await prisma.communication.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting communication:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to delete communication" }), { status: 500 })
  }
}