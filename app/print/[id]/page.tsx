import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getNCFExpirationInfo } from '@/lib/ncf'
import PrintDocument from '@/components/PrintPage'
import fs from 'fs'
import path from 'path'

interface PrintPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

// Function to convert logo to data URL
function convertLogoToDataUrl(logoPath: string | null): string | null {
  if (!logoPath) {
    console.log('convertLogoToDataUrl: logoPath is null or empty')
    return null
  }

  console.log('convertLogoToDataUrl: Processing logoPath:', logoPath)

  try {
    let fullPath: string

    if (logoPath.startsWith('/logos/')) {
      // Pre-made logos in public/logos/
      fullPath = path.join(process.cwd(), 'public', logoPath)
    } else if (logoPath.startsWith('/api/storage/uploads/')) {
      // Uploaded logos in storage/uploads/
      const filename = logoPath.replace('/api/storage/uploads/', '')
      fullPath = path.join(process.cwd(), 'storage', 'uploads', filename)
    } else {
      // Unknown path, return as is
      console.log('convertLogoToDataUrl: Unknown logo path format')
      return logoPath
    }

    console.log('convertLogoToDataUrl: Full path:', fullPath)

    if (fs.existsSync(fullPath)) {
      console.log('convertLogoToDataUrl: File exists, reading content...')
      const fileContent = fs.readFileSync(fullPath)
      console.log('convertLogoToDataUrl: File content length:', fileContent.length)

      // Determine mime type
      const ext = fullPath.split('.').pop()?.toLowerCase()
      let mimeType = 'image/png' // default

      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else if (ext === 'png') mimeType = 'image/png'
      else if (ext === 'gif') mimeType = 'image/gif'
      else if (ext === 'webp') mimeType = 'image/webp'
      else if (ext === 'svg') mimeType = 'image/svg+xml'

      const base64 = fileContent.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64}`
      console.log('convertLogoToDataUrl: Generated data URL, length:', dataUrl.length)
      return dataUrl
    } else {
      console.log('convertLogoToDataUrl: File does not exist at path:', fullPath)
    }
  } catch (error) {
    console.error('convertLogoToDataUrl: Error converting logo to data URL:', error)
  }

  console.log('convertLogoToDataUrl: Returning original logoPath')
  return logoPath
}

export default async function PrintPage({ params, searchParams }: PrintPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const saleId = resolvedParams.id
  const rawType = resolvedSearchParams.type || 'thermal'
  // Map 'receipt' to 'thermal' for backward compatibility
  const type = rawType === 'receipt' ? 'thermal' : rawType

  // Fetch sale data
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true,
      cashier: true
    }
  })

  if (!sale) {
    notFound()
  }

  // Fetch business settings
  const businessSettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email', 'business_logo']
      }
    }
  })

  // Transform to object format
  const businessData = {
    name: 'GNTech Demo',
    rnc: '000-00000-0',
    address: 'Santo Domingo, República Dominicana',
    phone: '809-555-5555',
    email: 'info@gntech.com',
    logo: null as string | null
  }

  // Override with database values
  businessSettings.forEach(setting => {
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
    }
  })

  // Convert logo to data URL for PDF generation
  businessData.logo = convertLogoToDataUrl(businessData.logo)

  // Fetch NCF expiration data server-side
  let ncfExpiration = null
  if (sale.ncf) {
    try {
      ncfExpiration = await getNCFExpirationInfo(sale.ncf)
    } catch (error) {
      console.error('Error fetching NCF expiration:', error)
      ncfExpiration = null
    }
  }

  return (
    <PrintDocument sale={sale} type={type as 'thermal' | 'invoice'} ncfExpiration={ncfExpiration} businessSettings={businessData} />
  )
}
