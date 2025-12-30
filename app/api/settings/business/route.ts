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
          in: [
            'business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email', 'business_logo',
            'business_facebook', 'business_instagram', 'business_twitter', 'business_linkedin',
            'business_hours_monday', 'business_hours_tuesday', 'business_hours_wednesday', 'business_hours_thursday',
            'business_hours_friday', 'business_hours_saturday', 'business_hours_sunday'
          ]
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
      logo?: string
      facebook: string
      instagram: string
      twitter: string
      linkedin: string
      businessHours: {
        monday: { open: string; close: string; closed: boolean }
        tuesday: { open: string; close: string; closed: boolean }
        wednesday: { open: string; close: string; closed: boolean }
        thursday: { open: string; close: string; closed: boolean }
        friday: { open: string; close: string; closed: boolean }
        saturday: { open: string; close: string; closed: boolean }
        sunday: { open: string; close: string; closed: boolean }
      }
    } = {
      name: 'GNTech Demo',
      rnc: '000-00000-0',
      address: 'Santo Domingo, República Dominicana',
      phone: '809-555-5555',
      email: 'info@gntech.com',
      logo: undefined,
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '18:00', closed: true }
      }
    }

    // Override with database values
    settings.forEach((setting: { key: string; value: string }) => {
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
        case 'business_logo':
          businessData.logo = setting.value
          break
        case 'business_facebook':
          businessData.facebook = setting.value
          break
        case 'business_instagram':
          businessData.instagram = setting.value
          break
        case 'business_twitter':
          businessData.twitter = setting.value
          break
        case 'business_linkedin':
          businessData.linkedin = setting.value
          break
        case 'business_hours_monday':
          try {
            businessData.businessHours.monday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_tuesday':
          try {
            businessData.businessHours.tuesday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_wednesday':
          try {
            businessData.businessHours.wednesday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_thursday':
          try {
            businessData.businessHours.thursday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_friday':
          try {
            businessData.businessHours.friday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_saturday':
          try {
            businessData.businessHours.saturday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
          break
        case 'business_hours_sunday':
          try {
            businessData.businessHours.sunday = JSON.parse(setting.value)
          } catch (_) {
            // Keep default if parsing fails
          }
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
      { key: 'business_email', value: businessData.email || '', description: 'Email de la empresa' },
      { key: 'business_logo', value: businessData.logo || '', description: 'Logo de la empresa' },
      { key: 'business_facebook', value: businessData.facebook || '', description: 'Facebook de la empresa' },
      { key: 'business_instagram', value: businessData.instagram || '', description: 'Instagram de la empresa' },
      { key: 'business_twitter', value: businessData.twitter || '', description: 'Twitter de la empresa' },
      { key: 'business_linkedin', value: businessData.linkedin || '', description: 'LinkedIn de la empresa' },
      { key: 'business_hours_monday', value: JSON.stringify(businessData.businessHours?.monday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de lunes' },
      { key: 'business_hours_tuesday', value: JSON.stringify(businessData.businessHours?.tuesday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de martes' },
      { key: 'business_hours_wednesday', value: JSON.stringify(businessData.businessHours?.wednesday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de miércoles' },
      { key: 'business_hours_thursday', value: JSON.stringify(businessData.businessHours?.thursday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de jueves' },
      { key: 'business_hours_friday', value: JSON.stringify(businessData.businessHours?.friday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de viernes' },
      { key: 'business_hours_saturday', value: JSON.stringify(businessData.businessHours?.saturday || { open: '09:00', close: '18:00', closed: false }), description: 'Horario de sábado' },
      { key: 'business_hours_sunday', value: JSON.stringify(businessData.businessHours?.sunday || { open: '09:00', close: '18:00', closed: true }), description: 'Horario de domingo' }
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