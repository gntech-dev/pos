'use client'

import Image from 'next/image'
import { formatDate, formatCurrency } from '@/lib/utils'

// Helper function to convert relative logo paths to absolute URLs
function getAbsoluteLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null

  // If it's already an absolute URL or data URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:')) {
    return logoPath
  }

  // Get base URL from environment or construct it
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

  // Remove leading slash if present and construct full URL
  const cleanPath = logoPath.startsWith('/') ? logoPath.substring(1) : logoPath
  return `${baseUrl}/${cleanPath}`
}

interface RefundItem {
  product: {
    name: string
    sku: string
  }
  quantity: number
  unitPrice: number
  subtotal: number
  total: number
}

interface Refund {
  refundNumber: string
  ncf?: string | null
  ncfType?: string | null
  createdAt: string | Date
  reason?: string | null
  sale: {
    saleNumber: string
    ncf?: string | null
  }
  customer?: {
    name: string
    rnc?: string | null
    cedula?: string | null
  } | null
  user: {
    name: string
    username: string
  }
  items: RefundItem[]
  subtotal: number
  tax: number
  total: number
}

interface BusinessSettings {
  name: string
  rnc: string
  address: string
  phone: string
  email: string
  logo?: string | null
}

interface CreditNoteThermalProps {
  refund: Refund
  businessSettings?: BusinessSettings | null
}

export default function CreditNoteThermal({ refund, businessSettings }: CreditNoteThermalProps) {
  const logoUrl = getAbsoluteLogoUrl(businessSettings?.logo)

  return (
    <div className="thermal-receipt bg-white text-black font-mono text-sm max-w-xs mx-auto p-4 border border-gray-300">
      {/* Header */}
      <div className="text-center mb-3">
        {logoUrl && (
          <div className="mb-2">
            <Image
              src={logoUrl}
              alt="Logo"
              width={60}
              height={60}
              className="mx-auto object-contain"
            />
          </div>
        )}
        <h1 className="text-lg font-bold mb-1">{businessSettings?.name || 'GNTECH POS'}</h1>
        <p className="text-xs mb-1">RNC: {businessSettings?.rnc || 'N/A'}</p>
        <p className="text-xs mb-1">{businessSettings?.address || 'Dirección no especificada'}</p>
        <p className="text-xs mb-2">Tel: {businessSettings?.phone || 'N/A'}</p>
      </div>

      {/* Credit Note Title */}
      <div className="text-center mb-3 pb-2 border-b-2 border-dashed border-gray-400">
        <h2 className="text-lg font-bold">NOTA DE CRÉDITO</h2>
        <p className="text-xs font-bold">NCF: {refund.ncf || 'SIN NCF'}</p>
        <p className="text-xs">Tipo: {refund.ncfType || 'B04'}</p>
      </div>

      {/* Reference to Original Invoice */}
      <div className="mb-3">
        <p className="text-xs mb-1">
          <span className="font-bold">Factura Original:</span> {refund.sale.saleNumber}
        </p>
        {refund.sale.ncf && (
          <p className="text-xs mb-1">
            <span className="font-bold">NCF Original:</span> {refund.sale.ncf}
          </p>
        )}
        <p className="text-xs mb-1">
          <span className="font-bold">Reembolso:</span> {refund.refundNumber}
        </p>
      </div>

      {/* Customer Info */}
      {refund.customer && (
        <div className="mb-3 pb-2 border-b border-dashed border-gray-300">
          <p className="text-xs font-bold mb-1">Cliente:</p>
          <p className="text-xs">{refund.customer.name}</p>
          {refund.customer.rnc && <p className="text-xs">RNC: {refund.customer.rnc}</p>}
          {refund.customer.cedula && <p className="text-xs">Cédula: {refund.customer.cedula}</p>}
        </div>
      )}

      {/* Items */}
      <div className="mb-3">
        <div className="border-b border-dashed border-gray-300 mb-2">
          <p className="text-xs font-bold">Productos Devueltos:</p>
        </div>
        {refund.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between text-xs">
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-gray-600">SKU: {item.product.sku}</p>
                <p className="text-gray-600">
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(item.total)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mb-3 pb-2 border-t border-dashed border-gray-300">
        <div className="flex justify-between text-xs mb-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(refund.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>ITBIS:</span>
          <span>{formatCurrency(refund.tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-300 pt-1">
          <span>TOTAL A CRÉDITO:</span>
          <span>{formatCurrency(refund.total)}</span>
        </div>
      </div>

      {/* Reason */}
      {refund.reason && (
        <div className="mb-3 pb-2 border-b border-dashed border-gray-300">
          <p className="text-xs font-bold mb-1">Razón de la devolución:</p>
          <p className="text-xs">{refund.reason}</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center mb-3 pb-2 border-b border-dashed border-gray-300">
        <p className="text-xs">
          Cajero: <span className="font-bold">{refund.user.name} ({refund.user.username})</span>
        </p>
        <p className="text-xs">
          Fecha: <span className="font-bold">{formatDate(refund.createdAt)}</span>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs font-bold mb-1">Nota de Crédito - DGII Compliant 🎉</p>
        <p className="text-xs text-gray-600">{businessSettings?.email || 'info@gntech.com'}</p>
        <p className="text-xs text-gray-600 mt-1">Este documento es válido para fines fiscales</p>
      </div>

      <style jsx>{`
        @media print {
          .thermal-receipt {
            width: 80mm !important;
            max-width: 80mm !important;
            font-size: 12px !important;
            margin: 0 !important;
            padding: 5mm !important;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}