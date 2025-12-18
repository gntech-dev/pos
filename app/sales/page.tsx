'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Sale {
  id: string
  saleNumber: string
  total: number
  createdAt: string
  ncf?: string
  paymentMethod: string
  subtotal: number
  tax: number
  discount: number
  customer?: {
    name: string
    rnc?: string
    cedula?: string
    address?: string
    phone?: string
  }
  cashier: {
    name: string
  }
  items: Array<{
    product: {
      name: string
      sku: string
    }
    quantity: number
    unitPrice: number
    discount: number
  }>
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showActionsPopover, setShowActionsPopover] = useState<string | null>(null)

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
      // Generate PDF using jsPDF
      console.log('Generando PDF para venta:', sale.id)
      const pdfData = await generateInvoicePDF(sale)
      console.log('PDF generado, longitud:', pdfData.length)
      console.log('PDF data preview:', pdfData.substring(0, 100))

      const response = await fetch('/api/sales/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: sale.id, email, type, pdfData })
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

  const generateInvoicePDF = async (sale: Sale): Promise<string> => {
    // Get business settings
    const businessResponse = await fetch('/api/settings/business')
    const businessSettings = await businessResponse.json()

    // Get NCF expiration info if NCF exists
    let ncfExpiration = null
    if (sale.ncf) {
      try {
        const ncfResponse = await fetch(`/api/ncf/expiration/${sale.ncf}`)
        if (ncfResponse.ok) {
          ncfExpiration = await ncfResponse.json()
        }
      } catch (error) {
        console.error('Error fetching NCF expiration:', error)
      }
    }

    // Determine payment method text
    const paymentMethodText = sale.paymentMethod === 'CASH' ? 'Efectivo' :
      sale.paymentMethod === 'CARD' ? 'Tarjeta' :
      sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Mixto'

    // Create a temporary container for the invoice component
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '-9999px'
    tempContainer.style.width = '210mm'
    tempContainer.style.backgroundColor = 'white'
    document.body.appendChild(tempContainer)

    // Create the invoice component
    const invoiceElement = document.createElement('div')
    invoiceElement.innerHTML = `
      <div style="width: 210mm; font-family: Arial, sans-serif; background-color: white; color: black; padding: 3rem; margin: 0 auto; max-width: 210mm;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 4px solid #4f46e5;">
          <div>
            <h1 style="font-size: 2.25rem; font-weight: bold; color: #4f46e5; margin: 0;">🏪 ${businessSettings.name || 'GNTech'}</h1>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0;">Sistema de Punto de Venta</p>
            <p style="font-size: 0.875rem; margin: 0;">RNC: ${businessSettings.rnc || '000-00000-0'}</p>
            <p style="font-size: 0.875rem; margin: 0;">${businessSettings.address || 'Santo Domingo, República Dominicana'}</p>
            <p style="font-size: 0.875rem; margin: 0;">Tel: ${businessSettings.phone || '809-555-5555'}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 1.875rem; font-weight: bold; color: #1f2937; margin: 0;">FACTURA</h2>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; margin-bottom: 0;">#${sale.saleNumber}</p>
            <p style="font-size: 0.875rem; margin: 0;">${formatDate(sale.createdAt)}</p>
            ${sale.ncf ? `
            <div style="margin-top: 0.75rem; background-color: #f3f4f6; padding: 0.5rem 1rem; border-radius: 0.375rem;">
              <p style="font-size: 0.75rem; font-weight: bold; margin: 0;">NCF</p>
              <p style="font-size: 0.875rem; font-family: monospace; margin: 0;">${sale.ncf}</p>
              ${ncfExpiration?.expiryDate ? `
              <div style="margin-top: 0.5rem;">
                <p style="font-size: 0.75rem; color: #4b5563; margin: 0;">Fecha de Vencimiento:</p>
                <p style="font-size: 0.875rem; font-weight: 600; color: ${ncfExpiration.daysUntilExpiry !== null && ncfExpiration.daysUntilExpiry < 30 ? '#dc2626' : '#1f2937'}; margin: 0;">
                  ${new Date(ncfExpiration.expiryDate).toLocaleDateString('es-DO')}
                </p>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Customer Info -->
        ${sale.customer ? `
        <div style="margin-bottom: 2rem; background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem;">
          <h3 style="font-weight: bold; font-size: 0.875rem; margin-bottom: 0.5rem; margin-top: 0;">FACTURADO A:</h3>
          <p style="font-size: 0.875rem; font-weight: bold; margin: 0;">${sale.customer.name}</p>
          ${sale.customer.rnc ? `<p style="font-size: 0.875rem; margin: 0;">RNC: ${sale.customer.rnc}</p>` : ''}
          ${sale.customer.cedula ? `<p style="font-size: 0.875rem; margin: 0;">C&eacute;dula: ${sale.customer.cedula}</p>` : ''}
          ${sale.customer.address ? `<p style="font-size: 0.875rem; margin: 0;">Direcci&oacute;n: ${sale.customer.address}</p>` : ''}
          ${sale.customer.phone ? `<p style="font-size: 0.875rem; margin: 0;">Tel&eacute;fono: ${sale.customer.phone}</p>` : ''}
        </div>
        ` : ''}

        <!-- Items Table -->
        <table style="width: 100%; margin-bottom: 2rem; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #4f46e5; color: white;">
              <th style="text-align: left; padding: 0.75rem; font-size: 0.875rem;">Producto</th>
              <th style="text-align: center; padding: 0.75rem; font-size: 0.875rem;">Cant.</th>
              <th style="text-align: right; padding: 0.75rem; font-size: 0.875rem;">Precio Unit.</th>
              <th style="text-align: right; padding: 0.75rem; font-size: 0.875rem;">Descuento</th>
              <th style="text-align: right; padding: 0.75rem; font-size: 0.875rem;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 0.75rem; font-size: 0.875rem;">
                <p style="font-weight: 600; margin: 0;">${item.product.name}</p>
                <p style="font-size: 0.75rem; color: #4b5563; margin: 0;">SKU: ${item.product.sku}</p>
              </td>
              <td style="text-align: center; padding: 0.75rem; font-size: 0.875rem;">${item.quantity}</td>
              <td style="text-align: right; padding: 0.75rem; font-size: 0.875rem;">RD$ ${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; padding: 0.75rem; font-size: 0.875rem;">
                ${item.discount > 0 ? `-RD$ ${item.discount.toFixed(2)}` : '-'}
              </td>
              <td style="text-align: right; padding: 0.75rem; font-size: 0.875rem; font-weight: bold;">
                RD$ ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
          <div style="width: 16rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <span>Subtotal:</span>
              <span>RD$ ${sale.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <span>ITBIS (18%):</span>
              <span>RD$ ${sale.tax.toFixed(2)}</span>
            </div>
            ${sale.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <span>Descuento:</span>
              <span style="color: #dc2626;">-RD$ ${sale.discount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.25rem; border-top: 2px solid #d1d5db; padding-top: 0.75rem; margin-top: 0.5rem;">
              <span>TOTAL:</span>
              <span style="color: #4f46e5;">RD$ ${sale.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div style="margin-bottom: 2rem; background-color: #f0fdf4; padding: 1rem; border-radius: 0.5rem;">
          <p style="font-size: 0.875rem; margin: 0;">
            <span style="font-weight: bold;">M&eacute;todo de Pago:</span> ${paymentMethodText}
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 0.75rem; color: #4b5563; border-top: 1px solid #d1d5db; padding-top: 1rem;">
          <p style="margin-bottom: 0.5rem; margin-top: 0;">&iexcl;Gracias por su preferencia!</p>
          <p style="margin: 0;">Este documento es una representaci&oacute;n impresa de una factura electr&oacute;nica</p>
          <p style="margin-top: 0.5rem; margin-bottom: 0;">${businessSettings.email || 'info@gntech.com'}</p>
        </div>
      </div>
    `

    tempContainer.appendChild(invoiceElement)

    try {
      // Use html2canvas to render the invoice to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: Math.min(tempContainer.scrollHeight, 2000) // Limit height to prevent overflow
      })

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png', 0.8)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST')

      // Generate PDF as array buffer and convert to base64
      const pdfArrayBuffer = pdf.output('arraybuffer')
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)))
      return `data:application/pdf;base64,${pdfBase64}`

    } finally {
      // Clean up temporary element
      document.body.removeChild(tempContainer)
    }
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
                        <div className="flex items-center justify-center gap-2 relative">
                          <button
                            onClick={() => {
                              setShowActionsPopover(showActionsPopover === sale.id ? null : sale.id)
                            }}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                          >
                            ⚡ Acciones
                          </button>

                          {/* Popover flotante */}
                          {showActionsPopover === sale.id && (
                            <div className="absolute top-full mt-2 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-64">
                              <div className="p-4">
                                <div className="mb-3">
                                  <div className="text-xs text-gray-600 mb-1">
                                    <strong>Venta:</strong> {sale.saleNumber}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    <strong>Cliente:</strong> {sale.customer?.name || 'Cliente General'}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <strong>Total:</strong> {formatCurrency(sale.total)}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Imprimir</div>
                                  <button
                                    onClick={() => {
                                      handlePrint(sale.id, 'receipt')
                                      setShowActionsPopover(null)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded border border-gray-200 flex items-center gap-2 transition-colors"
                                  >
                                    🧾 <span>Recibo (80mm)</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handlePrint(sale.id, 'invoice')
                                      setShowActionsPopover(null)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded border border-gray-200 flex items-center gap-2 transition-colors"
                                  >
                                    📄 <span>Factura (A4)</span>
                                  </button>

                                  <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Email</div>
                                    <button
                                      onClick={() => {
                                        handleEmail(sale, 'invoice')
                                        setShowActionsPopover(null)
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded border border-gray-200 flex items-center gap-2 transition-colors"
                                    >
                                      📧 <span>Enviar Factura (PDF)</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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

      {/* Backdrop para cerrar popover al hacer clic fuera */}
      {showActionsPopover && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionsPopover(null)}
        />
      )}
    </div>
  )
}