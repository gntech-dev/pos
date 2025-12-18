'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')

  const tabs = [
    { id: 'sales', label: '📊 Reportes de Ventas', description: 'Análisis de ventas por período, cliente y producto' },
    { id: 'inventory', label: '📦 Reportes de Inventario', description: 'Niveles de stock y movimientos de inventario' },
    { id: 'customers', label: '👥 Reportes de Clientes', description: 'Información y análisis de cartera de clientes' },
    { id: 'dgii', label: '🏛️ Reportes DGII', description: 'Reportes fiscales para la Dirección General de Impuestos Internos' },
  ]

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              📈 Sistema de Reportes
            </h1>
            <p className="text-gray-600 text-xs mt-1">Análisis y reportes para toma de decisiones</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-800">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'sales' && <SalesReports />}
            {activeTab === 'inventory' && <InventoryReports />}
            {activeTab === 'customers' && <CustomerReports />}
            {activeTab === 'dgii' && <DGIIReports />}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SalesSummary {
  totalRevenue: number
  totalSales: number
  averageTicket: number
  totalTax: number
}

interface SalesByDate {
  date: string
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalItems: number
}

interface SalesByCustomer {
  customerName: string
  totalSales: number
  totalRevenue: number
  totalTax: number
  totalItems: number
}

interface SalesByProduct {
  productName: string
  productSku: string
  totalQuantity: number
  totalRevenue: number
}

interface NCFStatus {
  type: string
  prefix: string
  status: string
  alertLevel: string
  daysLeft: number
  remaining: number
  percentageUsed: number
}

interface InventorySummary {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalInventoryValue: number
}

interface LowStockItem {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
}

interface InventoryMovement {
  product: {
    name: string
    sku: string
  }
  type: string
  quantity: number
  createdAt: string
  reason: string
}

interface InventoryByCategory {
  category: string
  totalProducts: number
  totalStock: number
  totalValue: number
}

interface CustomerSummary {
  totalCustomers: number
  activeCustomers: number
  customersWithSales: number
  averageSalesPerCustomer: number
}

interface TopCustomer {
  id: string
  name: string
  totalSales: number
  totalRevenue: number
}

