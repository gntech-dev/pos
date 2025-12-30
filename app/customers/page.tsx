'use client'

import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { formatCedula, formatPhone, formatRNC, getInitials } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  rnc?: string
  cedula?: string
  address?: string
  isCompany?: boolean
  createdAt: string
}

export default function CustomersPage() {
   const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submittingForm, setSubmittingForm] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [pageSize] = useState(25)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rnc: '',
    cedula: '',
    address: ''
  })

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })

      if (debouncedSearchQuery.trim()) {
        params.set('q', debouncedSearchQuery.trim())
      }

      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data)
        setTotalCustomers(data.total)
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }, [currentPage, debouncedSearchQuery, pageSize])

  useEffect(() => {
    loadCustomers()
  }, [currentPage, debouncedSearchQuery, loadCustomers])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when search changes
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const checkForDuplicates = useCallback(async (data: typeof formData) => {
    if (!data.name.trim()) {
      setPotentialDuplicates([])
      return
    }

    setCheckingDuplicates(true)
    try {
      const payload = {
        name: data.name,
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.rnc && { rnc: data.rnc }),
        ...(data.cedula && { cedula: data.cedula }),
        ...(editingCustomer && { excludeId: editingCustomer.id })
      }

      const response = await fetch('/api/customers/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setPotentialDuplicates(result.duplicates)
      } else {
        console.error('Error checking for duplicates')
        setPotentialDuplicates([])
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error)
      setPotentialDuplicates([])
    } finally {
      setCheckingDuplicates(false)
    }
  }, [editingCustomer])

  // Debounce duplicate checking
  useEffect(() => {
    if (!showForm) return

    const timer = setTimeout(() => {
      checkForDuplicates(formData)
    }, 500) // Slightly longer delay for duplicate checking

    return () => clearTimeout(timer)
  }, [formData, showForm, checkForDuplicates])

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      rnc: customer.rnc || '',
      cedula: customer.cedula || '',
      address: customer.address || ''
    })
    setShowForm(true)
  }

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al cliente "${customerName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeletingCustomer(customerId)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadCustomers()
        alert('Cliente eliminado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      alert('Ocurrió un error al eliminar el cliente')
    } finally {
      setDeletingCustomer(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingForm(true)

    try {
      // Trim values and filter out empty optional fields
      const trimmedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value.trim()])
      )
      
      let payload: Record<string, string>
      
      if (editingCustomer) {
        // For updates, send all fields (including empty ones to allow clearing)
        payload = trimmedData
      } else {
        // For creates, only send non-empty optional fields
        payload = Object.fromEntries(
          Object.entries(trimmedData).filter(([key, value]) => key === 'name' || value !== '')
        )
      }

      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadCustomers()
        setShowForm(false)
        setEditingCustomer(null)
        setPotentialDuplicates([])
        setFormData({ name: '', email: '', phone: '', rnc: '', cedula: '', address: '' })
        alert(editingCustomer ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error guardando cliente:', error)
      alert('Ocurrió un error al guardar el cliente')
    } finally {
      setSubmittingForm(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
              👥 Gestión de Clientes
            </h1>
            <p className="text-gray-600 text-xs mt-1">Administra tu cartera de clientes</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
          >
            ➕ Nuevo Cliente
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email, teléfono, RNC o cédula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm"
          />
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center justify-between">
              <span>📋 Lista de Clientes</span>
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                {totalCustomers} clientes
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loadingCustomers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded mb-1 w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="h-6 bg-gray-300 rounded"></div>
                      <div className="h-6 bg-gray-300 rounded w-4/5"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : customers.length === 0 && totalCustomers === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">👥 No hay clientes</p>
                <p className="text-gray-400 text-sm mt-2">Agrega tu primer cliente para comenzar</p>
              </div>
            ) : customers.length === 0 && debouncedSearchQuery ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">🔍 No se encontraron clientes</p>
                <p className="text-gray-400 text-sm mt-2">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customers.map(customer => (
                  <div key={customer.id} className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100 rounded-lg p-4 hover:shadow-lg hover:border-orange-300 transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Customer Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {getInitials(customer.name)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-gray-800 mb-1 truncate">{customer.name}</h3>
                        {customer.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                            📧 <span className="truncate">{customer.email}</span>
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            📱 {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {customer.rnc && (
                        <div className="bg-blue-50 px-2 py-1 rounded text-xs">
                          <span className="font-semibold text-blue-700">RNC:</span>
                          <span className="text-blue-600 ml-1 font-mono">{customer.rnc}</span>
                        </div>
                      )}
                      {customer.cedula && (
                        <div className="bg-green-50 px-2 py-1 rounded text-xs">
                          <span className="font-semibold text-green-700">Cédula:</span>
                          <span className="text-green-600 ml-1 font-mono">{customer.cedula}</span>
                        </div>
                      )}
                    </div>

                    {customer.address && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        📍 {customer.address}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        disabled={deletingCustomer === customer.id}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                      >
                        {deletingCustomer === customer.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Eliminando...
                          </span>
                        ) : (
                          '🗑️ Eliminar'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalCustomers > pageSize && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCustomers)} - {Math.min(currentPage * pageSize, totalCustomers)} de {totalCustomers} clientes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loadingCustomers}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    ← Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(totalCustomers / pageSize) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(totalCustomers / pageSize)
                        if (totalPages <= 7) return true
                        if (page === 1 || page === totalPages) return true
                        if (Math.abs(page - currentPage) <= 1) return true
                        return false
                      })
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            disabled={loadingCustomers}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCustomers / pageSize)))}
                    disabled={currentPage === Math.ceil(totalCustomers / pageSize) || loadingCustomers}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-t-xl">
              <h2 className="text-2xl font-bold">{editingCustomer ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h2>
              <p className="text-orange-100 text-sm mt-1">
                {editingCustomer ? 'Actualiza la información del cliente' : 'Completa la información del cliente'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    👤 Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="Nombre del cliente"
                  />
                </div>

                {/* Duplicate Warning */}
                {potentialDuplicates.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-yellow-600 text-xl">⚠️</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-yellow-800 mb-2">
                            Posibles Clientes Duplicados Encontrados
                          </h3>
                          <p className="text-yellow-700 text-sm mb-3">
                            Se encontraron {potentialDuplicates.length} cliente(s) similar(es). Revisa si ya existe este cliente:
                          </p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {potentialDuplicates.map((duplicate) => (
                              <div key={duplicate.id} className="bg-white rounded border p-2 text-sm">
                                <div className="font-semibold text-gray-800">{duplicate.name}</div>
                                <div className="text-gray-600 text-xs space-y-1">
                                  {duplicate.email && <div>📧 {duplicate.email}</div>}
                                  {duplicate.phone && <div>📱 {duplicate.phone}</div>}
                                  {duplicate.rnc && <div>🏢 RNC: {duplicate.rnc}</div>}
                                  {duplicate.cedula && <div>🪪 Cédula: {duplicate.cedula}</div>}
                                  <div className="text-gray-500">
                                    Coincidencia: {Math.round(duplicate.confidence * 100)}% 
                                    ({duplicate.matchType === 'exact' ? 'Coincidencia exacta' : 'Similitud de nombre'})
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-yellow-700 text-xs mt-2">
                            Si este no es el mismo cliente, puedes continuar. De lo contrario, considera editar el cliente existente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checking duplicates indicator */}
                {checkingDuplicates && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Verificando posibles duplicados...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📱 Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="809-555-5555"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🏢 RNC (Empresas)
                  </label>
                  <input
                    type="text"
                    value={formData.rnc}
                    onChange={(e) => setFormData({ ...formData, rnc: formatRNC(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="000-00000-0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🪪 Cédula (Personas)
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: formatCedula(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="000-0000000-0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📍 Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                    placeholder="Dirección completa del cliente"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {submittingForm ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingCustomer ? 'Actualizando...' : 'Guardando...'}
                    </span>
                  ) : (
                    editingCustomer ? '💾 Actualizar Cliente' : '💾 Guardar Cliente'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCustomer(null)
                    setPotentialDuplicates([])
                    setFormData({ name: '', email: '', phone: '', rnc: '', cedula: '', address: '' })
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
          background: linear-gradient(to bottom, #f97316, #dc2626);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ea580c, #b91c1c);
        }
      `}</style>
    </div>
  )
}
