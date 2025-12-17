'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface DashboardStats {
  todaySales: {
    total: number
    formatted: string
  }
  todayTransactions: number
  totalProducts: number
  lowStockProducts: number
  criticalStockProducts: number
  recentSales: Array<{
    id: string
    total: number
    createdAt: string
    customer: {
      name: string
    }
  }>
  weeklySales: Array<{
    date: string
    total: number
    count: number
  }>
  lastUpdated: string
}

interface NCFAlert {
  summary: {
    total: number
    danger: number
    critical: number
    warning: number
  }
  data: Array<{
    sequenceType: string
    severity: string
    message: string
  }>
}

interface AlertItem {
  sequenceType: string
  severity: string
  message: string
}

export default function DashboardPage() {
  const [ncfAlerts, setNcfAlerts] = useState<NCFAlert | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeUntilNext, setTimeUntilNext] = useState(30)
  const [showRefreshNotification, setShowRefreshNotification] = useState(false)

  const loadNCFAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/ncf/alerts')
      if (response.ok) {
        const data = await response.json()
        setNcfAlerts(data)
      }
    } catch (error) {
      console.error('Error loading NCF alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDashboardStats(data.data)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const refreshAllData = useCallback(async (isAutomatic = false) => {
    setIsRefreshing(true)
    await Promise.all([loadNCFAlerts(), loadDashboardStats()])
    setLastUpdated(new Date())
    setTimeUntilNext(30) // Reset countdown
    setIsRefreshing(false)
    
    // Show notification only for automatic refreshes
    if (isAutomatic) {
      setShowRefreshNotification(true)
      setTimeout(() => setShowRefreshNotification(false), 3000)
    }
  }, [loadNCFAlerts, loadDashboardStats])

  useEffect(() => {
    // Initialize the lastUpdated date only on client-side to avoid hydration mismatch
    setLastUpdated(new Date())
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshAllData(true) // true indicates automatic refresh
    }, 30000)
    
    // Countdown timer for next update
    const countdownInterval = setInterval(() => {
      setTimeUntilNext(prev => {
        if (prev <= 1) {
          return 30 // Reset to 30 when it reaches 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Initial load
    refreshAllData(false)
    
    return () => {
      clearInterval(interval)
      clearInterval(countdownInterval)
    }
  }, [refreshAllData])

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'DANGER': return '🚨'
      case 'CRITICAL': return '⚠️'
      case 'WARNING': return '⚡'
      default: return 'ℹ️'
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getStockAlertColor = () => {
    if (!dashboardStats) return 'from-green-500 to-green-600'
    
    if (dashboardStats.criticalStockProducts > 0) {
      return 'from-red-500 to-red-600'
    } else if (dashboardStats.lowStockProducts > 0) {
      return 'from-yellow-500 to-yellow-600'
    } else {
      return 'from-green-500 to-green-600'
    }
  }

  const getStockAlertIcon = () => {
    if (!dashboardStats) return '✅'
    
    if (dashboardStats.criticalStockProducts > 0) {
      return '🚨'
    } else if (dashboardStats.lowStockProducts > 0) {
      return '⚠️'
    } else {
      return '✅'
    }
  }

  const getStockAlertText = () => {
    if (!dashboardStats) return 'Cargando...'
    
    if (dashboardStats.criticalStockProducts > 0) {
      return 'Crítico'
    } else if (dashboardStats.lowStockProducts > 0) {
      return 'Atención'
    } else {
      return 'Normal'
    }
  }

  // Safe access to NCF alert properties
  const ncfDanger = ncfAlerts?.summary?.danger || 0
  const ncfCritical = ncfAlerts?.summary?.critical || 0
  const ncfWarning = ncfAlerts?.summary?.warning || 0
  const ncfTotal = ncfAlerts?.summary?.total || 0

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Welcome Header - Compacto */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-4 mb-4 text-white relative overflow-hidden flex-shrink-0">
          {/* Overlay para mejor contraste */}
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 drop-shadow-lg">
                👋 Bienvenido al Sistema POS
              </h1>
              <div className="flex items-center gap-2">
                <span className="bg-gray-900 bg-opacity-70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg border border-white border-opacity-50">
                  Rol: Administrador
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 bg-opacity-70 backdrop-blur-lg rounded-lg p-3 border border-white border-opacity-50 shadow-xl">
                <p className="text-xs font-bold text-white mb-1 uppercase tracking-wide">Empresa</p>
                <p className="text-lg font-bold text-white">🏪 GNTech Demo</p>
              </div>
              
              <div className="bg-gray-900 bg-opacity-70 backdrop-blur-lg rounded-lg p-3 border border-white border-opacity-50 shadow-xl">
                <p className="text-xs font-bold text-white mb-1 uppercase tracking-wide">Última actualización</p>
                <p className="text-sm font-bold text-white">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : '--:--:--'}
                </p>
              </div>
              
              <button
                onClick={() => refreshAllData(false)}
                disabled={isRefreshing}
                className={`bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg border border-white border-opacity-50 shadow-xl transition-all duration-200 flex items-center gap-2 ${
                  isRefreshing ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl'
                }`}
                title={isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
              >
                <span className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`}>
                  🔄
                </span>
                <div className="text-xs font-bold">
                  {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                  {!isRefreshing && (
                    <div className="text-xs text-blue-200">
                      Próxima: {timeUntilNext}s
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Auto-refresh notification */}
        {showRefreshNotification && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
            <span className="text-sm">✅</span>
            <span className="text-sm font-bold">Datos actualizados automáticamente</span>
          </div>
        )}

        {/* Stats Cards - Compactas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-lg">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">HOY</span>
            </div>
            <h3 className="text-gray-600 text-xs font-semibold mb-1">Ventas</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {statsLoading ? '...' : dashboardStats?.todaySales.formatted || 'RD$ 0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total del día</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">HOY</span>
            </div>
            <h3 className="text-gray-600 text-xs font-semibold mb-1">Transacciones</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {statsLoading ? '...' : dashboardStats?.todayTransactions || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ventas realizadas</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-purple-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-2 rounded-lg">
                <span className="text-xl">📦</span>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">TOTAL</span>
            </div>
            <h3 className="text-gray-600 text-xs font-semibold mb-1">Productos</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {statsLoading ? '...' : dashboardStats?.totalProducts || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">En inventario</p>
          </div>

          {/* NCF Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-red-100 hover:shadow-xl transition-all duration-200 relative">
            {isRefreshing && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className={`bg-gradient-to-br ${
                ncfDanger > 0 ? 'from-red-500 to-red-600' :
                ncfCritical > 0 ? 'from-orange-500 to-orange-600' :
                ncfWarning > 0 ? 'from-yellow-500 to-yellow-600' :
                'from-green-500 to-green-600'
              } text-white p-2 rounded-lg`}>
                <span className="text-xl">
                  {ncfDanger > 0 ? '🚨' :
                   ncfCritical > 0 ? '⚠️' :
                   ncfWarning > 0 ? '⚡' : '✅'}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ncfDanger > 0 ? 'text-red-600 bg-red-50' :
                ncfCritical > 0 ? 'text-orange-600 bg-orange-50' :
                ncfWarning > 0 ? 'text-yellow-600 bg-yellow-50' :
                'text-green-600 bg-green-50'
              }`}>
                {ncfTotal > 0 ? 'ALERTAS' : 'OK'}
              </span>
            </div>
            <h3 className="text-gray-600 text-xs font-semibold mb-1">Estado NCF</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              {loading ? '...' : ncfTotal}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? 'Cargando...' :
               ncfDanger > 0 ? 'Crítico' :
               ncfCritical > 0 ? 'Atención' :
               ncfWarning > 0 ? 'Advertencia' : 'Normal'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-orange-100 hover:shadow-xl transition-all duration-200 relative">
            {isRefreshing && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className={`bg-gradient-to-br ${getStockAlertColor()} text-white p-2 rounded-lg`}>
                <span className="text-xl">{getStockAlertIcon()}</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                (dashboardStats?.criticalStockProducts || 0) > 0 ? 'text-red-600 bg-red-50' :
                (dashboardStats?.lowStockProducts || 0) > 0 ? 'text-yellow-600 bg-yellow-50' :
                'text-green-600 bg-green-50'
              }`}>
                {(dashboardStats?.lowStockProducts || 0) > 0 ? 'ALERTA' : 'OK'}
              </span>
            </div>
            <h3 className="text-gray-600 text-xs font-semibold mb-1">Stock Bajo</h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              {statsLoading ? '...' : dashboardStats?.lowStockProducts || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {statsLoading ? 'Cargando...' : getStockAlertText()}
            </p>
          </div>
        </div>

        {/* NCF Alerts Section - Only show if there are alerts */}
        {ncfAlerts?.data && ncfAlerts.data.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 border border-red-100 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                🚨 Alertas NCF Críticas
              </h2>
              <Link 
                href="/ncf-monitor"
                className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ver Detalles
              </Link>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {ncfAlerts.data.slice(0, 3).map((alert: AlertItem, index: number) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'DANGER' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'CRITICAL' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getAlertIcon(alert.severity)}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        alert.severity === 'DANGER' ? 'text-red-800' :
                        alert.severity === 'CRITICAL' ? 'text-orange-800' :
                        'text-yellow-800'
                      }`}>
                        NCF {alert.sequenceType}
                      </p>
                      <p className={`text-xs ${
                        alert.severity === 'DANGER' ? 'text-red-700' :
                        alert.severity === 'CRITICAL' ? 'text-orange-700' :
                        'text-yellow-700'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {ncfAlerts.data.length > 3 && (
                <p className="text-xs text-gray-600 text-center">
                  Y {ncfAlerts.data.length - 3} alerta(s) más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Sales Section */}
        {dashboardStats?.recentSales && dashboardStats.recentSales.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                💰 Ventas Recientes
              </h2>
              <Link 
                href="/sales"
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Todas
              </Link>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {dashboardStats.recentSales.slice(0, 3).map((sale, index) => (
                <div key={index} className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💳</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">
                        {formatCurrency(sale.total)}
                      </p>
                      <p className="text-xs text-blue-700">
                        {sale.customer?.name || 'Cliente General'} • {formatDate(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {dashboardStats.recentSales.length > 3 && (
                <p className="text-xs text-gray-600 text-center">
                  Y {dashboardStats.recentSales.length - 3} venta(s) más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions - Compactas */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3 flex-shrink-0">
            ⚡ Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Link
              href="/pos"
              className="group p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center block shadow-md hover:shadow-lg"
            >
              <div className="text-3xl mb-2">🛒</div>
              <p className="font-bold text-base">Nueva Venta</p>
              <p className="text-xs text-blue-100 mt-1">Iniciar POS</p>
            </Link>
            
            <Link
              href="/sales"
              className="group p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-center block shadow-md hover:shadow-lg"
            >
              <div className="text-3xl mb-2">📊</div>
              <p className="font-bold text-base">Historial</p>
              <p className="text-xs text-emerald-100 mt-1">Ver ventas anteriores</p>
            </Link>
            
            <Link
              href="/ncf-monitor"
              className="group p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-center block shadow-md hover:shadow-lg"
            >
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-bold text-base">Monitor NCF</p>
              <p className="text-xs text-red-100 mt-1">Verificar estado</p>
            </Link>
            
            <Link
              href="/products"
              className="group p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-center block shadow-md hover:shadow-lg"
            >
              <div className="text-3xl mb-2">📦</div>
              <p className="font-bold text-base">Productos</p>
              <p className="text-xs text-purple-100 mt-1">Gestionar inventario</p>
            </Link>
            
            <Link
              href="/customers"
              className="group p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-center block shadow-md hover:shadow-lg"
            >
              <div className="text-3xl mb-2">👥</div>
              <p className="font-bold text-base">Clientes</p>
              <p className="text-xs text-orange-100 mt-1">Administrar clientes</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
