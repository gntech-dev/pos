import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { NCFType } from "@/lib/ncf"

interface RouteParams {
  params: Promise<{ ncf: string }>
}

/**
 * GET /api/ncf/expiration/[ncf] - Get NCF expiration information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // NCF expiration info is public data, no authentication required
  // const session = await getSessionFromCookie()
  // if (!session) {
  //   return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  // }

  // Next.js 15 requires awaiting params
  const resolvedParams = await params
  const { ncf } = resolvedParams

  try {
    if (!ncf || ncf.length < 3) {
      return NextResponse.json({ 
        expiryDate: null, 
        daysUntilExpiry: null, 
        isExpired: false 
      })
    }

    // Extract the NCF type from the first 3 characters
    const ncfType = ncf.substring(0, 3) as NCFType

    const sequence = await prisma.nCFSequence.findUnique({
      where: { type: ncfType }
    })

    if (!sequence) {
      return NextResponse.json({ 
        expiryDate: null, 
        daysUntilExpiry: null, 
        isExpired: false 
      })
    }

    const now = new Date()
    const expiry = new Date(sequence.expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return NextResponse.json({
      expiryDate: sequence.expiryDate,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      ncfType,
      isActive: sequence.isActive
    })

  } catch (error) {
    console.error('Error fetching NCF expiration:', error)
    return NextResponse.json({ 
      error: 'Server error' 
    }, { status: 500 })
  }
}