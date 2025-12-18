import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getNCFExpirationInfo } from '@/lib/ncf'
import PrintDocument from '@/components/PrintPage'

interface PrintPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
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
      customer: true
    }
  })

  if (!sale) {
    notFound()
  }

  // Fetch business settings
  const businessSettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['business_name', 'business_rnc', 'business_address', 'business_phone', 'business_email']
      }
    }
  })

  // Transform to object format
  const businessData = {
    name: 'GNTech Demo',
    rnc: '000-00000-0',
    address: 'Santo Domingo, República Dominicana',
    phone: '809-555-5555',
    email: 'info@gntech.com'
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
    }
  })

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
