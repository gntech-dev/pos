'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  saleNumber: string
  total: number
  createdAt: string
  ncf?: string
  paymentMethod: string
  customer?: {
    name: string
    rnc?: string
  }
  cashier: {
    name: string
  }
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showActions, setShowActions] = useState(false)

  const loadSales = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSales(data.data)
        setTotalPages(Math.ceil(data.total / 20))
      }
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const handlePrint = async (saleId: string, type: 'receipt' | 'invoice') => {
    try {
      const printWindow = window.open(`/print/${saleId}?type=${type}`, '_blank')
      if (printWindow) {
        printWindow.focus()
      }
    } catch (error) {
      console.error('Error opening print window:', error)
      alert('Error al abrir la ventana de impresión')
    }
  }

  const handleEmail = async (sale: Sale, type: 'receipt' | 'invoice') => {
    const email = prompt('Ingresa el email del destinatario:')
    if (!email) return

    try {
      const response = await fetch('/api/sales/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: sale.id, email, type })
      })

      if (response.ok) {
        alert('✅ Email enviado exitosamente')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📊 Historial de Ventas
            </h1>
            <p className="text-gray-600 text-sm mt-1">Gestiona y reimprime tus ventas anteriores</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Buscar por número de venta, cliente o NCF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/pos')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg font-semibold"
              >
                ➕ Nueva Venta
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Venta</th>
                  <th className="px-6 py-4 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-4 text-left font-semibold">Total</th>
                  <th className="px-6 py-4 text-left font-semibold">Pago</th>
                  <th className="px-6 py-4 text-left font-semibold">Cajero</th>
                  <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{sale.saleNumber}</div>
                        {sale.ncf && (
                          <div className="text-xs text-gray-500 font-mono">{sale.ncf}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sale.customer ? (
                        <div>
                          <div className="font-medium text-gray-900">{sale.customer.name}</div>
                          {sale.customer.rnc && (
                            <div className="text-xs text-gray-500">RNC: {sale.customer.rnc}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Cliente Público</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                        sale.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-800' :
                        sale.paymentMethod === 'TRANSFER' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sale.paymentMethod === 'CASH' ? '💵 Efectivo' :
                         sale.paymentMethod === 'CARD' ? '💳 Tarjeta' :
                         sale.paymentMethod === 'TRANSFER' ? '🏦 Transferencia' :
                         '🔄 Mixto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.cashier.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => {
                              setSelectedSale(selectedSale?.id === sale.id ? null : sale)
                              setShowActions(!showActions)
                            }}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                          >
                            ⚡ Acciones
                          </button>

                          {selectedSale?.id === sale.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                              <div className="p-2">
                                <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Imprimir</div>
                                <button
                                  onClick={() => handlePrint(sale.id, 'receipt')}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                >
                                  🧾 Recibo (80mm)
                                </button>
                                <button
                                  onClick={() => handlePrint(sale.id, 'invoice')}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                >
                                  📄 Factura (A4)
                                </button>

                                <div className="border-t border-gray-200 my-2"></div>
                                <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Email</div>
                                <button
                                  onClick={() => handleEmail(sale, 'invoice')}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                >
                                  📧 Enviar Factura (PDF)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay ventas registradas</h3>
              <p className="text-gray-500 mb-4">Las ventas aparecerán aquí una vez que realices tu primera venta.</p>
              <button
                onClick={() => router.push('/pos')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg font-semibold"
              >
                🛒 Realizar Primera Venta
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}