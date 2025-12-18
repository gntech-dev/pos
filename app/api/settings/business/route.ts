import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    // Get business settings from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email']
        }
      }
    })

    // Transform to object format
    const businessData: {
      name: string
      rnc: string
      address: string
      phone: string
      email: string
    } = {
      name: 'GNTech Demo',
      rnc: '000-00000-0',
      address: 'Santo Domingo, República Dominicana',
      phone: '809-555-5555',
      email: 'info@gntech.com'
    }

    // Override with database values
    settings.forEach(setting => {
      switch (setting.key) {
        case 'business_name':
          businessData.name = setting.value
          break
        case 'business_rnc':
          businessData.rnc = setting.value
          break
        case 'business_address':
          businessData.address = setting.value
          break
        case 'business_phone':
          businessData.phone = setting.value
          break
        case 'business_email':
          businessData.email = setting.value
          break
      }
    })

    return NextResponse.json(businessData)
  } catch (error) {
    console.error('Error loading business settings:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const businessData = await request.json()

    // Validate required fields
    if (!businessData.name || !businessData.rnc) {
      return new NextResponse(JSON.stringify({ error: 'Nombre de empresa y RNC son requeridos' }), { status: 400 })
    }

    // Save settings to database
    const settings = [
      { key: 'business_name', value: businessData.name, description: 'Nombre de la empresa' },
      { key: 'business_rnc', value: businessData.rnc, description: 'RNC de la empresa' },
      { key: 'business_address', value: businessData.address || '', description: 'Dirección de la empresa' },
      { key: 'business_phone', value: businessData.phone || '', description: 'Teléfono de la empresa' },
      { key: 'business_email', value: businessData.email || '', description: 'Email de la empresa' }
    ]

    // Use upsert to create or update each setting
    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Configuración de empresa guardada exitosamente' })
  } catch (error) {
    console.error('Error saving business settings:', error)
    return new NextResponse(JSON.stringify({ error: 'Error al guardar la configuración' }), { status: 500 })
  }
}