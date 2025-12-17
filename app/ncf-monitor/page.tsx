'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NCFStatus {
  type: string
  prefix: string
  currentNumber: number
  startNumber: number
  endNumber: number
  expiryDate: string
  isActive: boolean
  daysLeft: number
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'NORMAL' | 'LOW_STOCK' | 'EXHAUSTED'
  remaining: number
  percentageUsed: number
  alertLevel: 'NONE' | 'WARNING' | 'CRITICAL' | 'DANGER'
}

interface MonitorSummary {
  totalSequences: number
  activeSequences: number
  expiredSequences: number
  expiringSequences: number
  lowStockSequences: number
  exhaustedSequences: number
  criticalAlerts: number
  warningAlerts: number
  dangerAlerts: number
}

interface MonitorData {
  data: NCFStatus[]
  summary: MonitorSummary
  lastChecked: string
  nextCheck: string
}

interface Alert {
  severity: string
  message: string
}

export default function NCFMonitorPage() {
  const router = useRouter()
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    loadMonitorData()
  }, [])

  const loadMonitorData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ncf/monitor')
      if (response.ok) {
        const data = await response.json()
        setMonitorData(data)
        setLastUpdate(new Date().toLocaleString('es-DO'))
      } else {
        alert('Error al cargar los datos del monitor NCF')
      }
    } catch (error) {
      console.error('Error loading NCF monitor data:', error)
      alert('Error al cargar los datos del monitor NCF')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheck = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/ncf/monitor/check', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        await loadMonitorData()
        
        // Show alerts if any
        if (result.alerts && result.alerts.length > 0) {
          const alertMessages = result.alerts.map((alert: Alert) =>
            `${alert.severity}: ${alert.message}`
          ).join('\n')
          
          if (result.alerts.some((alert: Alert) => alert.severity === 'CRITICAL' || alert.severity === 'DANGER')) {
            alert(`⚠️ ALERTAS DETECTADAS:\n\n${alertMessages}`)
          } else {
            alert(`ℹ️ Resultados de la verificación:\n\n${alertMessages}`)
          }
        } else {
          alert('✅ Verificación completada. No se encontraron problemas.')
        }
      } else {
        alert('Error al ejecutar la verificación manual')
      }
    } catch (error) {
      console.error('Error during manual check:', error)
      alert('Error al ejecutar la verificación manual')
    } finally {
      setChecking(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200'
      case 'EXHAUSTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'EXPIRING_SOON': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'LOW_STOCK': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'NORMAL': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'DANGER': return 'bg-red-500 text-white'
      case 'CRITICAL': return 'bg-orange-500 text-white'
      case 'WARNING': return 'bg-yellow-500 text-white'
      case 'NONE': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EXPIRED': return '🔴'
      case 'EXHAUSTED': return '🚫'
      case 'EXPIRING_SOON': return '⚠️'
      case 'LOW_STOCK': return '📉'
      case 'NORMAL': return '✅'
      default: return '❓'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-DO').format(num)
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              🔍 Monitor NCF
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Monitoreo en tiempo real del estado de las secuencias NCF
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg font-semibold disabled:opacity-50"
            >
              {checking ? '🔄 Verificando...' : '🔍 Verificar Ahora'}
            </button>
            <button
              onClick={loadMonitorData}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
            >
              🔄 Actualizar
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
            >
              ← Volver al Panel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {monitorData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Secuencias Activas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {monitorData.summary.activeSequences}/{monitorData.summary.totalSequences}
                  </p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas Críticas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {monitorData.summary.criticalAlerts + monitorData.summary.dangerAlerts}
                  </p>
                </div>
                <div className="text-2xl">🚨</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Por Expirar</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {monitorData.summary.expiringSequences}
                  </p>
                </div>
                <div className="text-2xl">⏰</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {monitorData.summary.lowStockSequences}
                  </p>
                </div>
                <div className="text-2xl">📉</div>
              </div>
            </div>
          </div>
        )}

        {/* Last Update Info */}
        {monitorData && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                📅 Última verificación: {new Date(monitorData.lastChecked).toLocaleString('es-DO')}
              </span>
              <span>
                🔄 Última actualización: {lastUpdate}
              </span>
            </div>
          </div>
        )}

        {/* NCF Status Table */}
        {monitorData && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Tipo NCF</th>
                    <th className="px-6 py-4 text-left font-semibold">Estado</th>
                    <th className="px-6 py-4 text-left font-semibold">Progreso</th>
                    <th className="px-6 py-4 text-left font-semibold">Números</th>
                    <th className="px-6 py-4 text-left font-semibold">Fecha Expiración</th>
                    <th className="px-6 py-4 text-left font-semibold">Días Restantes</th>
                    <th className="px-6 py-4 text-left font-semibold">Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monitorData.data.map((ncf) => (
                    <tr key={ncf.type} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-lg">{ncf.type}</div>
                          <div className="text-sm text-gray-500">Prefijo: {ncf.prefix}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ncf.status)}`}>
                          {getStatusIcon(ncf.status)} {ncf.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              ncf.percentageUsed > 90 ? 'bg-red-500' :
                              ncf.percentageUsed > 75 ? 'bg-orange-500' :
                              ncf.percentageUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(ncf.percentageUsed, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ncf.percentageUsed.toFixed(1)}% usado
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div><strong>{formatNumber(ncf.remaining)}</strong> restantes</div>
                          <div className="text-gray-500">
                            {formatNumber(ncf.currentNumber)} / {formatNumber(ncf.endNumber)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>{formatDate(ncf.expiryDate)}</div>
                          <div className={`text-xs ${
                            ncf.daysLeft < 0 ? 'text-red-600' :
                            ncf.daysLeft <= 7 ? 'text-orange-600' :
                            ncf.daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {ncf.daysLeft < 0 ? 'Expirado' : 
                             ncf.daysLeft === 0 ? 'Expira hoy' : 
                             `${ncf.daysLeft} días`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${
                          ncf.daysLeft < 0 ? 'text-red-600' :
                          ncf.daysLeft <= 7 ? 'text-orange-600' :
                          ncf.daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {ncf.daysLeft < 0 ? `+${Math.abs(ncf.daysLeft)}` : ncf.daysLeft}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAlertColor(ncf.alertLevel)}`}>
                          {ncf.alertLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Required Section */}
        {monitorData && (monitorData.summary.criticalAlerts > 0 || monitorData.summary.dangerAlerts > 0) && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-800 mb-3">
              🚨 ACCIÓN REQUERIDA
            </h3>
            <div className="text-red-700">
              <p className="mb-2">
                Se han detectado <strong>{monitorData.summary.criticalAlerts + monitorData.summary.dangerAlerts}</strong> problema(s) crítico(s) 
                que requieren atención inmediata:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {monitorData.data
                  .filter(ncf => ncf.alertLevel === 'CRITICAL' || ncf.alertLevel === 'DANGER')
                  .map(ncf => (
                    <li key={ncf.type}>
                      <strong>NCF {ncf.type}:</strong> {
                        ncf.status === 'EXPIRED' ? 'Secuencia expirada' :
                        ncf.status === 'EXHAUSTED' ? 'Secuencia agotada' :
                        ncf.daysLeft <= 7 ? `Expira en ${ncf.daysLeft} días` :
                        ncf.remaining < 20 ? `Solo quedan ${ncf.remaining} números` :
                        'Requiere atención'
                      }
                    </li>
                  ))
                }
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/settings')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  ⚙️ Ir a Configuración NCF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}