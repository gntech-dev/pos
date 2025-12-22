interface QuotationItem {
  product: {
    name: string
    sku: string
  }
  quantity: number
  unitPrice: number
  discount: number
}

interface Quotation {
  quotationNumber: string
  createdAt: string | Date
  expiresAt: string | Date
  customer?: {
    name: string
    rnc?: string | null
    cedula?: string | null
  } | null
  items: QuotationItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  notes?: string | null
}

interface QuotationThermalProps {
  quotation: Quotation
  businessSettings?: {
    name: string
    rnc: string
    address: string
    phone: string
    email: string
  }
}

export default function QuotationThermal({ quotation, businessSettings }: QuotationThermalProps) {
  return (
    <div className="thermal-receipt bg-white p-4 max-w-[80mm] mx-auto text-black">
      {/* Header */}
      <div className="text-center mb-3 border-b-2 border-dashed border-gray-400 pb-3">
        <h1 className="text-lg font-bold">{businessSettings?.name || 'GNTech POS'}</h1>
        <p className="text-xs mt-1">{businessSettings?.address || 'Sistema de Punto de Venta'}</p>
        <p className="text-xs">RNC: {businessSettings?.rnc || '000-00000-0'}</p>
      </div>

      {/* Quotation Info */}
      <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
        <p className="font-bold text-sm">COTIZACIÓN #{quotation.quotationNumber}</p>
        <p className="text-xs">{new Date(quotation.createdAt).toLocaleString('es-DO')}</p>
        <p className="text-xs mt-1">Válida hasta: {new Date(quotation.expiresAt).toLocaleDateString('es-DO')}</p>
      </div>

      {/* Customer */}
      {quotation.customer && (
        <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
          <p className="text-xs font-bold">Cliente: {quotation.customer.name}</p>
          {quotation.customer.rnc && <p className="text-xs">RNC: {quotation.customer.rnc}</p>}
          {quotation.customer.cedula && <p className="text-xs">Cédula: {quotation.customer.cedula}</p>}
        </div>
      )}

      {/* Items */}
      <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
        {quotation.items.map((item: QuotationItem, index: number) => (
          <div key={index} className="mb-2">
            <p className="text-xs font-bold">{item.product.name}</p>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x RD$ {item.unitPrice.toFixed(2)}</span>
              <span className="font-bold">RD$ {(item.unitPrice * item.quantity - item.discount).toFixed(2)}</span>
            </div>
            {item.discount > 0 && (
              <p className="text-xs text-gray-600">Desc: -RD$ {item.discount.toFixed(2)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mb-3 pb-3 border-b-2 border-dashed border-gray-400">
        <div className="flex justify-between text-xs mb-1">
          <span>Subtotal:</span>
          <span>RD$ {quotation.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>ITBIS (18%):</span>
          <span>RD$ {quotation.tax.toFixed(2)}</span>
        </div>
        {quotation.discount > 0 && (
          <div className="flex justify-between text-xs mb-1">
            <span>Descuento:</span>
            <span>-RD$ {quotation.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base mt-2">
          <span>TOTAL:</span>
          <span>RD$ {quotation.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
        <p className="text-xs">
          Estado: <span className="font-bold">
            {quotation.status === 'PENDING' ? 'Pendiente' :
             quotation.status === 'APPROVED' ? 'Aprobada' :
             quotation.status === 'REJECTED' ? 'Rechazada' :
             quotation.status === 'EXPIRED' ? 'Expirada' : 'Convertida'}
          </span>
        </p>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
          <p className="text-xs font-bold">Notas:</p>
          <p className="text-xs">{quotation.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs font-bold mb-1">Cotización válida por 30 días 📋</p>
        <p className="text-xs text-gray-600">{businessSettings?.email || 'info@gntech.com'}</p>
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