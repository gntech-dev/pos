interface QuotationItem {
  product: {
    name: string
    sku: string
  }
  quantity: number
  unitPrice: number
  discount: number
}

interface QuotationCustomer {
  name: string
  rnc?: string | null
  cedula?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface Quotation {
  quotationNumber: string
  createdAt: string | Date
  expiresAt: string | Date
  customer?: QuotationCustomer | null
  items: QuotationItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  notes?: string | null
}

interface QuotationA4Props {
  quotation: Quotation
  businessSettings?: {
    name: string
    rnc: string
    address: string
    phone: string
    email: string
  }
}

export default function QuotationA4({ quotation, businessSettings }: QuotationA4Props) {
  return (
    <div className="a4-quotation bg-white p-12 max-w-[210mm] mx-auto text-black">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-indigo-600">
        <div>
          <h1 className="text-4xl font-bold text-indigo-600">{businessSettings?.name || 'GNTech POS'}</h1>
          <p className="text-sm mt-2">{businessSettings?.address || 'Santo Domingo, República Dominicana'}</p>
          <p className="text-sm">RNC: {businessSettings?.rnc || '000-00000-0'}</p>
          <p className="text-sm">Tel: {businessSettings?.phone || '809-555-5555'}</p>
          {businessSettings?.email && <p className="text-sm">Email: {businessSettings.email}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800">COTIZACIÓN</h2>
          <p className="text-sm mt-2">#{quotation.quotationNumber}</p>
          <p className="text-sm">Fecha: {new Date(quotation.createdAt).toLocaleDateString('es-DO')}</p>
          <div className="mt-3 bg-yellow-100 px-4 py-2 rounded">
            <p className="text-xs font-bold">VÁLIDA HASTA</p>
            <p className="text-sm font-bold">{new Date(quotation.expiresAt).toLocaleDateString('es-DO')}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      {quotation.customer && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-sm mb-2">COTIZADO A:</h3>
          <p className="text-sm font-bold">{quotation.customer.name}</p>
          {quotation.customer.rnc && <p className="text-sm">RNC: {quotation.customer.rnc}</p>}
          {quotation.customer.cedula && <p className="text-sm">Cédula: {quotation.customer.cedula}</p>}
          {quotation.customer.address && <p className="text-sm">Dirección: {quotation.customer.address}</p>}
          {quotation.customer.phone && <p className="text-sm">Tel: {quotation.customer.phone}</p>}
          {quotation.customer.email && <p className="text-sm">Email: {quotation.customer.email}</p>}
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
          {quotation.items.map((item: QuotationItem, index: number) => (
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
            <span>RD$ {quotation.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>ITBIS (18%):</span>
            <span>RD$ {quotation.tax.toFixed(2)}</span>
          </div>
          {quotation.discount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span>Descuento:</span>
              <span className="text-red-600">-RD$ {quotation.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-3 mt-2">
            <span>TOTAL:</span>
            <span className="text-indigo-600">RD$ {quotation.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-8 bg-blue-50 p-4 rounded-lg">
        <p className="text-sm">
          <span className="font-bold">Estado de la Cotización:</span>{' '}
          {quotation.status === 'PENDING' ? 'Pendiente de Aprobación' :
           quotation.status === 'APPROVED' ? 'Aprobada' :
           quotation.status === 'REJECTED' ? 'Rechazada' :
           quotation.status === 'EXPIRED' ? 'Expirada' : 'Convertida a Venta'}
        </p>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-bold text-sm mb-2">Notas:</h3>
          <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
        <p className="mb-2">Esta cotización es válida por 30 días a partir de la fecha de emisión.</p>
        <p>Para aprobar esta cotización, por favor contacte a nuestro equipo de ventas.</p>
        <p className="mt-2">{businessSettings?.email || 'info@gntech.com'}</p>
      </div>

      <style jsx>{`
        @media print {
          .a4-quotation {
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