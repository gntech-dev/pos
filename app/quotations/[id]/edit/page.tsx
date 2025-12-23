'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Customer {
  id: string
  name: string
  rnc?: string
  isFromRNC?: boolean
}

interface RNCResult {
  rnc: string
  businessName: string
  businessType?: string
  address?: string
  province?: string
  phone?: string
  email?: string
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

interface Quotation {
  id: string
  quotationNumber: string
  customerId?: string
  customer?: {
    id: string
    name: string
    rnc?: string
  }
  items: Array<{
    id: string
    productId: string
    product: Product
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
    total: number
  }>
  expiresAt: string
  notes?: string
}

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const quotationId = params.id as string

  const [customerId, setCustomerId] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearchTerm.trim() === '') {
        // Load first 10 customers when no search term
        try {
          const response = await fetch('/api/customers?limit=10')
          if (response.ok) {
            const data = await response.json()
            setFilteredCustomers(data.data)
          }
        } catch (error) {
          console.error('Error loading customers:', error)
        }
      } else {
        // First search in customers
        try {
          const customerResponse = await fetch(`/api/customers?q=${encodeURIComponent(customerSearchTerm)}&limit=10`)
          if (customerResponse.ok) {
            const customerData = await customerResponse.json()
            let allResults = [...customerData.data]

            // If we have less than 10 results from customers, search in RNC registry
            if (allResults.length < 10) {
              try {
                const rncResponse = await fetch(`/api/rnc/search?q=${encodeURIComponent(customerSearchTerm)}&limit=${10 - allResults.length}`)
                if (rncResponse.ok) {
                  const rncData = await rncResponse.json()
                  // Add RNC results that are not already in customers
                  const existingRNCs = new Set(allResults.map(c => c.rnc).filter(Boolean))
                  const newRNCResults = rncData.results
                    .filter((rnc: RNCResult) => !existingRNCs.has(rnc.rnc))
                    .map((rnc: RNCResult) => ({
                      id: `rnc-${rnc.rnc}`, // Use RNC as part of ID to distinguish
                      name: rnc.businessName,
                      rnc: rnc.rnc,
                      isFromRNC: true // Flag to indicate this is from RNC registry
                    }))

                  allResults = [...allResults, ...newRNCResults]
                }
              } catch (rncError) {
                console.error('Error searching RNC registry:', rncError)
              }
            }

            setFilteredCustomers(allResults.slice(0, 10))
          }
        } catch (error) {
          console.error('Error searching customers:', error)
        }
      }
    }

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(searchCustomers, 300)
    return () => clearTimeout(timeoutId)
  }, [customerSearchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadQuotation = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`)
      if (response.ok) {
        const quotation: Quotation = await response.json()

        // Set customer
        if (quotation.customerId) {
          setCustomerId(quotation.customerId)
          setCustomerSearchTerm(quotation.customer?.name || '')
        }

        // Set items
        const cartItems: CartItem[] = quotation.items.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          total: item.total
        }))
        setCart(cartItems)

        // Set other fields
        setExpiresAt(quotation.expiresAt.split('T')[0]) // Format date
        setNotes(quotation.notes || '')
      } else {
        alert('Error al cargar la cotización')
        router.push('/quotations')
      }
    } catch (error) {
      console.error('Error loading quotation:', error)
      alert('Error al cargar la cotización')
      router.push('/quotations')
    }
  }, [quotationId, router])

  useEffect(() => {
    loadQuotation()
    loadCustomers()
    loadProducts()
  }, [loadQuotation])

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=10')
      if (response.ok) {
        const data = await response.json()
        setFilteredCustomers(data.data)
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

  const handleCustomerSelect = async (customer: Customer & { isFromRNC?: boolean }) => {
    if (customer.isFromRNC) {
      // Get full RNC details first
      try {
        const rncResponse = await fetch(`/api/rnc/search?q=${encodeURIComponent(customer.rnc || '')}&limit=1`)
        if (rncResponse.ok) {
          const rncData = await rncResponse.json()
          if (rncData.results && rncData.results.length > 0) {
            const rncDetails = rncData.results[0]

            // Create customer from RNC registry
            const createResponse = await fetch('/api/customers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: rncDetails.businessName,
                rnc: rncDetails.rnc,
                email: rncDetails.email || undefined,
                phone: rncDetails.phone || undefined,
                address: rncDetails.address || undefined,
                isCompany: true
              })
            })

            if (createResponse.ok) {
              const newCustomer = await createResponse.json()
              setCustomerId(newCustomer.id)
              setCustomerSearchTerm(newCustomer.name)
              setShowCustomerDropdown(false)
              // Reload customers to include the new one
              loadCustomers()
              alert('Cliente creado exitosamente desde el registro de RNC')
            } else {
              const error = await createResponse.json()
              alert(`Error al crear el cliente: ${error.error}`)
            }
          }
        }
      } catch (error) {
        console.error('Error creating customer from RNC:', error)
        alert('Error al crear el cliente desde el RNC')
      }
    } else {
      // Regular customer selection
      setCustomerId(customer.id)
      setCustomerSearchTerm(customer.name)
      setShowCustomerDropdown(false)
    }
  }

  const handleClearCustomer = () => {
    setCustomerId('')
    setCustomerSearchTerm('')
    setShowCustomerDropdown(false)
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
        total: product.price * (1 + 0.18) // Include tax
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const subtotal = quantity * item.unitPrice - item.discount
        const total = subtotal * (1 + 0.18)

        return {
          ...item,
          quantity,
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
        const total = subtotal * (1 + 0.18)

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
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PUT',
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
        alert('Cotización actualizada exitosamente')
        router.push('/quotations')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating quotation:', error)
      alert('Error al actualizar la cotización')
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
              ✏️ Editar Cotización
            </h1>
            <p className="text-gray-600 text-sm mt-1">Modifica los detalles de la cotización</p>
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
              <div className="relative" ref={customerDropdownRef}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o RNC..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value)
                      setShowCustomerDropdown(true)
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  />
                  {customerId && (
                    <button
                      onClick={handleClearCustomer}
                      className="px-3 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                      title="Limpiar selección"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setCustomerId('')
                          setCustomerSearchTerm('')
                          setShowCustomerDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                      >
                        👤 Cliente Público (Sin cliente específico)
                      </button>

                      {filteredCustomers.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 my-2"></div>
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {customer.name}
                                    {customer.isFromRNC && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Nuevo
                                      </span>
                                    )}
                                  </div>
                                  {customer.rnc && (
                                    <div className="text-xs text-gray-500">RNC: {customer.rnc}</div>
                                  )}
                                </div>
                                {customer.isFromRNC && (
                                  <span className="text-xs text-blue-600">➕ Crear cliente</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {customerSearchTerm && filteredCustomers.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {customerId && (
                  <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="text-sm text-indigo-800">
                      Cliente seleccionado: <span className="font-semibold">{customerSearchTerm}</span>
                    </div>
                  </div>
                )}
              </div>
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
                {loading ? '💾 Guardando...' : '✅ Actualizar Cotización'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}