// Removed unused imports: useState, useEffect

interface SaleItem {
  product: {
    name: string
  }
  quantity: number
  unitPrice: number
  discount: number
}

interface Sale {
  saleNumber: string
  createdAt: string | Date
  ncf?: string | null
  customer?: {
    name: string
    rnc?: string | null
    cedula?: string | null
  } | null
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
}

interface ThermalReceiptProps {
  sale: Sale
  ncfExpiration?: NCFExpirationInfo | null
}

interface NCFExpirationInfo {
  expiryDate: Date | string | null
  daysUntilExpiry: number | null
  isExpired: boolean
}

interface BusinessSettings {
  name: string
  rnc: string
  address: string
  phone: string
  email: string
}

interface ThermalReceiptProps {
  sale: Sale
  ncfExpiration?: NCFExpirationInfo | null
  businessSettings?: BusinessSettings
}

export default function ThermalReceipt({ sale, ncfExpiration, businessSettings }: ThermalReceiptProps) {
  // Use passed ncfExpiration data or fallback to default values
  const ncfInfo: NCFExpirationInfo = ncfExpiration || {
    expiryDate: null,
    daysUntilExpiry: null,
    isExpired: false
  }

  return (
    <div className="thermal-receipt bg-white p-4 max-w-[80mm] mx-auto text-black">
      {/* Header */}
      <div className="text-center mb-3 border-b-2 border-dashed border-gray-400 pb-3">
        <h1 className="text-lg font-bold">🏪 GNTech POS</h1>
        <p className="text-xs mt-1">Sistema de Punto de Venta</p>
        <p className="text-xs">República Dominicana 🇩🇴</p>
      </div>

      {/* Sale Info */}
      <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
        <p className="font-bold text-sm">RECIBO #{sale.saleNumber}</p>
        <p className="text-xs">{new Date(sale.createdAt).toLocaleString('es-DO')}</p>
        {sale.ncf && (
          <div className="text-xs font-mono mt-1 bg-gray-100 px-2 py-1 inline-block">
            <p>NCF: {sale.ncf}</p>
            {ncfInfo.expiryDate && (
              <p className="text-xs text-gray-600 mt-1">
                Vence: {new Date(ncfInfo.expiryDate).toLocaleDateString('es-DO')}
                {ncfInfo.daysUntilExpiry !== null && (
                  <span className={`ml-1 ${ncfInfo.daysUntilExpiry < 30 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    ({ncfInfo.daysUntilExpiry > 0 ? `${ncfInfo.daysUntilExpiry} días` : 'EXPIRADO'})
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Customer */}
      {sale.customer && (
        <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
          <p className="text-xs font-bold">Cliente: {sale.customer.name}</p>
          {sale.customer.rnc && <p className="text-xs">RNC: {sale.customer.rnc}</p>}
          {sale.customer.cedula && <p className="text-xs">Cédula: {sale.customer.cedula}</p>}
        </div>
      )}

      {/* Items */}
      <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
        {sale.items.map((item: SaleItem, index: number) => (
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
          <span>RD$ {sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>ITBIS (18%):</span>
          <span>RD$ {sale.tax.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-xs mb-1">
            <span>Descuento:</span>
            <span>-RD$ {sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base mt-2">
          <span>TOTAL:</span>
          <span>RD$ {sale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
        <p className="text-xs">
          Pago: <span className="font-bold">
            {sale.paymentMethod === 'CASH' ? 'Efectivo' : 
             sale.paymentMethod === 'CARD' ? 'Tarjeta' : 
             sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'}
          </span>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs font-bold mb-1">¡Gracias por su compra! 🎉</p>
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
