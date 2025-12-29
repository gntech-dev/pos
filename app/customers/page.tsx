'use client'

import { useState, useEffect } from 'react'
import { formatCedula, formatPhone, formatRNC } from '@/lib/utils'

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
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rnc: '',
    cedula: '',
    address: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Trim values and filter out empty optional fields
      const trimmedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value.trim()])
      )
      const payload = Object.fromEntries(
        Object.entries(trimmedData).filter(([key, value]) => key === 'name' || value !== '')
      )

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
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.rnc?.includes(searchQuery) ||
    customer.cedula?.includes(searchQuery)
  )

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
                {filteredCustomers.length} clientes
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">👥 No hay clientes</p>
                <p className="text-gray-400 text-sm mt-2">Agrega tu primer cliente para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCustomers.map(customer => (
                  <div key={customer.id} className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-100 rounded-lg p-4 hover:shadow-lg hover:border-orange-300 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-800 mb-1">{customer.name}</h3>
                        {customer.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            📧 {customer.email}
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
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
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
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {loading ? (
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
