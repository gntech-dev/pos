// Removed unused imports: useState, useEffect

interface Product {
  id: string
  name: string
  sku: string
  price: number
  taxRate: number
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

interface BusinessSettings {
  name: string
  rnc: string
  address: string
  phone: string
  email: string
}

interface A4InvoiceProps {
  sale: Sale
  ncfExpiration?: NCFExpirationInfo | null
  businessSettings?: BusinessSettings
}

export default function A4Invoice({ sale, ncfExpiration, businessSettings }: A4InvoiceProps) {
  // Use passed ncfExpiration data or fallback to default values
  const ncfInfo: NCFExpirationInfo = ncfExpiration || {
    expiryDate: null,
    daysUntilExpiry: null,
    isExpired: false
  }

  return (
    <div className="a4-invoice bg-white p-12 max-w-[210mm] mx-auto text-black">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-indigo-600">
        <div>
          <h1 className="text-4xl font-bold text-indigo-600">🏪 GNTech</h1>
          <p className="text-sm mt-2">Sistema de Punto de Venta</p>
          <p className="text-sm">RNC: 000-00000-0</p>
          <p className="text-sm">Santo Domingo, República Dominicana</p>
          <p className="text-sm">Tel: 809-555-5555</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800">FACTURA</h2>
          <p className="text-sm mt-2">#{sale.saleNumber}</p>
          <p className="text-sm">{new Date(sale.createdAt).toLocaleDateString('es-DO')}</p>
          {sale.ncf && (
            <div className="mt-3 bg-gray-100 px-4 py-2 rounded">
              <p className="text-xs font-bold">NCF</p>
              <p className="text-sm font-mono">{sale.ncf}</p>
              {ncfInfo.expiryDate && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">Fecha de Vencimiento:</p>
                  <p className={`text-sm font-semibold ${ncfInfo.daysUntilExpiry !== null && ncfInfo.daysUntilExpiry < 30 ? 'text-red-600' : 'text-gray-800'}`}>
                    {new Date(ncfInfo.expiryDate).toLocaleDateString('es-DO')}
                  </p>
                  {ncfInfo.daysUntilExpiry !== null && (
                    <p className={`text-xs mt-1 ${ncfInfo.daysUntilExpiry < 0 ? 'text-red-600 font-bold' : ncfInfo.daysUntilExpiry < 30 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                      {ncfInfo.daysUntilExpiry > 0
                        ? `Vence en ${ncfInfo.daysUntilExpiry} días`
                        : ncfInfo.daysUntilExpiry === 0
                          ? 'Vence hoy'
                          : 'NCF EXPIRADO'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      {sale.customer && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-sm mb-2">FACTURADO A:</h3>
          <p className="text-sm font-bold">{sale.customer.name}</p>
          {sale.customer.rnc && <p className="text-sm">RNC: {sale.customer.rnc}</p>}
          {sale.customer.cedula && <p className="text-sm">Cédula: {sale.customer.cedula}</p>}
          {sale.customer.address && <p className="text-sm">Dirección: {sale.customer.address}</p>}
          {sale.customer.phone && <p className="text-sm">Tel: {sale.customer.phone}</p>}
        </div>
      )}

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-indigo-600 text-white">
            <th className="text-left p-3 text-sm">Producto</th>
            <th className="text-center p-3 text-sm">Cant.</th>
            <th className="text-right p-3 text-sm">Precio Unit.</th>
            <th className="text-right p-3 text-sm">Descuento</th>
            <th className="text-right p-3 text-sm">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index: number) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="p-3 text-sm">
                <p className="font-semibold">{item.product.name}</p>
                <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
              </td>
              <td className="text-center p-3 text-sm">{item.quantity}</td>
              <td className="text-right p-3 text-sm">RD$ {item.unitPrice.toFixed(2)}</td>
              <td className="text-right p-3 text-sm">
                {item.discount > 0 ? `-RD$ ${item.discount.toFixed(2)}` : '-'}
              </td>
              <td className="text-right p-3 text-sm font-bold">
                RD$ {(item.unitPrice * item.quantity - item.discount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal:</span>
            <span>RD$ {sale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>ITBIS (18%):</span>
            <span>RD$ {sale.tax.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span>Descuento:</span>
              <span className="text-red-600">-RD$ {sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-3 mt-2">
            <span>TOTAL:</span>
            <span className="text-indigo-600">RD$ {sale.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-8 bg-green-50 p-4 rounded-lg">
        <p className="text-sm">
          <span className="font-bold">Método de Pago:</span>{' '}
          {sale.paymentMethod === 'CASH' ? 'Efectivo' :
           sale.paymentMethod === 'CARD' ? 'Tarjeta' :
           sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
        <p className="mb-2">¡Gracias por su preferencia!</p>
        <p>Este documento es una representación impresa de una factura electrónica</p>
        <p className="mt-2">{businessSettings?.email || 'info@gntech.com'}</p>
      </div>

      <style jsx>{`
        @media print {
          .a4-invoice {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 15mm !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
