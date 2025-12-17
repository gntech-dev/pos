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
    <PrintDocument sale={sale} type={type as 'thermal' | 'invoice'} ncfExpiration={ncfExpiration} />
  )
}
