"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Header({ name, businessSettings }: { name?: string, businessSettings?: { name: string, logo?: string | null } | null }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-gradient-to-r from-white to-indigo-50 border-b-2 border-indigo-100 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          {businessSettings?.logo ? (
            <Image
              src={businessSettings.logo}
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              unoptimized
            />
          ) : (
            <span>🏪</span>
          )}
          {businessSettings?.name || 'GNTech POS'}
        </div>
        <div className="hidden sm:block relative">
          <input
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 w-64"
            placeholder="🔍 Buscar productos, facturas..."
          />
          <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold text-gray-700 hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200">
          <span className="text-lg">👤</span>
          {name ?? 'Invitado'}
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </header>
  )
}
