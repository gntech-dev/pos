import { NextRequest, NextResponse } from 'next/server'
import { validateCedula } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { endpointLimiters, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cedula: string }> }
) {
  try {
    // Check rate limiting first
    const rateLimitResult = await endpointLimiters.validateCedula(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult, { limiter: 'validation' })
    }

    const cedula = (await params).cedula

    if (!cedula) {
      return NextResponse.json(
        { error: 'Cédula es requerida' },
        { status: 400 }
      )
    }

    // Validate Cédula format and checksum
    if (!validateCedula(cedula)) {
      return NextResponse.json({
        valid: false,
        error: 'Cédula inválida. Verifique el número.'
      })
    }

    // Check if Cédula exists in our customers
    const existingCustomer = await prisma.customer.findUnique({
      where: { cedula },
      select: {
        id: true,
        name: true,
        isCompany: true
      }
    })

    return NextResponse.json({
      valid: true,
      cedula,
      exists: {
        inSystem: !!existingCustomer
      },
      customer: existingCustomer
    })

  } catch (error) {
    console.error('Cédula validation error:', error)
    return NextResponse.json(
      { error: 'Error al validar cédula' },
      { status: 500 }
    )
  }
}