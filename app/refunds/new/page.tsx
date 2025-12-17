'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  saleNumber: string
  ncf?: string
  customer?: {
    name: string
    rnc?: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    product: {
      name: string
      sku: string
    }
  }>
}

interface RefundItem {
  saleItemId: string
  quantity: number
  reason?: string
}

export default function NewRefundPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [refundItems, setRefundItems] = useState<RefundItem[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])

  const searchSales = async () => {
    if (!searchTerm.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/sales?search=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSales(data.data)
      }
    } catch (error) {
      console.error('Error searching sales:', error)
    } finally {
      setSearching(false)
    }
  }

  const selectSale = (sale: Sale) => {
    setSelectedSale(sale)
    setSales([])
    setSearchTerm('')
    // Initialize refund items with 0 quantity
    const initialRefundItems = sale.items.map(item => ({
      saleItemId: item.id,
      quantity: 0,
      reason: ''
    }))
    setRefundItems(initialRefundItems)
  }

  const updateRefundQuantity = (saleItemId: string, quantity: number) => {
    const saleItem = selectedSale?.items.find(item => item.id === saleItemId)
    if (!saleItem || quantity < 0 || quantity > saleItem.quantity) return

    setRefundItems(refundItems.map(item =>
      item.saleItemId === saleItemId ? { ...item, quantity } : item
    ))
  }

  const updateRefundReason = (saleItemId: string, reason: string) => {
    setRefundItems(refundItems.map(item =>
      item.saleItemId === saleItemId ? { ...item, reason } : item
    ))
  }

  const getTotalRefund = () => {
    return refundItems.reduce((total, item) => {
      const saleItem = selectedSale?.items.find(si => si.id === item.saleItemId)
      if (!saleItem) return total
      return total + (item.quantity * saleItem.unitPrice)
    }, 0)
  }

  const handleSubmit = async () => {
    const itemsToRefund = refundItems.filter(item => item.quantity > 0)
    if (!selectedSale || itemsToRefund.length === 0) {
      alert('Seleccione una venta y al menos un producto para devolver')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          items: itemsToRefund,
          reason
        })
      })

      if (response.ok) {
        alert('Devolución procesada exitosamente')
        router.push('/refunds')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      alert('Error al procesar la devolución')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🔄 Nueva Devolución
            </h1>
            <p className="text-gray-600 text-sm mt-1">Procesa una devolución de productos</p>
          </div>
          <button
            onClick={() => router.push('/refunds')}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
          >
            ← Cancelar
          </button>
        </div>

        {/* Sale Search */}
        {!selectedSale && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Buscar Venta
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Número de venta o NCF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
              <button
                onClick={searchSales}
                disabled={searching}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 font-semibold"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {sales.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => selectSale(sale)}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{sale.saleNumber}</div>
                    {sale.ncf && <div className="text-sm text-gray-600">NCF: {sale.ncf}</div>}
                    {sale.customer && <div className="text-sm text-gray-600">Cliente: {sale.customer.name}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Sale & Refund Form */}
        {selectedSale && (
          <>
            {/* Sale Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Venta Seleccionada</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Venta</p>
                  <p className="font-semibold">{selectedSale.saleNumber}</p>
                </div>
                {selectedSale.ncf && (
                  <div>
                    <p className="text-sm text-gray-600">NCF</p>
                    <p className="font-semibold font-mono">{selectedSale.ncf}</p>
                  </div>
                )}
                {selectedSale.customer && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold">{selectedSale.customer.name}</p>
                    {selectedSale.customer.rnc && <p className="text-sm text-gray-600">RNC: {selectedSale.customer.rnc}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Items to Refund */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Productos a Devolver</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {selectedSale.items.map((item) => {
                    const refundItem = refundItems.find(ri => ri.saleItemId === item.id)
                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                            <p className="text-sm text-gray-600">Precio: {formatCurrency(item.unitPrice)}</p>
                            <p className="text-sm text-gray-600">Cantidad vendida: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad a devolver
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={refundItem?.quantity || 0}
                              onChange={(e) => updateRefundQuantity(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razón de la devolución (opcional)
                          </label>
                          <textarea
                            value={refundItem?.reason || ''}
                            onChange={(e) => updateRefundReason(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            rows={2}
                            placeholder="Ej: Producto defectuoso, cambio de opinión, etc."
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Reason & Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Razón General</h2>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={4}
                  placeholder="Razón general de la devolución..."
                />
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen de Devolución</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total a devolver:</span>
                    <span className="font-bold text-red-600">{formatCurrency(getTotalRefund())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-semibold">{refundItems.filter(item => item.quantity > 0).length}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || refundItems.filter(item => item.quantity > 0).length === 0}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
                >
                  {loading ? '💾 Procesando...' : '✅ Procesar Devolución'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}