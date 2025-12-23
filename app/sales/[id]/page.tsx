'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Sale {
  id: string
  saleNumber: string
  ncf: string
  ncfType: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  paymentMethod: string
  notes?: string
  createdAt: string
  customer?: {
    name: string
    rnc?: string
    cedula?: string
    email?: string
    phone?: string
    address?: string
  }
  cashier: {
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    taxRate: number
    discount: number
    subtotal: number
    total: number
    product: {
      name: string
      sku: string
    }
  }>
}

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadSale = useCallback(async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`)
      if (response.ok) {
        const saleData = await response.json()
        setSale(saleData)
      } else {
        alert('Error al cargar la venta')
        router.push('/sales')
      }
    } catch (error) {
      console.error('Error loading sale:', error)
      alert('Error al cargar la venta')
      router.push('/sales')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    loadSale()
  }, [loadSale])

  const handlePrintThermal = async () => {
    try {
      const printWindow = window.open(`/print/${sale?.id}?type=thermal`, '_blank', 'width=400,height=600')
      if (printWindow) {
        printWindow.focus()
      }
    } catch (error) {
      console.error('Error opening print window:', error)
      alert('Error al abrir la ventana de impresión')
    }
  }

  const handlePrintA4 = async () => {
    try {
      const printWindow = window.open(`/print/${sale?.id}?type=a4`, '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.focus()
      }
    } catch (error) {
      console.error('Error opening print window:', error)
      alert('Error al abrir la ventana de impresión')
    }
  }

  const handleEmail = async () => {
    if (!sale?.customer?.email) {
      alert('El cliente no tiene email registrado')
      return
    }

    const email = prompt('Ingresa el email del destinatario:', sale.customer.email)
    if (!email) return

    try {
      const response = await fetch('/api/sales/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: params.id, email })
      })

      if (response.ok) {
        alert('✅ Factura enviada por email exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error al enviar el email')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '✅ Completada'
      case 'PENDING': return '⏳ Pendiente'
      case 'CANCELLED': return '❌ Cancelada'
      default: return status
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'CASH': return '💵 Efectivo'
      case 'CARD': return '💳 Tarjeta'
      case 'TRANSFER': return '🏦 Transferencia'
      case 'MIXED': return '🔄 Mixto'
      case 'CHECK': return '📝 Cheque'
      case 'OTHER': return '🔄 Otro'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando venta...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Venta no encontrada</h1>
          <p className="text-gray-600 mb-4">La venta que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => router.push('/sales')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← Volver a Ventas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🧾 Venta #{sale.saleNumber}
            </h1>
            <p className="text-gray-600 text-sm mt-1">Detalles de la venta completada</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/sales')}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              ← Volver
            </button>

            {/* Actions Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg"
              >
                ⚡ Acciones
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <div className="p-2">
                    <button
                      onClick={handlePrintThermal}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      🖨️ Imprimir Recibo Térmico
                    </button>
                    <button
                      onClick={handlePrintA4}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      📄 Imprimir Factura A4
                    </button>
                    {sale.customer?.email && (
                      <button
                        onClick={handleEmail}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                      >
                        📧 Enviar por Email
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sale Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Sale Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Información de Venta
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Número de Venta</p>
                <p className="font-semibold text-gray-900">{sale.saleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">NCF</p>
                <p className="font-semibold text-gray-900 font-mono text-sm">{sale.ncf}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo NCF</p>
                <p className="font-semibold text-gray-900">{sale.ncfType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                  {getStatusText(sale.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-semibold text-gray-900">{formatDate(sale.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cajero</p>
                <p className="font-semibold text-gray-900">{sale.cashier.name}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Información del Cliente
            </h2>
            {sale.customer ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold text-gray-900">{sale.customer.name}</p>
                </div>
                {sale.customer.rnc && (
                  <div>
                    <p className="text-sm text-gray-600">RNC</p>
                    <p className="font-semibold text-gray-900">{sale.customer.rnc}</p>
                  </div>
                )}
                {sale.customer.cedula && (
                  <div>
                    <p className="text-sm text-gray-600">Cédula</p>
                    <p className="font-semibold text-gray-900">{sale.customer.cedula}</p>
                  </div>
                )}
                {sale.customer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{sale.customer.email}</p>
                  </div>
                )}
                {sale.customer.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold text-gray-900">{sale.customer.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👤</div>
                <p>Cliente Público</p>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Información de Pago
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Método de Pago</p>
                <p className="font-semibold text-gray-900">{getPaymentMethodText(sale.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-semibold text-gray-900">{formatCurrency(sale.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ITBIS (18%)</p>
                <p className="font-semibold text-gray-900">{formatCurrency(sale.tax)}</p>
              </div>
              {sale.discount > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Descuento</p>
                  <p className="font-semibold text-red-600">-{formatCurrency(sale.discount)}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-lg font-bold text-gray-900">Total: {formatCurrency(sale.total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📦</span>
              Productos ({sale.items.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sale.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600">
                        {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{formatCurrency(item.subtotal)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Notas
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}