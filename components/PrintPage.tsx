'use client'

import { useEffect } from 'react'
import ThermalReceipt from './ThermalReceipt'
import A4Invoice from './A4Invoice'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  taxRate: number
  stock?: number
  minStock?: number
  trackInventory?: boolean
  barcode?: string | null
}

interface SaleItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

interface Customer {
  id: string
  name: string
  rnc?: string | null
  cedula?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface Sale {
  id: string
  saleNumber: string
  createdAt: Date | string
  customer?: Customer | null
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  ncf?: string | null
}

interface NCFExpirationInfo {
  expiryDate: Date | string | null
  daysUntilExpiry: number | null
  isExpired: boolean
}

interface PrintDocumentProps {
  sale: Sale
  type: 'thermal' | 'invoice'
  ncfExpiration?: NCFExpirationInfo | null
}

export default function PrintDocument({ sale, type, ncfExpiration }: PrintDocumentProps) {
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
      {type === 'thermal' ? (
        <ThermalReceipt sale={sale} ncfExpiration={ncfExpiration} />
      ) : (
        <A4Invoice sale={sale} ncfExpiration={ncfExpiration} />
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

          /* Hide everything except the receipt/invoice */
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
