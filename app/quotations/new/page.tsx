'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
  rnc?: string
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  total: number
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
    loadProducts()

    // Set default expiry to 30 days
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 30)
    setExpiresAt(defaultExpiry.toISOString().split('T')[0])
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id)

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        subtotal: product.price,
        total: product.price
      }
      setCart([...cart, newItem])
    }
    setSearchTerm('')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = quantity
        const subtotal = newQuantity * item.unitPrice - item.discount
        const total = subtotal * (1 + (item.product ? 0.18 : 0)) // 18% ITBIS

        return {
          ...item,
          quantity: newQuantity,
          subtotal,
          total
        }
      }
      return item
    }))
  }

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const subtotal = item.quantity * item.unitPrice - discount
        const total = subtotal * (1 + (item.product ? 0.18 : 0))

        return {
          ...item,
          discount,
          subtotal,
          total
        }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = cart.reduce((sum, item) => sum + (item.subtotal * 0.18), 0)
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  const handleSave = async () => {
    if (cart.length === 0) {
      alert('Agregue al menos un producto a la cotización')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount
          })),
          expiresAt,
          notes
        })
      })

      if (response.ok) {
        const _quotation = await response.json()
        alert('Cotización creada exitosamente')
        router.push('/quotations')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating quotation:', error)
      alert('Error al crear la cotización')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { subtotal, tax, total } = calculateTotals()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📝 Nueva Cotización
            </h1>
            <p className="text-gray-600 text-sm mt-1">Crea una nueva cotización para un cliente</p>
          </div>
          <button
            onClick={() => router.push('/quotations')}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium"
          >
            ← Cancelar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Cliente
              </h2>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Cliente Público</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.rnc && `(RNC: ${customer.rnc})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Search & Add */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Agregar Productos
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />

                {searchTerm && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">SKU: {product.sku} | Stock: {product.stock}</div>
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(product.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Cart & Totals */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  Carrito ({cart.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🛒</div>
                    <p>No hay productos en el carrito</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-500 hover:text-red-700 text-xl"
                          >
                            ×
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-gray-600">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Descuento</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <div className="text-gray-600">Subtotal: {formatCurrency(item.subtotal)}</div>
                          <div className="font-semibold text-green-600">Total: {formatCurrency(item.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Totals & Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Configuración</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha de Expiración
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Notas adicionales para la cotización..."
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ITBIS (18%):</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-indigo-300 pt-2 flex justify-between">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading || cart.length === 0}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
              >
                {loading ? '💾 Guardando...' : '✅ Crear Cotización'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}