'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [tempCredentials, setTempCredentials] = useState<{ username: string; password: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const username = requires2FA && tempCredentials ? tempCredentials.username : formData.get('username') as string
    const password = requires2FA && tempCredentials ? tempCredentials.password : formData.get('password') as string
    const twoFactorToken = formData.get('twoFactorToken') as string
    const backupCode = formData.get('backupCode') as string

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          twoFactorToken: requires2FA ? twoFactorToken : undefined,
          backupCode: requires2FA ? backupCode : undefined
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.log('Login response error:', data)

        // Check if 2FA is required
        if (data.requires2FA) {
          console.log('Setting requires2FA to true')
          setRequires2FA(true)
          setTempCredentials({ username, password })
          setError('')
          setLoading(false)
          return
        }

        setError(data.error || 'Credenciales inválidas')
        return
      }

      const data = await response.json()
      console.log('Login successful:', data)

      // Reset 2FA state on successful login
      setRequires2FA(false)
      setTempCredentials(null)

      // Force a small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Navigate and force page reload
      try {
        await router.push('/dashboard')
        // Force a page reload to ensure middleware picks up the session
        window.location.href = '/dashboard'
      } catch (error) {
        console.error('Navigation error:', error)
        setError('Error al navegar. Intente nuevamente.')
      }
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
            {!requires2FA ? (
              <>
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
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-2xl mb-2">🔐</div>
                  <h3 className="text-lg font-semibold text-gray-800">Verificación de Dos Factores</h3>
                  <p className="text-sm text-gray-600">Ingresa el código de tu app autenticadora</p>
                </div>

                <div>
                  <label htmlFor="twoFactorToken" className="block text-xs font-bold text-gray-700 mb-1">
                    📱 Código de 6 dígitos
                  </label>
                  <input
                    id="twoFactorToken"
                    name="twoFactorToken"
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm text-center text-lg font-mono"
                    placeholder="000000"
                  />
                </div>

                <div className="text-center">
                  <span className="text-xs text-gray-500">¿No tienes acceso a tu app?</span>
                  <details className="mt-2">
                    <summary className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      Usar código de respaldo
                    </summary>
                    <div className="mt-2">
                      <input
                        id="backupCode"
                        name="backupCode"
                        type="text"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm font-mono"
                        placeholder="Ingresa código de respaldo"
                      />
                    </div>
                  </details>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false)
                    setTempCredentials(null)
                    setError('')
                  }}
                  className="w-full text-indigo-600 hover:text-indigo-800 text-sm font-semibold py-2"
                >
                  ← Volver al login
                </button>
              </>
            )}

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
