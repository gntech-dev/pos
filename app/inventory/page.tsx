'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  stock: number
  minStock: number
  category?: string
  cost: number
  price: number
  unit: string
  stockMovements: {
    type: string
    quantity: number
    reason: string
    createdAt: string
    createdBy?: string
  }[]
}

interface InventorySummary {
  totalProducts: number
  totalStock: number
  totalInventoryValue: number
  lowStockCount: number
  outOfStockCount: number
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment: '',
    reason: '',
    type: 'ADJUSTMENT'
  })

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      const [productsRes, summaryRes, lowStockRes] = await Promise.all([
        fetch('/api/inventory?type=all'),
        fetch('/api/inventory?type=summary'),
        fetch('/api/inventory?type=low_stock')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json()
        setLowStockProducts(lowStockData)
      }
    } catch (error) {
      console.error('Error cargando inventario:', error)
    }
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setLoading(true)

    try {
      const adjustment = parseInt(adjustmentForm.adjustment)
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustment,
          reason: adjustmentForm.reason,
          type: adjustmentForm.type
        })
      })

      if (response.ok) {
        await loadInventory()
        setShowAdjustmentModal(false)
        setSelectedProduct(null)
        setAdjustmentForm({ adjustment: '', reason: '', type: 'ADJUSTMENT' })
        alert('Ajuste de inventario realizado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error ajustando inventario:', error)
      alert('Ocurrió un error al ajustar el inventario')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: 'red', text: 'Agotado' }
    if (product.stock <= product.minStock) return { status: 'low', color: 'orange', text: 'Stock Bajo' }
    if (product.stock <= product.minStock * 1.5) return { status: 'warning', color: 'yellow', text: 'Stock Moderado' }
    return { status: 'good', color: 'green', text: 'Stock Bueno' }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-3">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              📊 Control de Inventario
            </h1>
            <p className="text-gray-600 text-xs mt-1">Gestiona y controla tu inventario en tiempo real</p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-amber-700">{summary.totalProducts}</p>
                </div>
                <span className="text-2xl">📦</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total en Stock</p>
                  <p className="text-2xl font-bold text-green-700">{summary.totalStock}</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-700">RD$ {summary.totalInventoryValue.toFixed(2)}</p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-orange-700">{summary.lowStockCount}</p>
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Agotados</p>
                  <p className="text-2xl font-bold text-red-700">{summary.outOfStockCount}</p>
                </div>
                <span className="text-2xl">🚫</span>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">🚨</span>
              <h3 className="font-bold text-red-800">Alertas de Stock Bajo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.slice(0, 6).map(product => (
                <div key={product.id} className="bg-white rounded p-2 border border-red-100">
                  <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                  <p className="text-xs text-red-600">Stock: {product.stock} / Mín: {product.minStock}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, SKU, código de barras o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm"
          />
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center justify-between">
              <span>📋 Control de Inventario</span>
              <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                {filteredProducts.length} productos
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">📦 No hay productos</p>
                <p className="text-gray-400 text-sm mt-2">Los productos aparecerán aquí cuando sean agregados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <div key={product.id} className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-100 rounded-lg p-4 hover:shadow-lg hover:border-amber-300 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                          {product.barcode && (
                            <p className="text-xs text-gray-500 font-mono">📊 {product.barcode}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          stockStatus.color === 'red' ? 'bg-red-100 text-red-700 border border-red-300' :
                          stockStatus.color === 'orange' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          {stockStatus.text}
                        </span>
                      </div>

                      {product.category && (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mb-2">
                          🏷️ {product.category}
                        </span>
                      )}

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 mb-3 border border-green-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Stock Actual:</span>
                            <span className="font-bold text-green-700 ml-1">{product.stock} {product.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stock Mín:</span>
                            <span className="font-bold text-orange-700 ml-1">{product.minStock} {product.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Costo:</span>
                            <span className="font-bold text-blue-700 ml-1">RD$ {product.cost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Valor Total:</span>
                            <span className="font-bold text-purple-700 ml-1">RD$ {(product.stock * product.cost).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Movements */}
                      {product.stockMovements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-1">Movimientos recientes:</p>
                          <div className="space-y-1">
                            {product.stockMovements.slice(0, 3).map((movement, index) => (
                              <div key={index} className="text-xs bg-gray-50 rounded p-1">
                                <span className={`font-semibold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                </span>
                                <span className="text-gray-500 ml-1">{movement.reason}</span>
                                <span className="text-gray-400 ml-1">
                                  {new Date(movement.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowAdjustmentModal(true)
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold"
                      >
                        ⚙️ Ajustar Inventario
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-t-xl">
              <h2 className="text-2xl font-bold">
                ⚙️ Ajustar Inventario
              </h2>
              <p className="text-amber-100 text-sm mt-1">
                {selectedProduct.name}
              </p>
              <p className="text-amber-100 text-xs mt-1">
                Stock actual: {selectedProduct.stock} {selectedProduct.unit}
              </p>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📊 Tipo de Ajuste *
                  </label>
                  <select
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    required
                  >
                    <option value="ADJUSTMENT">Ajuste Manual</option>
                    <option value="PURCHASE">Compra/Entrada</option>
                    <option value="LOSS">Pérdida/Daño</option>
                    <option value="TRANSFER">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🔢 Cantidad a Ajustar *
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustmentForm.adjustment}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ej: 10 (aumentar) o -5 (disminuir)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use números positivos para aumentar stock, negativos para disminuir
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Razón del Ajuste *
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ej: Conteo físico, devolución, etc."
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Stock resultante:</strong> {selectedProduct.stock + (parseInt(adjustmentForm.adjustment) || 0)} {selectedProduct.unit}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aplicando...
                    </span>
                  ) : (
                    '💾 Aplicar Ajuste'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustmentModal(false)
                    setSelectedProduct(null)
                    setAdjustmentForm({ adjustment: '', reason: '', type: 'ADJUSTMENT' })
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                >
                  ✖️ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f59e0b, #ea580c);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d97706, #c2410c);
        }
      `}</style>
    </div>
  )
}