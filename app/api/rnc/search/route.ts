import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: 'Se requiere una búsqueda de al menos 3 caracteres' },
        { status: 400 }
      )
    }

    // Search by RNC number or business name
    const results = await prisma.rNCRegistry.findMany({
      where: {
        OR: [
          { rnc: { contains: query } },
          { businessName: { contains: query } }
        ],
        status: 'ACTIVE'
      },
      take: Math.min(limit, 50), // Max 50 results
      orderBy: [
        { businessName: 'asc' },
        { rnc: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      results: results.map((rnc: { rnc: string; businessName: string; businessType: string | null; address: string | null; province: string | null; phone: string | null; email: string | null }) => ({
        rnc: rnc.rnc,
        businessName: rnc.businessName,
        businessType: rnc.businessType,
        address: rnc.address,
        province: rnc.province,
        phone: rnc.phone,
        email: rnc.email
      })),
      total: results.length
    })

  } catch (error) {
    console.error('RNC search error:', error)
    return NextResponse.json(
      { error: 'Error en la búsqueda de RNC' },
      { status: 500 }
    )
  }
}