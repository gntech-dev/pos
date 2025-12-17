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

  return (
    <QuotationPrintDocument quotation={quotation} type={type as 'quotation' | 'quotation_a4'} />
  )
}