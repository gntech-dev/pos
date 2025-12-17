'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Credenciales inválidas')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error. Por favor intente nuevamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-3 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header Card - Compacto */}
        <div className="bg-white rounded-xl shadow-xl p-5 mb-4 text-center">
          <div className="text-5xl mb-2">🏪</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sistema POS
          </h1>
          <p className="text-gray-500 text-xs mt-1">República Dominicana 🇩🇴</p>
        </div>

        {/* Login Form Card - Compacto */}
        <div className="bg-white rounded-xl shadow-xl p-5 backdrop-blur-lg">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">Iniciar Sesión</h2>
            <p className="text-gray-500 text-xs mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-gray-700 mb-1">
                👤 Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1">
                🔒 Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-700 p-2 rounded-lg text-xs font-semibold flex items-center gap-2">
                <span className="text-base">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold text-base hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                '🚀 Iniciar Sesión'
              )}
            </button>

          </form>
        </div>

        {/* Footer - Compacto */}
        <div className="text-center mt-3 text-white text-xs">
          <p className="font-semibold">Powered by GNTech 🚀</p>
        </div>
      </div>
    </div>
  )
}
