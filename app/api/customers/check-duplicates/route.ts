import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { arePotentialDuplicates } from "@/lib/utils"
import { z } from "zod"

const DuplicateCheckSchema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  rnc: z.string().optional(),
  cedula: z.string().optional(),
  excludeId: z.string().optional(), // ID to exclude from results (for updates)
})

/**
 * POST /api/customers/check-duplicates - Check for potential duplicate customers
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parseResult = DuplicateCheckSchema.safeParse(body)

  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid payload", issues: parseResult.error.format() }),
      { status: 400 }
    )
  }

  const { name, email, phone, rnc, cedula, excludeId } = parseResult.data

  try {
    const potentialDuplicates: any[] = []

    // Build where clause to exclude current customer if updating
    const excludeClause = excludeId ? { id: { not: excludeId } } : {}

    // Check for exact matches first
    const exactMatches = await prisma.customer.findMany({
      where: {
        ...excludeClause,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
          ...(rnc ? [{ rnc }] : []),
          ...(cedula ? [{ cedula }] : []),
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rnc: true,
        cedula: true,
        address: true,
        isCompany: true,
        createdAt: true,
      }
    })

    // Add exact matches with high confidence
    exactMatches.forEach(match => {
      potentialDuplicates.push({
        ...match,
        matchType: 'exact',
        confidence: 1.0,
        matchedFields: []
      })

      if (email && match.email === email) potentialDuplicates[potentialDuplicates.length - 1].matchedFields.push('email')
      if (phone && match.phone === phone) potentialDuplicates[potentialDuplicates.length - 1].matchedFields.push('phone')
      if (rnc && match.rnc === rnc) potentialDuplicates[potentialDuplicates.length - 1].matchedFields.push('rnc')
      if (cedula && match.cedula === cedula) potentialDuplicates[potentialDuplicates.length - 1].matchedFields.push('cedula')
    })

    // Check for fuzzy name matches if no exact matches found
    if (potentialDuplicates.length === 0) {
      const allCustomers = await prisma.customer.findMany({
        where: excludeClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          rnc: true,
          cedula: true,
          address: true,
          isCompany: true,
          createdAt: true,
        }
      })

      // Find potential duplicates based on name similarity
      allCustomers.forEach(customer => {
        if (arePotentialDuplicates(name, customer.name, 0.8)) { // 80% similarity threshold
          potentialDuplicates.push({
            ...customer,
            matchType: 'fuzzy',
            confidence: arePotentialDuplicates(name, customer.name),
            matchedFields: ['name']
          })
        }
      })
    }

    // Sort by confidence (highest first)
    potentialDuplicates.sort((a, b) => b.confidence - a.confidence)

    // Limit results to top 5
    const limitedResults = potentialDuplicates.slice(0, 5)

    return NextResponse.json({
      duplicates: limitedResults,
      count: limitedResults.length
    })

  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}