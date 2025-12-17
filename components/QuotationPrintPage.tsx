'use client'

import { useEffect } from 'react'
import QuotationThermal from './QuotationThermal'
import QuotationA4 from './QuotationA4'

interface Quotation {
  quotationNumber: string
  createdAt: string | Date
  expiresAt: string | Date
  customer?: {
    name: string
    rnc?: string | null
    cedula?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
  } | null
  items: {
    product: {
      name: string
      sku: string
    }
    quantity: number
    unitPrice: number
    discount: number
  }[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  notes?: string | null
}

interface QuotationPrintDocumentProps {
  quotation: Quotation
  type: 'quotation' | 'quotation_a4'
}

export default function QuotationPrintDocument({ quotation, type }: QuotationPrintDocumentProps) {
  useEffect(() => {
    // Auto-print when component mounts
    const timer = setTimeout(() => {
      window.print()
      // Close window after printing
      setTimeout(() => {
        window.close()
      }, 1000)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="print-container">
      {type === 'quotation' ? (
        <QuotationThermal quotation={quotation} />
      ) : (
        <QuotationA4 quotation={quotation} />
      )}

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print-container {
            display: block !important;
          }

          /* Hide everything except the quotation */
          * {
            visibility: hidden;
          }

          .print-container,
          .print-container * {
            visibility: visible;
          }

          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
          }
        }

        @media screen {
          .print-container {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}