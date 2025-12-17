'use client'

import React, { useState, useEffect } from 'react'

interface Backup {
  id: string
  name: string
  type: 'full' | 'partial' | 'uploaded'
  size: number
  encrypted: boolean
  compressed: boolean
  checksum: string
  createdAt: string
  status: 'completed' | 'failed' | 'running'
  components: number
  uploaded?: boolean
  originalFileName?: string
}

interface BackupSummary {
  total: number
  completed: number
  failed: number
  running: number
  totalSize: number
  oldest: string
  newest: string
}

interface Restore {
  id: string
  backupId: string
  backupName: string
  status: 'restoring' | 'completed' | 'failed' | 'rolling_back'
  validated: boolean
  components: string[]
  startedAt: string
  completedAt?: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [restores, setRestores] = useState<Restore[]>([])
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [backupName, setBackupName] = useState('')
  const [backupType, setBackupType] = useState<'full' | 'partial'>('full')
  const [selectedComponents, setSelectedComponents] = useState<string[]>(['database'])
  const [encrypt, setEncrypt] = useState(true)
  const [compress, setCompress] = useState(true)
  const [retentionDays, setRetentionDays] = useState(30)

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validComponents = [
    { id: 'database', name: 'Base de Datos', description: 'Backup completo de la base de datos' },
    { id: 'config', name: 'Configuración', description: 'Archivos de configuración del sistema' },
    { id: 'cache', name: 'Caché', description: 'Datos de caché y archivos temporales' },
    { id: 'files', name: 'Archivos', description: 'Archivos de usuario y documentos' }
  ]

