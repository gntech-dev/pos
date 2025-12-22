'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import LogoSelector from '../../components/LogoSelector'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

interface RolePermissions {
  [key: string]: {
    label: string
    icon: string
    color: string
    permissions: string[]
  }
}

interface RNCSyncStatus {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  message: string
  progress?: number
  completedAt?: string
}

interface RNCSearchResult {
  businessName: string
  rnc: string
  businessType?: string
  address?: string
  province?: string
  phone?: string
}

const rolePermissions: RolePermissions = {
  ADMIN: {
    label: '👑 Administrador',
    icon: '👑',
    color: 'bg-red-100 text-red-800 border-red-300',
    permissions: [
      'Acceso completo al sistema',
      'Gestionar usuarios y roles',
      'Configurar sistema y email',
      'Ver todos los reportes',
      'Gestionar inventario completo',
      'Procesar reembolsos',
      'Configurar NCF y facturación'
    ]
  },
  MANAGER: {
    label: '👔 Gerente',
    icon: '👔',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    permissions: [
      'Gestionar ventas y clientes',
      'Ver reportes financieros',
      'Gestionar inventario',
      'Aprobar cotizaciones',
      'Configurar precios',
      'Gestionar usuarios (excepto admins)'
    ]
  },
  CASHIER: {
    label: '💰 Cajero',
    icon: '💰',
    color: 'bg-green-100 text-green-800 border-green-300',
    permissions: [
      'Procesar ventas',
      'Gestionar clientes básicos',
      'Ver productos disponibles',
      'Imprimir recibos',
      'Aplicar descuentos básicos'
    ]
  },
  ACCOUNTANT: {
    label: '🧮 Contador',
    icon: '🧮',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    permissions: [
      'Ver reportes financieros',
      'Gestionar facturación',
      'Configurar NCF',
      'Procesar reembolsos',
      'Auditar transacciones'
    ]
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [users, setUsers] = useState<User[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')

  // RNC State
  const [rncStats, setRncStats] = useState({
    totalRecords: 0,
    syncedRecords: 0,
    failedRecords: 0,
    lastSyncDate: null as Date | null,
    syncStatus: null as RNCSyncStatus | null
  })
  const [rncSearchQuery, setRncSearchQuery] = useState('')
  const [rncSearchResults, setRncSearchResults] = useState<RNCSearchResult[]>([])
  const [searchingRNC, setSearchingRNC] = useState(false)

  const handleSaveEmailConfig = async () => {
    if (!emailConfig.host || !emailConfig.port || !emailConfig.user) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSavingConfig(true)
    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig)
      })

      if (response.ok) {
        alert('✅ Configuración de correo guardada exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      alert('Error al guardar la configuración')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role
    })
    setShowUserForm(true)
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE' // Using DELETE for deactivation
      })

      if (response.ok) {
        await loadUsers()
        alert(`Usuario ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Error al cambiar el estado del usuario')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: userFormData.name,
          username: userFormData.username,
          email: userFormData.email,
          role: userFormData.role,
          isActive: true // Keep active when updating
        })
      })

      if (response.ok) {
        await loadUsers()
        setShowUserForm(false)
        setEditingUser(null)
        setUserFormData({ name: '', username: '', email: '', password: '', role: 'CASHIER' })
        alert('Usuario actualizado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Ocurrió un error al actualizar el usuario')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      alert('Por favor ingrese un correo electrónico para la prueba')
      return
    }

    setTestingEmail(true)
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailAddress })
      })

      if (response.ok) {
        alert('✅ Correo de prueba enviado exitosamente')
        setTestEmailAddress('')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error testing email:', error)
      alert('Error al enviar el correo de prueba')
    } finally {
      setTestingEmail(false)
    }
  }
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'CASHIER'
  })
  
  const [businessData, setBusinessData] = useState({
    name: 'GNTech Demo',
    rnc: '000-00000-0',
    address: 'Santo Domingo, República Dominicana',
    phone: '809-555-5555',
    email: 'info@gntech.com',
    logo: ''
  })

  const [ncfData, setNcfData] = useState({
    b01Start: '00000001',
    b01End: '00001000',
    b01Current: '00000001',
    b01ExpiryDate: '',
    b02Start: '00000001',
    b02End: '00001000',
    b02Current: '00000001',
    b02ExpiryDate: '',
    b14Start: '00000001',
    b14End: '00001000',
    b14Current: '00000001',
    b14ExpiryDate: '',
    b15Start: '00000001',
    b15End: '00001000',
    b15Current: '00000001',
    b15ExpiryDate: ''
  })

  const [loadingNCF, setLoadingNCF] = useState(false)

  const [emailConfig, setEmailConfig] = useState({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '587',
    secure: process.env.SMTP_SECURE === 'true',
    tls: process.env.SMTP_TLS !== 'false', // Default to true unless explicitly disabled
    timeout: process.env.SMTP_TIMEOUT || '30000',
    user: process.env.SMTP_USER || '',
    password: '',
    senderName: process.env.SMTP_SENDER_NAME || 'Sistema POS - GNTech'
  })

  const [savingConfig, setSavingConfig] = useState(false)

  const handleProviderSelect = (provider: 'gmail' | 'outlook' | 'office365' | 'custom') => {
    switch (provider) {
      case 'gmail':
        setEmailConfig({
          ...emailConfig,
          host: 'smtp.gmail.com',
          port: '587',
          secure: false,
          tls: true,
          password: '' // Clear password when switching providers
        })
        break
      case 'outlook':
        setEmailConfig({
          ...emailConfig,
          host: 'smtp-mail.outlook.com',
          port: '587',
          secure: false,
          tls: true,
          password: '' // Clear password when switching providers
        })
        break
      case 'office365':
        setEmailConfig({
          ...emailConfig,
          host: 'smtp.office365.com',
          port: '587',
          secure: false,
          tls: true,
          password: '' // Clear password when switching providers
        })
        break
      case 'custom':
        // Keep current values for custom configuration
        setEmailConfig({
          ...emailConfig,
          password: '' // Clear password when switching to custom
        })
        break
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }

    // Request notification permission for sync completion alerts
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [activeTab])



  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/settings/email')
      if (response.ok) {
        const config = await response.json()
        setEmailConfig(config)
      }
    } catch (error) {
      console.error('Error loading email config:', error)
    }
  }

  const loadNCFConfig = async () => {
    try {
      const response = await fetch('/api/settings/ncf')
      if (response.ok) {
        const config = await response.json()
        setNcfData(config)
      }
    } catch (error) {
      console.error('Error loading NCF config:', error)
    }
  }

  const loadBusinessConfig = async () => {
    try {
      const response = await fetch('/api/settings/business')
      if (response.ok) {
        const config = await response.json()
        setBusinessData(config)
      }
    } catch (error) {
      console.error('Error loading business config:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    }
  }

  const loadRNCStats = useCallback(async () => {
    // This function doesn't use rncStats, but we include it in deps for useEffect
    try {
      const timestamp = Date.now() // Add timestamp to prevent caching
      const response = await fetch(`/api/rnc/sync?_t=${timestamp}`)
      if (response.ok) {
        const stats = await response.json()
        console.log('RNC Stats loaded:', stats) // Debug log
        setRncStats(stats)

        // Show notification if sync just completed
        if (stats.syncStatus?.status === 'COMPLETED' && rncStats.syncStatus?.status === 'RUNNING') {
          // Only show if we transitioned from RUNNING to COMPLETED
          if (Notification.permission === 'granted') {
            new Notification('✅ Sincronización RNC Completada', {
              body: stats.syncStatus.message,
              icon: '/favicon.ico'
            })
          }
        }
      } else {
        console.error('Failed to load RNC stats:', response.status)
      }
    } catch (error) {
      console.error('Error cargando estadísticas RNC:', error)
    }
  }, [rncStats.syncStatus?.status])

  useEffect(() => {
    if (activeTab === 'business') {
      loadBusinessConfig()
    }
    if (activeTab === 'system') {
      loadEmailConfig()
    }
    if (activeTab === 'ncf') {
      loadNCFConfig()
    }
    if (activeTab === 'rnc') {
      loadRNCStats()
    }
  }, [activeTab, loadRNCStats])

  // Poll sync status only when RNC tab is active and sync is running
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTab === 'rnc' && rncStats.syncStatus?.status === 'RUNNING') {
      console.log('Starting RNC stats polling') // Debug log
      // Load immediately
      loadRNCStats()
      // Then poll every 1 second for faster updates during sync
      interval = setInterval(() => {
        loadRNCStats()
      }, 1000)
    } else {
      console.log('Stopping RNC stats polling') // Debug log
    }
    return () => {
      if (interval) {
        console.log('Clearing RNC stats polling interval') // Debug log
        clearInterval(interval)
      }
    }
  }, [activeTab, rncStats.syncStatus?.status, loadRNCStats])

  const handleRNCSync = async (forceSync = false) => {
    try {
      const response = await fetch('/api/rnc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceSync })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}`)
        await loadRNCStats()
      } else if (response.status === 409) {
        // Sync already running
        const error = await response.json()
        alert(`⚠️ ${error.error}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sincronizando RNC:', error)
      alert('Error al sincronizar RNC')
    }
  }

  const handleRNCSearch = async () => {
    if (!rncSearchQuery.trim()) {
      alert('Por favor ingrese un RNC o nombre de empresa para buscar')
      return
    }

    setSearchingRNC(true)
    try {
      const response = await fetch(`/api/rnc/search?q=${encodeURIComponent(rncSearchQuery.trim())}`)
      if (response.ok) {
        const result = await response.json()
        setRncSearchResults(result.results)
        if (result.results.length === 0) {
          alert('No se encontraron resultados para la búsqueda')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error buscando RNC:', error)
      alert('Error al buscar RNC')
    } finally {
      setSearchingRNC(false)
    }
  }

  const handleCancelSync = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar la sincronización en curso?')) {
      return
    }

    console.log('Cancelling RNC sync...')
    try {
      // Reset sync status
      const response = await fetch('/api/rnc/sync/cancel', {
        method: 'POST'
      })

      console.log('Cancel response:', response.status, response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Cancel result:', result)
        alert('✅ Sincronización cancelada')
        await loadRNCStats()
      } else {
        const error = await response.json()
        console.error('Cancel error:', error)
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error cancelando sync:', error)
      alert('Error al cancelar la sincronización')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingUsers(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      })

      if (response.ok) {
        await loadUsers()
        setShowUserForm(false)
        setUserFormData({ name: '', username: '', email: '', password: '', role: 'CASHIER' })
        alert('Usuario creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creando usuario:', error)
      alert('Ocurrió un error al crear el usuario')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setBusinessData({ ...businessData, logo: result.filePath })
        alert('✅ Logo subido exitosamente')
      } else {
        const error = await response.json()
        alert(`Error al subir el logo: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Error al subir el logo')
    }
  }

  const handleSaveBusiness = async () => {
    try {
      const response = await fetch('/api/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      })

      if (response.ok) {
        alert('✅ Configuración de empresa guardada exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving business config:', error)
      alert('Error al guardar la configuración de empresa')
    }
  }

  const handleSaveNCF = async () => {
    setLoadingNCF(true)
    try {
      const response = await fetch('/api/settings/ncf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ncfData)
      })

      if (response.ok) {
        alert('✅ Configuración de NCF guardada exitosamente')
        await loadNCFConfig() // Reload the data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving NCF config:', error)
      alert('Error al guardar la configuración NCF')
    } finally {
      setLoadingNCF(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent flex items-center gap-2">
            ⚙️ Configuración del Sistema
          </h1>
          <p className="text-gray-600 text-xs mt-1">Administra la configuración de tu negocio</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'business'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🏢 Empresa
          </button>
          <button
            onClick={() => setActiveTab('ncf')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'ncf'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📄 NCF
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => setActiveTab('rnc')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'rnc'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🏢 RNC DGII
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'system'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🔧 Sistema
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Business Settings */}
            {activeTab === 'business' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  🏢 Información de la Empresa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={businessData.name}
                      onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      RNC *
                    </label>
                    <input
                      type="text"
                      value={businessData.rnc}
                      onChange={(e) => setBusinessData({ ...businessData, rnc: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="000-00000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="809-555-5555"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="info@empresa.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Logo de la Empresa
                    </label>

                    {/* Logo Selector Component */}
                    <div className="mb-6">
                      <LogoSelector
                        onLogoSelect={(logoPath) => setBusinessData({ ...businessData, logo: logoPath })}
                        currentLogo={businessData.logo}
                      />
                    </div>

                    {/* Custom Logo Upload */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        O sube tu propio logo personalizado:
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <textarea
                      value={businessData.address}
                      onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveBusiness}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            )}

            {/* NCF Settings - Enhanced */}
            {activeTab === 'ncf' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    📄 Configuración de NCF - DGII
                  </h2>
                  <p className="text-gray-600 text-sm">Administración de Números de Comprobante Fiscal</p>
                </div>

                {/* Educational Section */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    ℹ️ ¿Qué son los NCF?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-blue-700 mb-2">📋 Información General</h4>
                      <ul className="space-y-1 text-blue-800">
                        <li>• <strong>NCF</strong>: Número de Comprobante Fiscal</li>
                        <li>• <strong>DGII</strong>: Dirección General de Impuestos Internos</li>
                        <li>• <strong>Obligatorio</strong> para todas las ventas en RD</li>
                        <li>• <strong>Multas</strong> por uso incorrecto: hasta RD$50,000</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-700 mb-2">🏢 Estructura del NCF</h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-300 font-mono text-center">
                        <div className="text-blue-600 font-bold">B01 00000001</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Tipo + Secuencia (8 dígitos)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NCF Types Explanation */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🏷️ Tipos de NCF Disponibles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🧾</span>
                        <div>
                          <h4 className="font-bold text-green-800">B01 - Facturas de Crédito Fiscal</h4>
                          <p className="text-xs text-green-600 font-semibold">Para contribuyentes registrados</p>
                        </div>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Venta a empresas con RNC</li>
                        <li>• ITBIS deducible para el comprador</li>
                        <li>• Obligatorio para montos {'>'} RD$250,000</li>
                        <li>• <strong>Ejemplo:</strong> B0100000001</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🛒</span>
                        <div>
                          <h4 className="font-bold text-blue-800">B02 - Facturas de Consumo</h4>
                          <p className="text-xs text-blue-600 font-semibold">Para consumidores finales</p>
                        </div>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Venta a personas sin RNC</li>
                        <li>• ITBIS no deducible</li>
                        <li>• Uso más común en comercios</li>
                        <li>• <strong>Ejemplo:</strong> B0200000001</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-5 border-2 border-yellow-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">↩️</span>
                        <div>
                          <h4 className="font-bold text-yellow-800">B14 - Notas de Crédito</h4>
                          <p className="text-xs text-yellow-600 font-semibold">Para devoluciones y ajustes</p>
                        </div>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Reduce el monto de una factura anterior</li>
                        <li>• Para devoluciones de mercancía</li>
                        <li>• Ajustes en precios o cantidades</li>
                        <li>• <strong>Ejemplo:</strong> B1400000001</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-5 border-2 border-red-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">➕</span>
                        <div>
                          <h4 className="font-bold text-red-800">B15 - Notas de Débito</h4>
                          <p className="text-xs text-red-600 font-semibold">Para aumentos y correcciones</p>
                        </div>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Aumenta el monto de una factura anterior</li>
                        <li>• Correcciones de errores</li>
                        <li>• Recargos o intereses adicionales</li>
                        <li>• <strong>Ejemplo:</strong> B1500000001</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Range Configuration */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📊 Configuración de Rangos NCF
                  </h3>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <div>
                        <h4 className="font-bold text-yellow-800">Información Importante</h4>
                        <p className="text-sm text-yellow-700">
                          Los rangos de NCF deben obtenerse directamente de la DGII. Cada rango autorizado tiene un número inicial y final específico.
                          Nunca uses rangos no autorizados bajo pena de multas significativas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* B01 Range Configuration */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🧾</span>
                        <div>
                          <h4 className="font-bold text-green-800">B01 - Facturas de Crédito Fiscal</h4>
                          <p className="text-xs text-green-600">Para contribuyentes registrados</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-green-700 mb-1">Número Inicial</label>
                            <input
                              type="text"
                              value={ncfData.b01Start}
                              onChange={(e) => setNcfData({ ...ncfData, b01Start: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00000001"
                              maxLength={8}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-green-700 mb-1">Número Final</label>
                            <input
                              type="text"
                              value={ncfData.b01End}
                              onChange={(e) => setNcfData({ ...ncfData, b01End: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00001000"
                              maxLength={8}
                            />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-green-300">
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-green-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b01ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b01ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-green-700">Rango Autorizado:</span>
                            <span className="text-xs font-mono bg-green-100 px-2 py-1 rounded">
                              B01{ncfData.b01Start.padStart(8, '0')} - B01{ncfData.b01End.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-green-700">Próximo NCF:</span>
                            <span className="text-sm font-mono font-bold text-green-800">
                              B01{ncfData.b01Current.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="mt-2 bg-green-50 rounded p-2">
                            <div className="flex justify-between text-xs">
                              <span>Disponibles:</span>
                              <span className="font-bold">
                                {Math.max(0, parseInt(ncfData.b01End) - parseInt(ncfData.b01Current) + 1)} NCF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B02 Range Configuration */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🛒</span>
                        <div>
                          <h4 className="font-bold text-blue-800">B02 - Facturas de Consumo</h4>
                          <p className="text-xs text-blue-600">Para consumidores finales</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">Número Inicial</label>
                            <input
                              type="text"
                              value={ncfData.b02Start}
                              onChange={(e) => setNcfData({ ...ncfData, b02Start: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00000001"
                              maxLength={8}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">Número Final</label>
                            <input
                              type="text"
                              value={ncfData.b02End}
                              onChange={(e) => setNcfData({ ...ncfData, b02End: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00001000"
                              maxLength={8}
                            />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-blue-300">
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-blue-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b02ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b02ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-blue-700">Rango Autorizado:</span>
                            <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                              B02{ncfData.b02Start.padStart(8, '0')} - B02{ncfData.b02End.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-blue-700">Próximo NCF:</span>
                            <span className="text-sm font-mono font-bold text-blue-800">
                              B02{ncfData.b02Current.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="mt-2 bg-blue-50 rounded p-2">
                            <div className="flex justify-between text-xs">
                              <span>Disponibles:</span>
                              <span className="font-bold">
                                {Math.max(0, parseInt(ncfData.b02End) - parseInt(ncfData.b02Current) + 1)} NCF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B14 Range Configuration */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">↩️</span>
                        <div>
                          <h4 className="font-bold text-yellow-800">B14 - Notas de Crédito</h4>
                          <p className="text-xs text-yellow-600">Para devoluciones y ajustes</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-yellow-700 mb-1">Número Inicial</label>
                            <input
                              type="text"
                              value={ncfData.b14Start}
                              onChange={(e) => setNcfData({ ...ncfData, b14Start: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00000001"
                              maxLength={8}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-yellow-700 mb-1">Número Final</label>
                            <input
                              type="text"
                              value={ncfData.b14End}
                              onChange={(e) => setNcfData({ ...ncfData, b14End: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00001000"
                              maxLength={8}
                            />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-yellow-300">
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-yellow-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b14ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b14ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-yellow-700">Rango Autorizado:</span>
                            <span className="text-xs font-mono bg-yellow-100 px-2 py-1 rounded">
                              B14{ncfData.b14Start.padStart(8, '0')} - B14{ncfData.b14End.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-yellow-700">Próximo NCF:</span>
                            <span className="text-sm font-mono font-bold text-yellow-800">
                              B14{ncfData.b14Current.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="mt-2 bg-yellow-50 rounded p-2">
                            <div className="flex justify-between text-xs">
                              <span>Disponibles:</span>
                              <span className="font-bold">
                                {Math.max(0, parseInt(ncfData.b14End) - parseInt(ncfData.b14Current) + 1)} NCF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B15 Range Configuration */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">➕</span>
                        <div>
                          <h4 className="font-bold text-red-800">B15 - Notas de Débito</h4>
                          <p className="text-xs text-red-600">Para aumentos y correcciones</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-red-700 mb-1">Número Inicial</label>
                            <input
                              type="text"
                              value={ncfData.b15Start}
                              onChange={(e) => setNcfData({ ...ncfData, b15Start: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00000001"
                              maxLength={8}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-red-700 mb-1">Número Final</label>
                            <input
                              type="text"
                              value={ncfData.b15End}
                              onChange={(e) => setNcfData({ ...ncfData, b15End: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-mono text-sm"
                              placeholder="00001000"
                              maxLength={8}
                            />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-red-300">
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-red-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b15ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b15ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-red-700">Rango Autorizado:</span>
                            <span className="text-xs font-mono bg-red-100 px-2 py-1 rounded">
                              B15{ncfData.b15Start.padStart(8, '0')} - B15{ncfData.b15End.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-red-700">Próximo NCF:</span>
                            <span className="text-sm font-mono font-bold text-red-800">
                              B15{ncfData.b15Current.padStart(8, '0')}
                            </span>
                          </div>
                          <div className="mt-2 bg-red-50 rounded p-2">
                            <div className="flex justify-between text-xs">
                              <span>Disponibles:</span>
                              <span className="font-bold">
                                {Math.max(0, parseInt(ncfData.b15End) - parseInt(ncfData.b15Current) + 1)} NCF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Guidelines */}
                <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                    📚 Guía de Uso de NCF
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-purple-700 mb-2">✅ Cuándo usar cada tipo:</h4>
                      <ul className="space-y-1 text-purple-800">
                        <li><strong>B01:</strong> Venta a empresa con RNC</li>
                        <li><strong>B02:</strong> Venta a consumidor final</li>
                        <li><strong>B14:</strong> Devolución o descuento</li>
                        <li><strong>B15:</strong> Corrección o recargo</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-700 mb-2">🚫 Errores comunes:</h4>
                      <ul className="space-y-1 text-purple-800">
                        <li>• No usar NCF en ventas {'>'} RD$250,000</li>
                        <li>• Mezclar secuencias de diferentes tipos</li>
                        <li>• Usar secuencias no autorizadas</li>
                        <li>• Olvidar imprimir NCF en recibos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveNCF}
                    disabled={loadingNCF}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-lg"
                  >
                    {loadingNCF ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      '💾 Guardar Configuración NCF'
                    )}
                  </button>
                  <button
                    onClick={() => alert('Función de validación de NCF próximamente disponible')}
                    className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                  >
                    ✅ Validar con DGII
                  </button>
                </div>
              </div>
            )}

            {/* RNC DGII Settings */}
            {activeTab === 'rnc' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    🏢 Registro Nacional de Contribuyentes - DGII
                  </h2>
                  <p className="text-gray-600 text-sm">Sincronización y búsqueda de RNC desde la Dirección General de Impuestos Internos</p>
                </div>

                {/* Educational Section */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    ℹ️ ¿Qué es el RNC?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-blue-700 mb-2">🏢 Información General</h4>
                      <ul className="space-y-1 text-blue-800">
                        <li>• <strong>RNC</strong>: Registro Nacional de Contribuyentes</li>
                        <li>• <strong>DGII</strong>: Dirección General de Impuestos Internos</li>
                        <li>• <strong>Obligatorio</strong> para facturación a empresas</li>
                        <li>• <strong>Validación</strong> automática de contribuyentes</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-700 mb-2">📋 Estructura del RNC</h4>
                      <div className="bg-white p-3 rounded-lg border border-blue-300 font-mono text-center">
                        <div className="text-blue-600 font-bold">001-000000-0</div>
                        <div className="text-xs text-gray-600 mt-1">
                          9 dígitos + guiones (XXX-XXXXXX-X)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sync Status and Controls */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔄 Estado de Sincronización
                  </h3>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📊</span>
                        <span className="text-sm font-bold text-blue-700">Total RNC</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">{rncStats.totalRecords}</p>
                      <p className="text-xs text-blue-600">Registrados</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✅</span>
                        <span className="text-sm font-bold text-green-700">Sincronizados</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">{rncStats.syncedRecords}</p>
                      <p className="text-xs text-green-600">Actualizados</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">❌</span>
                        <span className="text-sm font-bold text-red-700">Fallidos</span>
                      </div>
                      <p className="text-2xl font-bold text-red-800">{rncStats.failedRecords}</p>
                      <p className="text-xs text-red-600">Con errores</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🕒</span>
                        <span className="text-sm font-bold text-purple-700">Última Sync</span>
                      </div>
                      <p className="text-sm font-bold text-purple-800">
                        {rncStats.lastSyncDate ? new Date(rncStats.lastSyncDate).toLocaleDateString('es-DO') : 'Nunca'}
                      </p>
                      <p className="text-xs text-purple-600">
                        {rncStats.lastSyncDate ? new Date(rncStats.lastSyncDate).toLocaleTimeString('es-DO') : ''}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {rncStats.syncStatus && rncStats.syncStatus.status === 'RUNNING' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Progreso de sincronización</span>
                        <span className="text-sm font-bold text-blue-600">{rncStats.syncStatus.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${rncStats.syncStatus.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{rncStats.syncStatus.message}</p>
                    </div>
                  )}

                  {/* Sync Status */}
                  {rncStats.syncStatus && rncStats.syncStatus.status !== 'RUNNING' && (
                    <div className="mb-4 p-3 rounded-lg border" style={{
                      backgroundColor: rncStats.syncStatus.status === 'COMPLETED' ? '#f0fdf4' : rncStats.syncStatus.status === 'FAILED' ? '#fef2f2' : '#f9fafb',
                      borderColor: rncStats.syncStatus.status === 'COMPLETED' ? '#bbf7d0' : rncStats.syncStatus.status === 'FAILED' ? '#fecaca' : '#e5e7eb'
                    }}>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${rncStats.syncStatus.status === 'COMPLETED' ? 'text-green-600' : rncStats.syncStatus.status === 'FAILED' ? 'text-red-600' : 'text-gray-600'}`}>
                          {rncStats.syncStatus.status === 'COMPLETED' ? '✅' : rncStats.syncStatus.status === 'FAILED' ? '❌' : '⏸️'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{
                            color: rncStats.syncStatus.status === 'COMPLETED' ? '#16a34a' : rncStats.syncStatus.status === 'FAILED' ? '#dc2626' : '#6b7280'
                          }}>
                            {rncStats.syncStatus.message}
                          </p>
                          {rncStats.syncStatus.completedAt && (
                            <p className="text-xs text-gray-500">
                              Completado: {new Date(rncStats.syncStatus.completedAt).toLocaleString('es-DO')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sync Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRNCSync(false)}
                      disabled={rncStats.syncStatus?.status === 'RUNNING'}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {rncStats.syncStatus?.status === 'RUNNING' ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sincronizando...
                        </span>
                      ) : (
                        '🔄 Sincronizar RNC'
                      )}
                    </button>
                    <button
                      onClick={() => handleRNCSync(true)}
                      disabled={rncStats.syncStatus?.status === 'RUNNING'}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      🔄 Forzar Sincronización
                    </button>
                    {rncStats.syncStatus?.status === 'RUNNING' && (
                      <button
                        onClick={handleCancelSync}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                      >
                        ❌ Cancelar Sync
                      </button>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <div>
                        <h4 className="font-bold text-yellow-800">Nota Importante</h4>
                        <p className="text-sm text-yellow-700">
                          La sincronización actual es simulada. En producción, se conectará directamente con la API de la DGII para obtener datos reales de contribuyentes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search RNC */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔍 Buscar RNC
                  </h3>

                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={rncSearchQuery}
                      onChange={(e) => setRncSearchQuery(e.target.value)}
                      placeholder="Buscar por RNC (ej: 00100000001) o nombre de empresa..."
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      onKeyPress={(e) => e.key === 'Enter' && handleRNCSearch()}
                    />
                    <button
                      onClick={handleRNCSearch}
                      disabled={searchingRNC}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-bold hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {searchingRNC ? (
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
                  {rncSearchResults.length > 0 && (
                    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-bold text-gray-800">Resultados de Búsqueda ({rncSearchResults.length})</h4>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {rncSearchResults.map((rnc: RNCSearchResult, index: number) => (
                          <div key={index} className="border-b border-gray-100 last:border-b-0 p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-bold text-gray-800">{rnc.businessName}</h5>
                                <p className="text-sm text-gray-600 font-mono">RNC: {rnc.rnc}</p>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Activo
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {rnc.businessType && (
                                <div><strong>Tipo:</strong> {rnc.businessType}</div>
                              )}
                              {rnc.address && (
                                <div><strong>Dirección:</strong> {rnc.address}</div>
                              )}
                              {rnc.province && (
                                <div><strong>Provincia:</strong> {rnc.province}</div>
                              )}
                              {rnc.phone && (
                                <div><strong>Teléfono:</strong> {rnc.phone}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Usage Guidelines */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    📚 Guía de Uso del RNC
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-bold text-green-700 mb-2">✅ Cuándo usar RNC:</h4>
                      <ul className="space-y-1 text-green-800">
                        <li>• Venta a empresas con RNC registrado</li>
                        <li>• Facturación a contribuyentes del ITBIS</li>
                        <li>• Transacciones comerciales B2B</li>
                        <li>• Ventas mayores a RD$250,000</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-700 mb-2">🚫 Errores comunes:</h4>
                      <ul className="space-y-1 text-green-800">
                        <li>• No validar RNC antes de facturar</li>
                        <li>• Usar RNC de empresas inactivas</li>
                        <li>• Facturar sin RNC en ventas grandes</li>
                        <li>• No actualizar datos de contribuyentes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Settings */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    👥 Gestión de Usuarios
                  </h2>
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 font-semibold text-sm"
                  >
                    ➕ Nuevo Usuario
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map(user => (
                    <div key={user.id} className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-100 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-gray-800">{user.name}</h3>
                          <p className="text-xs text-gray-600">@{user.username}</p>
                          <p className="text-xs text-gray-600">📧 {user.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                          {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                          'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}>
                          {user.role === 'ADMIN' ? '👨‍💼 Administrador' : user.role === 'MANAGER' ? '👔 Gerente' : '💰 Cajero'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        Creado: {new Date(user.createdAt).toLocaleDateString('es-DO')}
                      </p>

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold">
                          ✏️ Editar
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold">
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* New User Modal */}
                {showUserForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-t-xl">
                        <h2 className="text-2xl font-bold">➕ Nuevo Usuario</h2>
                        <p className="text-indigo-100 text-sm mt-1">Completa la información del usuario</p>
                      </div>

                      <form onSubmit={handleCreateUser} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              👤 Nombre Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={userFormData.name}
                              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Juan Pérez"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              🔑 Nombre de Usuario *
                            </label>
                            <input
                              type="text"
                              required
                              value={userFormData.username}
                              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="jperez"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              📧 Email *
                            </label>
                            <input
                              type="email"
                              required
                              value={userFormData.email}
                              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="usuario@ejemplo.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              🔒 Contraseña *
                            </label>
                            <input
                              type="password"
                              required
                              value={userFormData.password}
                              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Mínimo 6 caracteres"
                              minLength={6}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              👔 Rol *
                            </label>
                            <select
                              value={userFormData.role}
                              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            >
                              <option value="CASHIER">💰 Cajero</option>
                              <option value="MANAGER">👔 Gerente</option>
                              <option value="ADMIN">👨‍💼 Administrador</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            type="submit"
                            disabled={loadingUsers}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                          >
                            {loadingUsers ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creando...
                              </span>
                            ) : (
                              '💾 Crear Usuario'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUserForm(false)}
                            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
                          >
                            ✖️ Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  🔧 Configuración del Sistema
                </h2>

                <div className="space-y-6">
                  {/* Language */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      🌐 Idioma
                    </h3>
                    <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                      <option value="es">🇩🇴 Español (República Dominicana)</option>
                      <option value="en">🇺🇸 English</option>
                    </select>
                  </div>

                  {/* Currency */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      💵 Moneda
                    </h3>
                    <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                      <option value="DOP">RD$ - Peso Dominicano</option>
                      <option value="USD">$ - Dólar Estadounidense</option>
                    </select>
                  </div>

                  {/* Tax Rate */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border-2 border-purple-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      📊 Tasa de Impuesto por Defecto
                    </h3>
                    <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200">
                      <option value="0">0% - Exento</option>
                      <option value="0.16">16% - Reducido</option>
                      <option value="0.18">18% - ITBIS General</option>
                    </select>
                  </div>

                  {/* Email Settings */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      📧 Configuración de Correo Electrónico
                    </h3>

                    {/* Provider Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Proveedor de Correo
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                          onClick={() => handleProviderSelect('gmail')}
                          className="p-3 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center gap-1"
                        >
                          <span className="text-2xl">📧</span>
                          <span className="text-xs font-semibold">Gmail</span>
                        </button>
                        <button
                          onClick={() => handleProviderSelect('outlook')}
                          className="p-3 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 flex flex-col items-center gap-1"
                        >
                          <span className="text-2xl">🏢</span>
                          <span className="text-xs font-semibold">Outlook</span>
                        </button>
                        <button
                          onClick={() => handleProviderSelect('office365')}
                          className="p-3 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 flex flex-col items-center gap-1"
                        >
                          <span className="text-2xl">💼</span>
                          <span className="text-xs font-semibold">Office 365</span>
                        </button>
                        <button
                          onClick={() => handleProviderSelect('custom')}
                          className="p-3 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex flex-col items-center gap-1"
                        >
                          <span className="text-2xl">⚙️</span>
                          <span className="text-xs font-semibold">Personalizado</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Servidor SMTP *
                        </label>
                        <input
                          type="text"
                          value={emailConfig.host}
                          onChange={(e) => setEmailConfig({...emailConfig, host: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Puerto *
                        </label>
                        <select
                          value={emailConfig.port}
                          onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        >
                          <option value="587">587 (TLS - Recomendado)</option>
                          <option value="465">465 (SSL)</option>
                          <option value="25">25 (Sin encriptación)</option>
                          <option value="2525">2525 (Alternativo)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Método de Seguridad
                        </label>
                        <select
                          value={emailConfig.tls ? 'tls' : emailConfig.secure ? 'ssl' : 'none'}
                          onChange={(e) => {
                            const value = e.target.value
                            setEmailConfig({
                              ...emailConfig,
                              tls: value === 'tls',
                              secure: value === 'ssl'
                            })
                          }}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        >
                          <option value="tls">TLS (Recomendado)</option>
                          <option value="ssl">SSL</option>
                          <option value="none">Sin encriptación</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Timeout (segundos)
                        </label>
                        <input
                          type="number"
                          value={emailConfig.timeout}
                          onChange={(e) => setEmailConfig({...emailConfig, timeout: e.target.value})}
                          min="5"
                          max="120"
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Correo Electrónico Remitente *
                        </label>
                        <input
                          type="email"
                          value={emailConfig.user}
                          onChange={(e) => setEmailConfig({...emailConfig, user: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="tu-email@empresa.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Nombre del Remitente
                        </label>
                        <input
                          type="text"
                          value={emailConfig.senderName}
                          onChange={(e) => setEmailConfig({...emailConfig, senderName: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Sistema POS - GNTech"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Contraseña / Token de Aplicación *
                        </label>
                        <input
                          type="password"
                          value={emailConfig.password}
                          onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Contraseña o token de aplicación"
                        />
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800 font-semibold mb-2">🔐 Configuraciones Oficiales por Proveedor:</p>
                          <div className="space-y-2">
                            <div className="bg-white p-2 rounded border">
                              <p className="font-semibold text-blue-800 text-xs">📧 Gmail:</p>
                              <p className="text-xs text-blue-700">Servidor: smtp.gmail.com | Puerto: 587 | Seguridad: TLS</p>
                              <p className="text-xs text-blue-700">Requiere: “Contraseña de aplicación” (2FA activado)</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <p className="font-semibold text-blue-800 text-xs">🏢 Office 365:</p>
                              <p className="text-xs text-blue-700">Servidor: smtp.office365.com | Puerto: 587 | Seguridad: TLS</p>
                              <p className="text-xs text-blue-700">Requiere: Contraseña de aplicación o autenticación moderna</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <p className="font-semibold text-blue-800 text-xs">📨 Outlook:</p>
                              <p className="text-xs text-blue-700">Servidor: smtp-mail.outlook.com | Puerto: 587 | Seguridad: TLS</p>
                              <p className="text-xs text-blue-700">Requiere: Contraseña normal o token OAuth</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Configuration */}
                    <div className="mt-6 pt-4 border-t border-purple-200">
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={handleSaveEmailConfig}
                          disabled={savingConfig}
                          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingConfig ? '💾 Guardando...' : '💾 Guardar Configuración'}
                        </button>
                      </div>
                    </div>

                    {/* Test Email */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <h4 className="font-bold text-gray-800 mb-3">🧪 Probar Configuración</h4>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="correo-prueba@ejemplo.com"
                          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                        <button
                          onClick={handleTestEmail}
                          disabled={testingEmail}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingEmail ? '📤 Enviando...' : '📤 Enviar Prueba'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Settings */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-5 border-2 border-orange-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      🧾 Configuración de Recibos
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Imprimir automáticamente después de cada venta
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Mostrar logo de la empresa en recibos
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Incluir NCF en todos los recibos
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enviar recibo por email automáticamente
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert('Configuración del sistema guardada')}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  💾 Guardar Configuración
                </button>
              </div>
            )}


            {/* Users Management */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    👥 Gestión de Usuarios
                  </h2>
                  <button
                    onClick={() => {
                      setEditingUser(null)
                      setUserFormData({ name: '', username: '', email: '', password: '', role: 'CASHIER' })
                      setShowUserForm(true)
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 font-semibold text-sm"
                  >
                    ➕ Nuevo Usuario
                  </button>
                </div>

                {/* Role Permissions Overview - Compact */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔐 Roles y Permisos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(rolePermissions).map(([role, config]) => (
                      <div key={role} className={`rounded-lg p-3 border-2 ${config.color} cursor-pointer hover:shadow-lg transition-all duration-200 group`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{config.icon}</span>
                          <h4 className="font-bold text-xs leading-tight">{config.label}</h4>
                        </div>
                        <div className="text-xs text-gray-700 font-medium">
                          {config.permissions.length} permisos
                        </div>

                        {/* Tooltip with full permissions */}
                        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="font-bold mb-2">{config.label}</div>
                          <ul className="space-y-1">
                            {config.permissions.map((permission, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-green-400 mt-0.5">•</span>
                                <span>{permission}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users List - Compact */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    👥 Usuarios Activos ({users.filter(u => u.isActive).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {users.filter(user => user.isActive).map(user => (
                      <div key={user.id} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 relative group cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-800 truncate">{user.name}</h3>
                            <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${rolePermissions[user.role]?.color || 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                            {rolePermissions[user.role]?.icon}
                          </span>
                        </div>

                        {/* Hover Tooltip with full details */}
                        <div className="absolute z-20 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[250px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 -top-2 left-full ml-2">
                          <div className="font-bold mb-2 text-sm">{user.name}</div>
                          <div className="space-y-1 text-xs">
                            <div><span className="font-semibold">Usuario:</span> @{user.username}</div>
                            <div><span className="font-semibold">Email:</span> {user.email}</div>
                            <div><span className="font-semibold">Rol:</span> {rolePermissions[user.role]?.label || user.role}</div>
                            <div><span className="font-semibold">Estado:</span> Activo</div>
                            <div><span className="font-semibold">Creado:</span> {new Date(user.createdAt).toLocaleDateString('es-DO')}</div>
                            {user.lastLogin && (
                              <div><span className="font-semibold">Último acceso:</span> {new Date(user.lastLogin).toLocaleDateString('es-DO')}</div>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-600">
                            <div className="font-semibold mb-1">Permisos del rol:</div>
                            <ul className="space-y-0.5">
                              {rolePermissions[user.role]?.permissions.slice(0, 4).map((permission, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="text-green-400 mt-0.5">•</span>
                                  <span className="text-xs">{permission}</span>
                                </li>
                              ))}
                              {(rolePermissions[user.role]?.permissions.length || 0) > 4 && (
                                <li className="text-gray-400 text-xs">
                                  +{(rolePermissions[user.role]?.permissions.length || 0) - 4} más...
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="flex-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold"
                            title="Editar usuario"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            className="flex-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold"
                            title="Desactivar usuario"
                          >
                            🚫
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inactive Users */}
                {users.filter(user => !user.isActive).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      🚫 Usuarios Inactivos ({users.filter(u => !u.isActive).length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.filter(user => !user.isActive).map(user => (
                        <div key={user.id} className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4 opacity-75">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-base text-gray-600">{user.name}</h3>
                              <p className="text-xs text-gray-500">@{user.username}</p>
                              <p className="text-xs text-gray-500">📧 {user.email}</p>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                              ✗ Inactivo
                            </span>
                          </div>

                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                              {rolePermissions[user.role]?.icon} {rolePermissions[user.role]?.label || user.role}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
                            >
                              ✅ Reactivar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New/Edit User Modal */}
                {showUserForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-t-xl">
                        <h2 className="text-2xl font-bold">
                          {editingUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                          {editingUser ? 'Modifica la información del usuario' : 'Completa la información del usuario'}
                        </p>
                      </div>

                      <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              👤 Nombre Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={userFormData.name}
                              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="Juan Pérez"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              🔑 Nombre de Usuario *
                            </label>
                            <input
                              type="text"
                              required
                              value={userFormData.username}
                              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="jperez"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              📧 Email *
                            </label>
                            <input
                              type="email"
                              required
                              value={userFormData.email}
                              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                              placeholder="usuario@ejemplo.com"
                            />
                          </div>

                          {!editingUser && (
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                🔒 Contraseña *
                              </label>
                              <input
                                type="password"
                                required={!editingUser}
                                value={userFormData.password}
                                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                              />
                            </div>
                          )}

                          <div className={editingUser ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              👔 Rol *
                            </label>
                            <select
                              value={userFormData.role}
                              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            >
                              <option value="CASHIER">💰 Cajero</option>
                              <option value="MANAGER">👔 Gerente</option>
                              <option value="ACCOUNTANT">🧮 Contador</option>
                              <option value="ADMIN">👑 Administrador</option>
                            </select>
                          </div>
                        </div>

                        {/* Role Permissions Preview */}
                        {userFormData.role && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              {rolePermissions[userFormData.role]?.icon} Permisos del Rol Seleccionado
                            </h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {rolePermissions[userFormData.role]?.permissions.map((permission, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="text-green-600">✓</span>
                                  {permission}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          <button
                            type="submit"
                            disabled={loadingUsers}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                          >
                            {loadingUsers ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {editingUser ? 'Actualizando...' : 'Creando...'}
                              </span>
                            ) : (
                              `${editingUser ? '💾 Actualizar Usuario' : '💾 Crear Usuario'}`
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserForm(false)
                              setEditingUser(null)
                              setUserFormData({ name: '', username: '', email: '', password: '', role: 'CASHIER' })
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
              </div>
            )}
          </div>
        </div>
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

