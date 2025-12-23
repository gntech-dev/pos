'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Quotation {
  id: string
  quotationNumber: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  expiresAt: string
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
  user: {
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

export default function QuotationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadQuotation = useCallback(async () => {
    if (!params.id) return
    
    try {
      const response = await fetch(`/api/quotations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuotation(data)
      } else {
        alert('Cotización no encontrada')
        router.push('/quotations')
      }
    } catch (error) {
      console.error('Error loading quotation:', error)
      alert('Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      loadQuotation()
    }
  }, [params.id, loadQuotation])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false)
      }
    }

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  const handlePrint = async (type: 'quotation' | 'quotation_a4' = 'quotation') => {
    try {
      const printWindow = window.open(`/quotations/print/${params.id}?type=${type}`, '_blank')
      if (printWindow) {
        printWindow.focus()
      }
    } catch (error) {
      console.error('Error opening print window:', error)
      alert('Error al abrir la ventana de impresión')
    }
  }

  const handleEmail = async () => {
    if (!quotation?.customer?.email) {
      alert('El cliente no tiene email registrado')
      return
    }

    const email = prompt('Ingresa el email del destinatario:', quotation.customer.email)
    if (!email) return

    try {
      const response = await fetch('/api/quotations/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId: params.id, email })
      })

      if (response.ok) {
        alert('✅ Cotización enviada por email exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error al enviar el email')
    }
  }

  const handleConvertToSale = async () => {
    if (!confirm('¿Estás seguro de que quieres convertir esta cotización en una venta?')) {
      return
    }

    try {
      const paymentMethod = prompt('Método de pago (CASH, CARD, TRANSFER, MIXED, CHECK, OTHER):', 'CASH')
      if (!paymentMethod) return

      const response = await fetch(`/api/quotations/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod })
      })

      if (response.ok) {
        const result = await response.json()
        alert('✅ Cotización convertida a venta exitosamente')
        router.push(`/sales/${result.sale.id}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error converting quotation:', error)
      alert('Error al convertir la cotización')
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      case 'CONVERTED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳ Pendiente'
      case 'APPROVED': return '✅ Aprobada'
      case 'REJECTED': return '❌ Rechazada'
      case 'EXPIRED': return '⏰ Expirada'
      case 'CONVERTED': return '🔄 Convertida'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Cotización no encontrada</h3>
            <button
              onClick={() => router.push('/quotations')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg font-semibold"
            >
              ← Volver a Cotizaciones
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📋 Cotización {quotation.quotationNumber}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Creada el {formatDate(quotation.createdAt)} • Expira el {formatDate(quotation.expiresAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all duration-200 font-semibold shadow-md"
              >
                ⚡ Acciones
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Imprimir</div>
                    <button
                      onClick={() => {
                        handlePrint('quotation')
                        setShowActionsMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      🧾 Cotización (80mm)
                    </button>
                    <button
                      onClick={() => {
                        handlePrint('quotation_a4')
                        setShowActionsMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      📄 Cotización (A4)
                    </button>

                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Email</div>
                    <button
                      onClick={() => {
                        handleEmail()
                        setShowActionsMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      📧 Enviar por Email
                    </button>

                    {quotation?.status === 'PENDING' && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Acciones</div>
                        <button
                          onClick={() => {
                            handleConvertToSale()
                            setShowActionsMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          🛒 Convertir a Venta
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/quotations')}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(quotation.status)}`}>
            {getStatusText(quotation.status)}
          </span>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Información del Cliente
          </h2>
          {quotation.customer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{quotation.customer.name}</h3>
                {quotation.customer.rnc && (
                  <p className="text-sm text-gray-600">RNC: {quotation.customer.rnc}</p>
                )}
                {quotation.customer.cedula && (
                  <p className="text-sm text-gray-600">Cédula: {quotation.customer.cedula}</p>
                )}
              </div>
              <div>
                {quotation.customer.email && (
                  <p className="text-sm text-gray-600">📧 {quotation.customer.email}</p>
                )}
                {quotation.customer.phone && (
                  <p className="text-sm text-gray-600">📞 {quotation.customer.phone}</p>
                )}
                {quotation.customer.address && (
                  <p className="text-sm text-gray-600">📍 {quotation.customer.address}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Cliente Público</p>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Productos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Cant.</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Precio</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Desc.</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Subtotal</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotation.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.product.sku}</td>
                    <td className="px-6 py-4 text-right text-sm">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(item.discount)}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(item.subtotal)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Totals */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-semibold">{formatCurrency(quotation.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ITBIS (18%):</span>
                <span className="font-semibold">{formatCurrency(quotation.tax)}</span>
              </div>
              <div className="border-t border-indigo-300 pt-2 flex justify-between">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notas</h2>
            {quotation.notes ? (
              <p className="text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
            ) : (
              <p className="text-gray-500 italic">Sin notas adicionales</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}