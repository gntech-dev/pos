import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QuotationPrintDocument from '@/components/QuotationPrintPage'

interface PrintPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function QuotationPrintPage({ params, searchParams }: PrintPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const quotationId = resolvedParams.id
  const type = resolvedSearchParams.type || 'quotation'

  // Fetch quotation data
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true,
      user: true
    }
  })

  if (!quotation) {
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
  businessSettings.forEach((setting: { key: string; value: string }) => {
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

  return (
    <QuotationPrintDocument quotation={quotation} type={type as 'quotation' | 'quotation_a4'} businessSettings={businessData} />
  )
}