  useEffect(() => {
    fetchBackups()
    fetchRestores()
  }, [])

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup/list')
      const data = await response.json()
      if (data.success) {
        setBackups(data.backups)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRestores = async () => {
    try {
      const response = await fetch('/api/restore/list')
      const data = await response.json()
      if (data.success) {
        setRestores(data.restores)
      }
    } catch (error) {
      console.error('Error fetching restores:', error)
    }
  }

  const createBackup = async () => {
    if (!backupName.trim()) {
      alert('Por favor ingresa un nombre para el backup')
      return
    }

    if (backupType === 'partial' && selectedComponents.length === 0) {
      alert('Por favor selecciona al menos un componente para el backup parcial')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: backupName,
          type: backupType,
          components: backupType === 'partial' ? selectedComponents : undefined,
          encrypt,
          compress,
          retentionDays
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Backup creado exitosamente')
        setBackupName('')
        fetchBackups()
      } else {
        const errorMsg = data.message || data.error || 'Error desconocido'
        alert(`❌ Error al crear backup: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('❌ Error de conexión al crear backup. Verifica que estés conectado e intenta nuevamente.')
    } finally {
      setCreating(false)
    }
  }

  const uploadBackup = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo de backup')
      return
    }

    // Validate file type
    if (!selectedFile.name.endsWith('.backup')) {
      alert('❌ Solo se permiten archivos .backup')
      return
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (selectedFile.size > maxSize) {
      alert('❌ El archivo es demasiado grande. Tamaño máximo: 500MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('backup', selectedFile)

      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Backup subido exitosamente')
        setSelectedFile(null)
        setUploadProgress(0)
        fetchBackups()
      } else {
        const errorMsg = data.message || data.error || 'Error desconocido'
        alert(`❌ Error al subir backup: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error uploading backup:', error)
      alert('❌ Error de conexión al subir backup. Verifica que estés conectado.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.backup')) {
        alert('❌ Solo se permiten archivos .backup')
        event.target.value = ''
        return
      }

      // Validate file size
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (file.size > maxSize) {
        alert('❌ El archivo es demasiado grande. Tamaño máximo: 500MB')
        event.target.value = ''
        return
      }

      setSelectedFile(file)
    }
  }

  const downloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${backupName}.backup`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('✅ Backup descargado exitosamente')
      } else {
        const data = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`❌ Error al descargar backup: ${data.error || 'Error del servidor'}`)
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      alert('❌ Error de conexión al descargar backup. Verifica que estés conectado.')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este backup?\n\nEsta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Backup eliminado exitosamente')
        fetchBackups()
      } else {
        const errorMsg = data.message || data.error || 'Error desconocido'
        alert(`❌ Error al eliminar backup: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      alert('❌ Error de conexión al eliminar backup. Verifica que estés conectado.')
    }
  }

  const restoreBackup = async (backupId: string) => {
    if (!confirm('⚠️ ¿Estás seguro de que deseas restaurar este backup?\n\nEsta acción NO se puede deshacer y sobrescribirá los datos actuales.')) {
      return
    }

    setRestoring(true)
    try {
      const response = await fetch('/api/restore/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId,
          overwrite: false,
          validateOnly: false
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ Proceso de restauración iniciado correctamente')
        fetchRestores()
      } else {
        const errorMsg = data.message || data.error || 'Error desconocido'
        alert(`❌ Error al iniciar restauración: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error starting restore:', error)
      alert('❌ Error de conexión al iniciar restauración. Verifica que estés conectado.')
    } finally {
      setRestoring(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando módulo de backup...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗂️ Módulo de Backup y Restauración</h1>
          <p className="text-gray-600">
            Gestiona los backups de tu sistema y restaura datos cuando sea necesario
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Backups</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fallidos</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.failed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">💽</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFileSize(summary.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Backup Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📤 Subir Backup Existente</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Archivo de Backup
              </label>
              <input
                type="file"
                accept=".backup"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Solo archivos .backup (máximo 500MB)
              </p>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      Tamaño: {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={uploadBackup}
                disabled={uploading || !selectedFile}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {uploading ? 'Subiendo Backup...' : '📤 Subir Backup'}
              </button>
            </div>
          </div>
        </div>

        {/* Create Backup Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Crear Nuevo Backup</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Backup
                </label>
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Mi Backup Personalizado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Backup
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="full"
                      checked={backupType === 'full'}
                      onChange={(e) => setBackupType(e.target.value as 'full')}
                      className="mr-2"
                    />
                    <span className="font-medium">Completo</span>
                    <span className="text-sm text-gray-500 ml-2">
                      - Incluye todos los componentes
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="partial"
                      checked={backupType === 'partial'}
                      onChange={(e) => setBackupType(e.target.value as 'partial')}
                      className="mr-2"
                    />
                    <span className="font-medium">Parcial</span>
                    <span className="text-sm text-gray-500 ml-2">
                      - Selecciona componentes específicos
                    </span>
                  </label>
                </div>
              </div>

              {backupType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Componentes a Incluir
                  </label>
                  <div className="space-y-2">
                    {validComponents.map((component) => (
                      <label key={component.id} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(component.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedComponents([...selectedComponents, component.id])
                            } else {
                              setSelectedComponents(selectedComponents.filter(c => c !== component.id))
                            }
                          }}
                          className="mt-1 mr-2"
                        />
                        <div>
                          <span className="font-medium">{component.name}</span>
                          <div className="text-sm text-gray-500">{component.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Backup Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período de Retención (días)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={encrypt}
                    onChange={(e) => setEncrypt(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="font-medium">🔒 Encriptar Backup</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Recomendado - AES-256)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={compress}
                    onChange={(e) => setCompress(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="font-medium">🗜️ Comprimir Backup</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Reduce el tamaño del archivo)
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  onClick={createBackup}
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {creating ? 'Creando Backup...' : '🚀 Crear Backup'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backups List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Backups Existentes</h2>
          
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📂</span>
              <p>No hay backups disponibles</p>
              <p className="text-sm">Crea tu primer backup usando el formulario anterior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tamaño</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{backup.name}</div>
                          <div className="text-sm text-gray-500">
                            {backup.encrypted && '🔒 '} 
                            {backup.compressed && '🗜️ '}
                            {backup.uploaded && '📤 '}
                            {backup.originalFileName && `(${backup.originalFileName}) `}
                            {backup.components} componente{backup.components !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.type === 'full' 
                            ? 'bg-blue-100 text-blue-800' 
                            : backup.type === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {backup.type === 'full' ? 'Completo' : 
                           backup.type === 'partial' ? 'Parcial' : 'Subido'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : backup.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {backup.status === 'completed' && '✅'}
                          {backup.status === 'running' && '⏳'}
                          {backup.status === 'failed' && '❌'}
                          {' '}
                          {backup.status === 'completed' ? 'Completado' : 
                           backup.status === 'running' ? 'En proceso' : 'Fallido'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadBackup(backup.id, backup.name)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                          >
                            📥 Descargar
                          </button>
                          <button
                            onClick={() => restoreBackup(backup.id)}
                            disabled={restoring}
                            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded"
                          >
                            🔄 Restaurar
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Restore History */}
        {restores.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔄 Historial de Restauraciones</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Backup</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Validado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Componentes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {restores.map((restore) => (
                    <tr key={restore.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {restore.backupName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          restore.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : restore.status === 'restoring'
                            ? 'bg-blue-100 text-blue-800'
                            : restore.status === 'rolling_back'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restore.status === 'completed' && '✅'}
                          {restore.status === 'restoring' && '⏳'}
                          {restore.status === 'rolling_back' && '🔄'}
                          {restore.status === 'failed' && '❌'}
                          {' '}
                          {restore.status === 'completed' ? 'Completado' : 
                           restore.status === 'restoring' ? 'Restaurando' :
                           restore.status === 'rolling_back' ? 'Revirtiendo' : 'Fallido'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {restore.validated ? '✅ Sí' : '❌ No'}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {restore.components.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatDate(restore.startedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}