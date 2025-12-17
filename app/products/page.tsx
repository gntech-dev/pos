'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  price: number
  cost: number
  taxRate: number
  stock: number
  minStock: number
  trackInventory: boolean
  category?: string
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    taxRate: '0.18',
    stock: '0',
    minStock: '5',
    trackInventory: true,
    category: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        taxRate: parseFloat(formData.taxRate),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock)
      }

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        await loadProducts()
        setShowForm(false)
        setEditingProduct(null)
        setFormData({ name: '', sku: '', barcode: '', price: '', cost: '', taxRate: '0.18', stock: '0', minStock: '5', trackInventory: true, category: '' })
        alert(editingProduct ? '✅ Producto actualizado exitosamente' : '✅ Producto creado exitosamente')
      } else {
        let errorMessage = 'Error desconocido'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.error || error.message || 'Error del servidor'
          } else {
            errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
        }
        alert(`❌ Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error guardando producto:', error)
      alert('❌ Ocurrió un error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      taxRate: product.taxRate.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      trackInventory: product.trackInventory,
      category: product.category || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadProducts()
        alert('Producto eliminado exitosamente')
      } else {
        let errorMessage = 'Error desconocido'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.error || error.message || 'Error del servidor'
          } else {
            errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
          }
        } catch (parseError) {
          console.error('Error parsing delete response:', parseError)
          errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
        }
        alert(`❌ Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('❌ Ocurrió un error al eliminar el producto')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              📦 Gestión de Productos
            </h1>
            <p className="text-gray-600 text-xs mt-1">Administra tu inventario y catálogo</p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setFormData({ name: '', sku: '', barcode: '', price: '', cost: '', taxRate: '0.18', stock: '0', minStock: '5', trackInventory: true, category: '' })
              setShowForm(true)
            }}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
          >
            ➕ Nuevo Producto
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, SKU, código de barras o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm"
          />
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center justify-between">
              <span>📋 Catálogo de Productos</span>
              <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                {filteredProducts.length} productos
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">📦 No hay productos</p>
                <p className="text-gray-400 text-sm mt-2">Agrega tu primer producto para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-100 rounded-lg p-4 hover:shadow-lg hover:border-purple-300 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                        {product.barcode && (
                          <p className="text-xs text-gray-500 font-mono">📊 {product.barcode}</p>
                        )}
                      </div>
                      {product.trackInventory && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          product.stock === 0 ? 'bg-red-100 text-red-700 border border-red-300' :
                          product.stock <= product.minStock ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          product.stock <= product.minStock * 1.5 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          {product.stock}
                        </span>
                      )}
                    </div>

                    {product.category && (
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mb-2">
                        🏷️ {product.category}
                      </span>
                    )}

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 mb-3 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Precio:</span>
                        <span className="text-lg font-bold text-green-700">RD$ {product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-600">Costo:</span>
                        <span className="text-xs font-semibold text-gray-700">RD$ {product.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-600">Margen:</span>
                        <span className="text-xs font-semibold text-blue-700">
                          {((product.price - product.cost) / product.cost * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-5 rounded-t-xl">
              <h2 className="text-2xl font-bold">
                {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                {editingProduct ? 'Actualiza la información del producto' : 'Completa la información del producto'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📦 Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🏷️ SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="SKU-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📊 Código de Barras
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="7501234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    💰 Precio de Venta (RD$) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    💵 Costo (RD$) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📈 Tasa de Impuesto (ITBIS)
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="0">0% - Exento</option>
                    <option value="0.16">16% - Reducido</option>
                    <option value="0.18">18% - General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📊 Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ⚠️ Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nivel mínimo antes de mostrar alerta de stock bajo</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🏷️ Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Electrónica, Alimentos, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.trackInventory}
                      onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm font-bold text-gray-700">
                      📊 Controlar inventario (rastrear stock)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : (
                    editingProduct ? '💾 Actualizar Producto' : '💾 Guardar Producto'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
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
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </div>
  )
}
