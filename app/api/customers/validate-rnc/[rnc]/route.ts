import { NextRequest, NextResponse } from 'next/server'
import { validateRNC } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { endpointLimiters, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rnc: string }> }
) {
  try {
    // Check rate limiting first
    const rateLimitResult = await endpointLimiters.validateRNC(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult, { limiter: 'validation' })
    }

    const rnc = (await params).rnc

    if (!rnc) {
      return NextResponse.json(
        { error: 'RNC es requerido' },
        { status: 400 }
      )
    }

    // Validate RNC format
    if (!validateRNC(rnc)) {
      return NextResponse.json({
        valid: false,
        error: 'Formato de RNC inválido. Debe tener 9 o 11 dígitos.'
      })
    }

    // Check if RNC exists in our customers
    const existingCustomer = await prisma.customer.findUnique({
      where: { rnc },
      select: {
        id: true,
        name: true,
        isCompany: true
      }
    })

    // Check if RNC exists in DGII registry
    const dgiiRecord = await prisma.rNCRegistry.findUnique({
      where: { rnc },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        status: true,
        address: true,
        province: true
      }
    })

    return NextResponse.json({
      valid: true,
      rnc,
      exists: {
        inSystem: !!existingCustomer,
        inDGII: !!dgiiRecord
      },
      customer: existingCustomer,
      dgiiData: dgiiRecord
    })

  } catch (error) {
    console.error('RNC validation error:', error)
    return NextResponse.json(
      { error: 'Error al validar RNC' },
      { status: 500 }
    )
  }
}