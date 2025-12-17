'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ThermalReceipt from '@/components/ThermalReceipt'
import A4Invoice from '@/components/A4Invoice'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string | null
  price: number
  taxRate: number
  stock: number
  minStock: number
  trackInventory: boolean
}

interface SaleItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

interface Customer {
  id: string
  name: string
  rnc?: string | null
  cedula?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface Sale {
  id: string
  saleNumber: string
  createdAt: Date | string
  customer?: Customer | null
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  ncf?: string | null
}

interface CustomerSearchResult {
  id?: string
  name: string
  rnc?: string
  cedula?: string
  email?: string
  phone?: string
  address?: string
  province?: string
  businessType?: string
  source: 'manual' | 'dgii'
}

interface QuaggaResult {
  codeResult: {
    code: string
  }
}

interface QuaggaConfig {
  inputStream: {
    name: string
    type: string
    target: HTMLDivElement
    constraints: {
      width: number
      height: number
      facingMode: string
    }
  }
  locator: {
    patchSize: string
    halfSample: boolean
  }
  numOfWorkers: number
  decoder: {
    readers: string[]
  }
  locate: boolean
}

// Import quagga dynamically to avoid SSR issues
interface QuaggaLib {
  init: (config: QuaggaConfig, callback: (err: unknown) => void) => void
  start: () => void
  stop: () => void
  onDetected: (callback: (result: QuaggaResult) => void) => void
}

let Quagga: QuaggaLib | null = null

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

export default function POSPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [discount, setDiscount] = useState(0)
  const [scannerActive, setScannerActive] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [documentType, setDocumentType] = useState<'thermal' | 'invoice'>('thermal')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showDocumentSelection, setShowDocumentSelection] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)

  // Load products on mount
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
      console.error('Error loading products:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (product.trackInventory && existing.quantity >= product.stock) {
        alert('Stock insuficiente')
        return
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      if (product.trackInventory && product.stock < 1) {
        alert('Sin stock disponible')
        return
      }
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0
      }])
    }
  }

  const updateCartItem = (productId: string, quantity: number, discount: number = 0) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
      return
    }

    const product = products.find(p => p.id === productId)
    if (product?.trackInventory && quantity > product.stock) {
      alert('Stock insuficiente')
      return
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity, discount }
        : item
    ))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)
    const tax = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount) * item.product.taxRate, 0)
    const total = subtotal + tax - discount
    return { subtotal, tax, total }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      const _totals = calculateTotals()
      const saleData = {
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount
        })),
        paymentMethod,
        discount,
        generateNCF: true
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      if (response.ok) {
        const sale = await response.json()
        setLastSale(sale)
        setShowDocumentSelection(true) // Show document selection instead of receipt directly
        setCart([])
        setSelectedCustomer(null)
        setDiscount(0)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error de pago:', error)
      alert('Ocurrió un error durante el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSelection = (action: 'print-receipt' | 'print-invoice' | 'email') => {
    if (!lastSale) return
    
    if (action === 'print-receipt') {
      const printUrl = `/print/${lastSale.id}?type=thermal`;
      window.open(printUrl, '_blank', 'width=400,height=600');
    } else if (action === 'print-invoice') {
      const printUrl = `/print/${lastSale.id}?type=invoice`;
      window.open(printUrl, '_blank', 'width=800,height=600');
    } else if (action === 'email') {
      setShowDocumentSelection(false)
      setShowEmailForm(true)
    }
  }

  const handleSendEmail = async () => {
    if (!emailAddress || !lastSale) return

    setSendingEmail(true)
    try {
      const response = await fetch('/api/sales/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: lastSale.id,
          email: emailAddress,
          type: documentType === 'thermal' ? 'receipt' : 'invoice'
        })
      })

      if (response.ok) {
        alert('✅ Correo enviado exitosamente')
        setShowEmailForm(false)
        setEmailAddress('')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error enviando correo:', error)
      alert('Ocurrió un error al enviar el correo')
    } finally {
      setSendingEmail(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  )

  const { subtotal, tax, total } = calculateTotals()

  const startBarcodeScanner = async () => {
    if (!scannerRef.current) return

    // Dynamic import to avoid SSR issues
    if (!Quagga) {
      const { default: QuaggaLib } = await import('quagga')
      Quagga = QuaggaLib as QuaggaLib
    }

    if (Quagga) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"]
        },
        locate: true
      }, (err: unknown) => {
        if (err) {
          console.error('Quagga init error:', err)
          return
        }
        Quagga?.start()
        setScannerActive(true)
      })

      Quagga.onDetected((result: QuaggaResult) => {
        const code = result.codeResult.code
        if (code) {
          // Find product by barcode
          const product = products.find(p => p.barcode === code)
          if (product) {
            addToCart(product)
            stopBarcodeScanner()
          } else {
            alert(`Producto con código de barras ${code} no encontrado`)
          }
        }
      })
    }
  }

  const stopBarcodeScanner = () => {
    if (Quagga) {
      Quagga.stop()
    }
    setScannerActive(false)
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerActive && Quagga) {
        Quagga.stop()
      }
    }
  }, [scannerActive])

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery.trim()) {
      alert('Por favor ingrese un RNC o nombre para buscar')
      return
    }

    setSearchingCustomers(true)
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(customerSearchQuery.trim())}`)
      if (response.ok) {
        const result = await response.json()
        setCustomerSearchResults(result.results)
        if (result.results.length === 0) {
          alert('No se encontraron clientes con esa búsqueda')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error buscando clientes:', error)
      alert('Error al buscar clientes')
    } finally {
      setSearchingCustomers(false)
    }
  }

  const selectCustomer = async (customer: CustomerSearchResult) => {
    let customerId = customer.id

    // If this is a DGII customer, check if they exist in Customer table
    // If not, create them so sales can reference them
    if (customer.source === 'dgii') {
      try {
        // Check if customer already exists by RNC
        const existingCustomer = await fetch(`/api/customers?q=${customer.rnc}`)
        const existingData = await existingCustomer.json()

        // Find exact RNC match
        const exactMatch = existingData.data?.find((c: { rnc: string }) => c.rnc === customer.rnc)

        if (exactMatch) {
          // Use existing customer ID
          customerId = exactMatch.id
        } else {
          // Create new customer from DGII data
          const createResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: customer.name,
              rnc: customer.rnc,
              email: customer.email || undefined,
              phone: customer.phone || undefined,
              address: customer.address || customer.province || undefined,
              isCompany: true // DGII customers are businesses
            })
          })

          if (createResponse.ok) {
            const newCustomer = await createResponse.json()
            customerId = newCustomer.id
          } else {
            const errorData = await createResponse.json()
            console.error('Customer creation error:', errorData)
            alert(`Error al crear cliente desde datos DGII: ${errorData.error || 'Validación fallida'}`)
            return
          }
        }
      } catch (error) {
        console.error('Error handling DGII customer:', error)
        alert('Error al procesar cliente DGII')
        return
      }
    }

    // Ensure customerId is defined (it should be for both manual and DGII customers)
    if (!customerId) {
      alert('Error: No se pudo obtener el ID del cliente')
      return
    }

    // Set selected customer for POS
    const posCustomer: Customer = {
      id: customerId,
      name: customer.name,
      rnc: customer.rnc,
      cedula: customer.cedula
    }

    setSelectedCustomer(posCustomer)
    setShowCustomerSearch(false)
    setCustomerSearchQuery('')
    setCustomerSearchResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Punto de Venta
            </h1>
            <p className="text-gray-600 text-sm mt-1">Sistema POS - GNTech</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
          >
            ← Volver al Panel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  🛍️ Productos
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredProducts.length} disponibles
                </span>
              </div>

              {/* Search and Barcode */}
              <div className="mb-6 flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="🔍 Buscar productos por nombre, SKU o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={scannerActive ? stopBarcodeScanner : startBarcodeScanner}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 ${
                    scannerActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {scannerActive ? '⏹️ Detener' : '📷 Escanear'}
                </button>
              </div>

              {/* Barcode Scanner */}
              {scannerActive && (
                <div className="mb-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-inner">
                  <div ref={scannerRef} className="w-full h-64 bg-black rounded-lg overflow-hidden">
                    <div id="interactive" className="viewport"></div>
                  </div>
                  <p className="text-sm text-gray-300 mt-3 text-center">📱 Apunta la cámara al código de barras</p>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-2xl hover:border-indigo-400 transition-all duration-300 transform hover:-translate-y-1">
                    <h3 className="font-bold text-base text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 font-mono">SKU: {product.sku}</p>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        RD$ {product.price.toFixed(2)}
                      </p>
                      {product.trackInventory && (
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          product.stock === 0 ? 'bg-red-100 text-red-700 border border-red-300' :
                          product.stock <= product.minStock ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          product.stock <= product.minStock * 1.5 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          {product.stock} disp.
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      disabled={product.trackInventory && product.stock <= 0}
                    >
                      {product.trackInventory && product.stock <= 0 ? '❌ Sin Stock' : '➕ Agregar al Carrito'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                👤 Cliente
              </h2>
              {selectedCustomer ? (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <p className="font-bold text-gray-800">{selectedCustomer.name}</p>
                  {selectedCustomer.rnc && <p className="text-sm text-gray-600 mt-1">RNC: {selectedCustomer.rnc}</p>}
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    🔄 Cambiar Cliente
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCustomerSearch(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-semibold transition-all duration-200 shadow-lg"
                  >
                    🔍 Buscar Cliente por RNC
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-medium transition-all duration-200 border border-gray-300"
                  >
                    👤 Cliente Público (Sin RNC)
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-2">🛒 Carrito</span>
                <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                  {cart.length} {cart.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">🛍️ Carrito vacío</p>
                  <p className="text-gray-400 text-sm mt-2">Agrega productos para comenzar</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex-1 pr-3">
                          <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-gray-600 mt-1">RD$ {item.unitPrice.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 text-red-700 rounded-full hover:from-red-200 hover:to-red-300 flex items-center justify-center text-lg font-bold shadow-sm transition-all duration-200 transform hover:scale-110"
                          >
                            −
                          </button>
                          <span className="px-3 py-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-bold min-w-[2.5rem] text-center border border-indigo-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-full hover:from-green-200 hover:to-green-300 flex items-center justify-center text-lg font-bold shadow-sm transition-all duration-200 transform hover:scale-110"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 space-y-3 border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="font-bold text-gray-800">RD$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">ITBIS (18%):</span>
                      <span className="font-bold text-gray-800">RD$ {tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Descuento:</span>
                        <span className="font-bold text-red-600">-RD$ {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-3">
                      <span className="text-gray-800">Total:</span>
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        RD$ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                  💳 Pago
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-gray-700 bg-white"
                    >
                      <option value="CASH">💵 Efectivo</option>
                      <option value="CARD">💳 Tarjeta</option>
                      <option value="TRANSFER">🏦 Transferencia</option>
                      <option value="MIXED">🔄 Mixto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descuento (RD$)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-gray-700"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:via-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : (
                      `💰 Completar Venta - RD$ ${total.toFixed(2)}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Selection Modal */}
        {showDocumentSelection && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 border-2 border-gray-200">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold">✅ Venta Completada</h2>
                <p className="text-green-100 text-sm mt-1">¿Qué deseas hacer con el documento?</p>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-800">
                    <strong>Venta #{lastSale.saleNumber}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-bold text-green-600">RD$ {lastSale.total.toFixed(2)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleDocumentSelection('print-receipt')}
                    className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center gap-3 font-semibold"
                  >
                    <span className="text-2xl">🧾</span>
                    <div className="text-left">
                      <div>Imprimir Recibo</div>
                      <div className="text-xs text-blue-100">Formato térmico (80mm)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDocumentSelection('print-invoice')}
                    className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center gap-3 font-semibold"
                  >
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <div>Imprimir Factura</div>
                      <div className="text-xs text-purple-100">Formato A4 completo</div>
                    </div>
                  </button>


                  <button
                    onClick={() => handleDocumentSelection('email')}
                    className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg flex items-center gap-3 font-semibold"
                  >
                    <span className="text-2xl">📧</span>
                    <div className="text-left">
                      <div>Enviar por Email</div>
                      <div className="text-xs text-green-100">Recibo o factura digital</div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDocumentSelection(false)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg font-semibold"
                  >
                    Solo Finalizar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-200">
              {/* Header with Document Type Selection */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">🧾 Documento de Venta</h2>
                    <p className="text-indigo-100 text-sm mt-1">GNTech Sistema POS</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDocumentType('thermal')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        documentType === 'thermal'
                          ? 'bg-white text-indigo-600 shadow-lg'
                          : 'bg-indigo-500 text-white hover:bg-indigo-400'
                      }`}
                    >
                      🧾 Recibo (80mm)
                    </button>
                    <button
                      onClick={() => setDocumentType('invoice')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        documentType === 'invoice'
                          ? 'bg-white text-indigo-600 shadow-lg'
                          : 'bg-indigo-500 text-white hover:bg-indigo-400'
                      }`}
                    >
                      📄 Factura (A4)
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  {documentType === 'thermal' ? (
                    <ThermalReceipt sale={lastSale} />
                  ) : (
                    <A4Invoice sale={lastSale} />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => {
                      // Open print page in new window
                      const printUrl = `/print/${lastSale.id}?type=${documentType}`;
                      window.open(printUrl, '_blank', 'width=800,height=600');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center gap-2"
                  >
                    🖨️ Imprimir {documentType === 'thermal' ? 'Recibo' : 'Factura'}
                  </button>

                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg flex items-center gap-2"
                  >
                    📧 Enviar por Email
                  </button>

                  <button
                    onClick={() => setShowReceipt(false)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg flex items-center gap-2"
                  >
                    ✖️ Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Form Modal */}
        {showEmailForm && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border-2 border-gray-200">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-t-xl">
                <h2 className="text-xl font-bold">📧 Enviar por Correo</h2>
                <p className="text-green-100 text-sm mt-1">
                  Enviar {documentType === 'thermal' ? 'recibo' : 'factura'} por email
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📧 Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="cliente@ejemplo.com"
                    required
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Documento:</strong> {documentType === 'thermal' ? 'Recibo' : 'Factura'} #{lastSale.saleNumber}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Total:</strong> RD$ {lastSale.total.toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailAddress}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {sendingEmail ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      '📧 Enviar Correo'
                    )}
                  </button>
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                  >
                    ✖️ Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold">🔍 Buscar Cliente</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  Busca clientes por RNC o nombre (clientes manuales y datos DGII)
                </p>
              </div>

              <div className="p-6">
                {/* Search Input */}
                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Ingresa RNC o nombre del cliente..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  />
                  <button
                    onClick={handleCustomerSearch}
                    disabled={searchingCustomers}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {searchingCustomers ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Buscando...
                      </span>
                    ) : (
                      '🔍 Buscar'
                    )}
                  </button>
                </div>

                {/* Search Results */}
                {customerSearchResults.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      📋 Resultados de Búsqueda ({customerSearchResults.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customerSearchResults.map((customer: CustomerSearchResult, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{customer.name}</h4>
                              {customer.rnc && (
                                <p className="text-sm text-gray-600 font-mono">RNC: {customer.rnc}</p>
                              )}
                              {customer.businessType && (
                                <p className="text-sm text-gray-600">{customer.businessType}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              customer.source === 'manual'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-green-100 text-green-700 border border-green-300'
                            }`}>
                              {customer.source === 'manual' ? '📝 Manual' : '🏢 DGII'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {customer.email && <span>📧 {customer.email}</span>}
                              {customer.phone && <span className="ml-4">📞 {customer.phone}</span>}
                            </div>
                            <button
                              onClick={() => selectCustomer(customer)}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md font-semibold"
                            >
                              ✅ Seleccionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCustomerSearch(false)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                  >
                    ✖️ Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  )
}