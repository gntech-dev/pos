'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Quotation {
  id: string
  quotationNumber: string
  total: number
  status: string
  expiresAt: string
  createdAt: string
  customer?: {
    name: string
    rnc?: string
  }
  user: {
    name: string
  }
}

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [showActions, setShowActions] = useState(false)

  const loadQuotations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/quotations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setQuotations(data.data)
        setTotalPages(Math.ceil(data.total / 20))
      }
    } catch (error) {
      console.error('Error loading quotations:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    loadQuotations()
  }, [currentPage, searchTerm, loadQuotations])

  const handleConvertToSale = async (quotation: Quotation) => {
    if (!confirm('¿Estás seguro de que quieres convertir esta cotización en una venta?')) {
      return
    }

    try {
      const paymentMethod = prompt('Método de pago (CASH, CARD, TRANSFER, MIXED, CHECK, OTHER):', 'CASH')
      if (!paymentMethod) return

      const response = await fetch(`/api/quotations/${quotation.id}/convert`, {
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

  const handleDeleteQuotation = async (quotation: Quotation) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la cotización ${quotation.quotationNumber}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Cotización eliminada exitosamente')
        loadQuotations() // Reload the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting quotation:', error)
      alert('Error al eliminar la cotización')
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
              📋 Gestión de Cotizaciones
            </h1>
            <p className="text-gray-600 text-sm mt-1">Crea, gestiona y convierte cotizaciones en ventas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/quotations/new')}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg font-semibold"
            >
              ➕ Nueva Cotización
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
            >
              ← Volver al Panel
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Buscar por número de cotización, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Cotización</th>
                  <th className="px-6 py-4 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-4 text-left font-semibold">Vence</th>
                  <th className="px-6 py-4 text-left font-semibold">Total</th>
                  <th className="px-6 py-4 text-left font-semibold">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold">Usuario</th>
                  <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{quotation.quotationNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      {quotation.customer ? (
                        <div>
                          <div className="font-medium text-gray-900">{quotation.customer.name}</div>
                          {quotation.customer.rnc && (
                            <div className="text-xs text-gray-500">RNC: {quotation.customer.rnc}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Sin cliente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(quotation.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(quotation.expiresAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">{formatCurrency(quotation.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                        {getStatusText(quotation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quotation.user.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => {
                              setSelectedQuotation(selectedQuotation?.id === quotation.id ? null : quotation)
                              setShowActions(!showActions)
                            }}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                          >
                            ⚡ Acciones
                          </button>

                          {selectedQuotation?.id === quotation.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                              <div className="p-2">
                                <button
                                  onClick={() => router.push(`/quotations/${quotation.id}`)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                >
                                  👁️ Ver Detalles
                                </button>
                                <button
                                  onClick={() => router.push(`/quotations/${quotation.id}/edit`)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                >
                                  ✏️ Editar
                                </button>
                                {quotation.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleConvertToSale(quotation)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                                    >
                                      🛒 Convertir a Venta
                                    </button>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <button
                                      onClick={() => handleDeleteQuotation(quotation)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
                                    >
                                      🗑️ Eliminar
                                    </button>
                                  </>
                                )}
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

          {quotations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay cotizaciones registradas</h3>
              <p className="text-gray-500 mb-4">Las cotizaciones aparecerán aquí una vez que crees tu primera cotización.</p>
              <button
                onClick={() => router.push('/quotations/new')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg font-semibold"
              >
                📝 Crear Primera Cotización
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