function SalesReports() {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([])
  const [salesByCustomer, setSalesByCustomer] = useState<SalesByCustomer[]>([])
  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([])
  const [ncfStatus, setNcfStatus] = useState<NCFStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeSubTab, setActiveSubTab] = useState('summary')

  const exportToPDF = (data: any[], title: string, headers: string[]) => {
    const doc = new jsPDF()
    doc.text(title, 14, 20)
  
    const tableData = data.map(row =>
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '')
        const value = row[key] || row[header] || ''
        
        // Don't format as currency for quantity/count/percentage fields
        const noCurrencyFields = [
          'Total Ventas', 'Total Items', 'Días Restantes', 'Restantes', 'Uso %',
          'Stock', 'Mínimo', 'Cantidad', 'Productos', 'Stock Total',
          'Número de Ventas', 'Cantidad Total', 'Total Productos'
        ];
        
        return typeof value === 'number' && !noCurrencyFields.includes(header) ? formatCurrency(value) : String(value)
      })
    )
  
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
    })
  
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'summary' })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error loading sales summary:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadSalesByDate = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'by_date' })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSalesByDate(data)
      }
    } catch (error) {
      console.error('Error loading sales by date:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadSalesByCustomer = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'by_customer' })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSalesByCustomer(data)
      }
    } catch (error) {
      console.error('Error loading sales by customer:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadSalesByProduct = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'by_product' })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSalesByProduct(data)
      }
    } catch (error) {
      console.error('Error loading sales by product:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadNCFStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ncf/monitor')
      if (response.ok) {
        const data = await response.json()
        setNcfStatus(data.data || [])
      }
    } catch (error) {
      console.error('Error loading NCF status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSubTab === 'summary') {
      loadSummary()
    } else if (activeSubTab === 'by_date') {
      loadSalesByDate()
    } else if (activeSubTab === 'by_customer') {
      loadSalesByCustomer()
    } else if (activeSubTab === 'by_product') {
      loadSalesByProduct()
    } else if (activeSubTab === 'ncf_status') {
      loadNCFStatus()
    }
  }, [activeSubTab, loadSummary, loadSalesByDate, loadSalesByCustomer, loadSalesByProduct, loadNCFStatus])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const getNCFStatusBadge = (status: string, alertLevel: string) => {
    const statusConfig = {
      'EXPIRED': { color: 'bg-red-100 text-red-800 border-red-300', text: '🔴 EXPIRADO' },
      'EXPIRING_SOON': { 
        color: alertLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-300', 
        text: alertLevel === 'CRITICAL' ? '🟠 CRÍTICO' : '🟡 EXPIRANDO' 
      },
      'LOW_STOCK': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: '🟡 STOCK BAJO' },
      'EXHAUSTED': { color: 'bg-red-100 text-red-800 border-red-300', text: '🔴 AGOTADO' },
      'NORMAL': { color: 'bg-green-100 text-green-800 border-green-300', text: '🟢 NORMAL' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NORMAL']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📅 Fecha Inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📅 Fecha Fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => { setStartDate(''); setEndDate('') }}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-gray-800">Total Ventas</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : summary ? formatCurrency(summary.totalRevenue) : '$0.00'}
          </p>
          <p className="text-xs text-gray-600">
            {startDate && endDate ? 'En el período' : 'Total histórico'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-gray-800">Número de Ventas</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : summary?.totalSales || 0}
          </p>
          <p className="text-xs text-gray-600">Transacciones</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-bold text-gray-800">Ticket Promedio</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : summary ? formatCurrency(summary.averageTicket) : '$0.00'}
          </p>
          <p className="text-xs text-gray-600">Por venta</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-bold text-gray-800">Total ITBIS</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : summary ? formatCurrency(summary.totalTax) : '$0.00'}
          </p>
          <p className="text-xs text-gray-600">Impuestos</p>
        </div>
      </div>

      {/* Export Buttons */}
      {summary && (
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF([{
              'Total Ventas': summary.totalRevenue,
              'Número de Ventas': summary.totalSales,
              'Ticket Promedio': summary.averageTicket,
              'Total ITBIS': summary.totalTax
            }], 'Resumen de Ventas', ['Total Ventas', 'Número de Ventas', 'Ticket Promedio', 'Total ITBIS'])}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            📄 Exportar PDF
          </button>
          <button
            onClick={() => exportToCSV([{
              'Total Ventas': summary.totalRevenue,
              'Número de Ventas': summary.totalSales,
              'Ticket Promedio': summary.averageTicket,
              'Total ITBIS': summary.totalTax
            }], 'resumen_ventas')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            📊 Exportar CSV
          </button>
        </div>
      )}

      {/* Sub-tabs for detailed reports */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'summary'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setActiveSubTab('by_date')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'by_date'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📅 Por Fecha
        </button>
        <button
          onClick={() => setActiveSubTab('by_customer')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'by_customer'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          👥 Por Cliente
        </button>
        <button
          onClick={() => setActiveSubTab('by_product')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'by_product'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📦 Por Producto
        </button>
        <button
          onClick={() => setActiveSubTab('ncf_status')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'ncf_status'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📋 Estado NCF
        </button>
      </div>

      {/* NCF Status Tab */}
      {activeSubTab === 'ncf_status' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Estado de Secuencias NCF</h3>
            <p className="text-sm text-gray-600">Monitoreo del estado y alertas de los comprobantes fiscales</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : ncfStatus.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📋 No hay información de NCF disponible
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(ncfStatus, 'Estado NCF', ['Tipo', 'Prefijo', 'Estado', 'Días Restantes', 'Restantes', 'Uso %'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(ncfStatus, 'estado_ncf')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo NCF</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Prefijo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Días Restantes</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Números Restantes</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Porcentaje Usado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ncfStatus.map((ncf: NCFStatus, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{ncf.type}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{ncf.prefix}</td>
                        <td className="px-4 py-3 text-sm">{getNCFStatusBadge(ncf.status, ncf.alertLevel)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className={ncf.daysLeft < 0 ? 'text-red-600 font-semibold' : ncf.daysLeft <= 7 ? 'text-orange-600 font-semibold' : ncf.daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-900'}>
                            {ncf.daysLeft < 0 ? `Expirado hace ${Math.abs(ncf.daysLeft)} días` : `${ncf.daysLeft} días`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className={ncf.remaining <= 0 ? 'text-red-600 font-semibold' : ncf.remaining < 100 ? 'text-orange-600 font-semibold' : 'text-gray-900'}>
                            {ncf.remaining}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${ncf.percentageUsed >= 90 ? 'bg-red-500' : ncf.percentageUsed >= 75 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(ncf.percentageUsed, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{ncf.percentageUsed.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detailed Reports Content */}
      {activeSubTab === 'by_date' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Ventas por Fecha</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : salesByDate.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay datos de ventas disponibles
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(salesByDate, 'Ventas por Fecha', ['Fecha', 'Total Ventas', 'Total Ingresos', 'Total ITBIS', 'Total Items'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(salesByDate, 'ventas_por_fecha')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Ventas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Ingresos</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total ITBIS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesByDate.map((row: SalesByDate, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.totalSales}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(row.totalRevenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(row.totalTax)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.totalItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'by_customer' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Ventas por Cliente</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : salesByCustomer.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay datos de ventas por cliente disponibles
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(salesByCustomer, 'Ventas por Cliente', ['Cliente', 'Total Ventas', 'Total Ingresos', 'Total ITBIS', 'Total Items'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(salesByCustomer, 'ventas_por_cliente')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Ventas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Ingresos</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total ITBIS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesByCustomer.map((row: SalesByCustomer, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.totalSales}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(row.totalRevenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(row.totalTax)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.totalItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'by_product' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Ventas por Producto</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : salesByProduct.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay datos de ventas por producto disponibles
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(salesByProduct, 'Ventas por Producto', ['Producto', 'SKU', 'Cantidad Total', 'Ingresos Totales'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(salesByProduct, 'ventas_por_producto')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cantidad Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ingresos Totales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesByProduct.map((row: SalesByProduct, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.productSku || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.totalQuantity}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

function InventoryReports() {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [byCategory, setByCategory] = useState<InventoryByCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const getStockStatusBadge = (stock: number, minStock: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">🔴 AGOTADO</span>
    } else if (stock <= minStock) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">🟠 STOCK BAJO</span>
    } else if (stock <= minStock * 1.5) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">🟡 STOCK MEDIO</span>
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">🟢 STOCK ALTO</span>
    }
  }

  const exportToPDF = (data: any[], title: string, headers: string[]) => {
    const doc = new jsPDF()
    doc.text(title, 14, 20)

    const tableData = data.map((row: any) =>
      headers.map(header => {
        let value = '';

        // Handle different data structures based on the report type
        switch (header) {
          case 'Producto':
            value = row.product?.name || row.name || '';
            break;
          case 'SKU':
            value = row.product?.sku || row.sku || '';
            break;
          case 'Stock':
            value = row.stock || '';
            break;
          case 'Mínimo':
            value = row.minStock || '';
            break;
          case 'Estado':
            value = row.stock === 0 ? 'Agotado' : row.stock <= row.minStock ? 'Stock Bajo' : 'Normal';
            break;
          case 'Tipo':
            value = row.type === 'IN' ? 'Entrada' : row.type === 'OUT' ? 'Salida' : row.type === 'SALE' ? 'Venta' : 'Ajuste';
            break;
          case 'Cantidad':
            value = row.quantity || '';
            break;
          case 'Fecha':
            value = row.createdAt ? new Date(row.createdAt).toLocaleString('es-DO') : '';
            break;
          case 'Notas':
            value = row.reason || '';
            break;
          case 'Categoría':
            value = row.category || '';
            break;
          case 'Productos':
            value = row.totalProducts || '';
            break;
          case 'Stock Total':
            value = row.totalStock || '';
            break;
          case 'Valor Total':
            value = row.totalValue || '';
            break;
          default:
            // Fallback to generic mapping
            const key = header.toLowerCase().replace(/\s+/g, '');
            value = row[key] || row[header] || '';
        }

        // Don't format as currency for quantity/count fields
        const noCurrencyFields = [
          'Stock', 'Mínimo', 'Cantidad', 'Productos', 'Stock Total',
          'Total Ventas', 'Número de Ventas', 'Total Items', 'Cantidad Total'
        ];
        return typeof value === 'number' && !noCurrencyFields.includes(header) ? formatCurrency(value) : String(value);
      })
    )

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
    })

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  const loadSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/inventory?type=summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error loading inventory summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLowStock = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/inventory?type=low_stock')
      if (response.ok) {
        const data = await response.json()
        setLowStock(data)
      }
    } catch (error) {
      console.error('Error loading low stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMovements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'movements' })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadByCategory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/inventory?type=by_category')
      if (response.ok) {
        const data = await response.json()
        setByCategory(data)
      }
    } catch (error) {
      console.error('Error loading by category:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === 'summary') {
      loadSummary()
    } else if (activeSubTab === 'low_stock') {
      loadLowStock()
    } else if (activeSubTab === 'movements') {
      loadMovements()
    } else if (activeSubTab === 'by_category') {
      loadByCategory()
    }
  }, [activeSubTab, loadMovements])

  return (
    <div className="space-y-6">
      {/* Date Filters for movements */}
      {activeSubTab === 'movements' && (
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📅 Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📅 Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => { setStartDate(''); setEndDate('') }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'summary'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setActiveSubTab('low_stock')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'low_stock'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          ⚠️ Stock Bajo
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'movements'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📈 Movimientos
        </button>
        <button
          onClick={() => setActiveSubTab('by_category')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'by_category'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          🏷️ Por Categoría
        </button>
      </div>

      {activeSubTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-bold text-gray-800">Productos Activos</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.totalProducts || 0}
            </p>
            <p className="text-xs text-gray-600">En inventario</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-gray-800">Stock Bajo</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.lowStockCount || 0}
            </p>
            <p className="text-xs text-gray-600">Productos</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-bold text-gray-800">Sin Stock</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.outOfStockCount || 0}
            </p>
            <p className="text-xs text-gray-600">Productos agotados</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-lg border border-cyan-200">
            <h3 className="font-bold text-gray-800">Valor Total</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary ? formatCurrency(summary.totalInventoryValue) : '$0.00'}
            </p>
            <p className="text-xs text-gray-600">Del inventario</p>
          </div>
        </div>
      )}

      {activeSubTab === 'low_stock' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Productos con Stock Bajo o Agotado</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : lowStock.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                🎉 Todos los productos tienen stock adecuado
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => exportToPDF(lowStock, 'Productos con Stock Bajo', ['Producto', 'SKU', 'Stock', 'Mínimo', 'Estado'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(lowStock, 'stock_bajo')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mínimo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStock.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.sku || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.stock}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.minStock}</td>
                        <td className="px-4 py-3 text-sm">
                          {getStockStatusBadge(product.stock, product.minStock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Movimientos de Inventario</h3>
            <p className="text-sm text-gray-600">
              Historial de entradas, salidas y ajustes de stock
              {startDate && endDate && ` (${startDate} - ${endDate})`}
            </p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay movimientos de inventario en el período seleccionado
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(movements, 'Movimientos de Inventario', ['Producto', 'Tipo', 'Cantidad', 'Fecha', 'Notas'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(movements, 'movimientos_inventario')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.map((movement: InventoryMovement, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div>{movement.product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {movement.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            movement.type === 'IN' ? 'bg-green-100 text-green-800' :
                            movement.type === 'OUT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {movement.type === 'IN' ? 'Entrada' : movement.type === 'OUT' ? 'Salida' : 'Ajuste'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className={movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'}>
                            {movement.type === 'OUT' ? '-' : '+'}{Math.abs(movement.quantity)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(movement.createdAt).toLocaleString('es-DO')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {movement.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'by_category' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Inventario por Categoría</h3>
            <p className="text-sm text-gray-600">Resumen de stock y valor por categoría de productos</p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : byCategory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay datos de inventario por categoría
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4 p-4">
                  <button
                    onClick={() => exportToPDF(byCategory, 'Inventario por Categoría', ['Categoría', 'Productos', 'Stock Total', 'Valor Total'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(byCategory, 'inventario_por_categoria')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Productos</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Stock Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {byCategory.map((category: InventoryByCategory, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{category.totalProducts}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{category.totalStock}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(category.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerReports() {
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('summary')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const exportToPDF = (data: any[], title: string, headers: string[]) => {
    const doc = new jsPDF()
    doc.text(title, 14, 20)

    const tableData = data.map(row =>
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '')
        const value = row[key] || row[header] || ''
        
        // Don't format as currency for quantity/count fields
        const noCurrencyFields = [
          'Productos', 'Stock Total', 'Total Clientes', 'Clientes Activos', 'Clientes con Ventas'
        ];
        
        return typeof value === 'number' && !noCurrencyFields.includes(header) ? formatCurrency(value) : String(value)
      })
    )

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
    })

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (activeSubTab === 'summary') {
      loadSummary()
    } else if (activeSubTab === 'top_customers') {
      loadTopCustomers()
    }
  }, [activeSubTab])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/customers?type=summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error loading customer summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTopCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/customers?type=top_customers')
      if (response.ok) {
        const data = await response.json()
        setTopCustomers(data)
      }
    } catch (error) {
      console.error('Error loading top customers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'summary'
              ? 'bg-pink-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setActiveSubTab('top_customers')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeSubTab === 'top_customers'
              ? 'bg-pink-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          🏆 Top Clientes
        </button>
      </div>

      {activeSubTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
            <h3 className="font-bold text-gray-800">Total Clientes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.totalCustomers || 0}
            </p>
            <p className="text-xs text-gray-600">Registrados</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="font-bold text-gray-800">Clientes Activos</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.activeCustomers || 0}
            </p>
            <p className="text-xs text-gray-600">Últimos 30 días</p>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
            <h3 className="font-bold text-gray-800">Con Compras</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary?.customersWithSales || 0}
            </p>
            <p className="text-xs text-gray-600">Han comprado</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-gray-800">Compra Promedio</h3>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : summary ? formatCurrency(summary.averageSalesPerCustomer) : '$0.00'}
            </p>
            <p className="text-xs text-gray-600">Por cliente</p>
          </div>
        </div>
      )}

      {activeSubTab === 'top_customers' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Top 20 Clientes por Ingresos</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : topCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                📊 No hay datos de ventas disponibles
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => exportToPDF(topCustomers, 'Top Clientes', ['Cliente', 'Total Ventas', 'Ingresos Totales'])}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm mr-2"
                  >
                    📄 Exportar PDF
                  </button>
                  <button
                    onClick={() => exportToCSV(topCustomers, 'top_clientes')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    📊 Exportar CSV
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Ventas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ingresos Totales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                            {customer.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{customer.totalSales}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {formatCurrency(customer.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DGIIReports() {
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const exportToPDF = (data: any[], title: string, headers: string[]) => {
    const doc = new jsPDF()
    doc.text(title, 14, 20)

    const tableData = data.map(row =>
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '')
        const value = row[key] || row[header] || ''
        return typeof value === 'number' ? formatCurrency(value) : String(value)
      })
    )

    ;(doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 30,
    })

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateReport = async (form: string) => {
    setLoading(true)
    setSelectedForm(form)
    try {
      const params = new URLSearchParams({ form })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/dgii?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        alert('Error generando el reporte')
      }
    } catch (error) {
      console.error('Error generating DGII report:', error)
      alert('Error generando el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📅 Fecha Inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📅 Fecha Fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Form Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800">📄 Formulario 606</h3>
          <p className="text-sm text-red-600 mb-2">Compras y Servicios</p>
          <button
            onClick={() => generateReport('606')}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading && selectedForm === '606' ? 'Generando...' : 'Generar'}
          </button>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800">📄 Formulario 607</h3>
          <p className="text-sm text-blue-600 mb-2">Ventas</p>
          <button
            onClick={() => generateReport('607')}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading && selectedForm === '607' ? 'Generando...' : 'Generar'}
          </button>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800">📄 Formulario 608</h3>
          <p className="text-sm text-green-600 mb-2">ITBIS</p>
          <button
            onClick={() => generateReport('608')}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading && selectedForm === '608' ? 'Generando...' : 'Generar'}
          </button>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Formulario DGII {reportData.form} - {reportData.businessName}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (reportData.form === '607') {
                    exportToPDF(reportData.records, `Formulario_${reportData.form}`, ['NCF', 'Fecha', 'Cliente', 'Total', 'ITBIS'])
                  } else {
                    exportToPDF([reportData.totals || reportData.operations], `Formulario_${reportData.form}`, Object.keys(reportData.totals || reportData.operations))
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                📄 Exportar PDF
              </button>
              <button
                onClick={() => {
                  if (reportData.form === '607') {
                    exportToCSV(reportData.records, `formulario_${reportData.form}`)
                  } else {
                    exportToCSV([reportData.totals || reportData.operations], `formulario_${reportData.form}`)
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                📊 Exportar CSV
              </button>
            </div>
          </div>

          {reportData.form === '606' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">{reportData.note}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totals.totalPurchases)}</p>
                  <p className="text-xs text-gray-600">Total Compras</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totals.totalITBIS)}</p>
                  <p className="text-xs text-gray-600">ITBIS</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totals.totalRetainedITBIS)}</p>
                  <p className="text-xs text-gray-600">ITBIS Retenido</p>
                </div>
              </div>
            </div>
          )}

          {reportData.form === '607' && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{reportData.recordCount}</p>
                  <p className="text-xs text-gray-600">Registros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.totals.totalSales)}</p>
                  <p className="text-xs text-gray-600">Total Ventas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.totals.totalITBIS)}</p>
                  <p className="text-xs text-gray-600">ITBIS</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.totals.totalRetainedITBIS)}</p>
                  <p className="text-xs text-gray-600">ITBIS Retenido</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">NCF</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Cliente</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">ITBIS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.records.slice(0, 10).map((record: { ncf: string; saleDate: string; customerName: string; totalAmount: number; itbis: number }, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{record.ncf}</td>
                        <td className="px-3 py-2">{record.saleDate}</td>
                        <td className="px-3 py-2">{record.customerName}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(record.totalAmount)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(record.itbis)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.records.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Mostrando 10 de {reportData.records.length} registros
                  </p>
                )}
              </div>
            </div>
          )}

          {reportData.form === '608' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">{reportData.note}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.operations.totalITBISSales)}</p>
                  <p className="text-xs text-gray-600">ITBIS Ventas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.operations.totalITBISPurchases)}</p>
                  <p className="text-xs text-gray-600">ITBIS Compras</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${reportData.operations.netITBIS >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.operations.netITBIS)}
                  </p>
                  <p className="text-xs text-gray-600">ITBIS Neto</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}