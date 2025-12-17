"use client"

import React from 'react'
import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-72 hidden lg:block bg-gradient-to-b from-white to-indigo-50 border-r-2 border-indigo-100 min-h-screen p-6 shadow-lg">
      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="text-lg">🧭</span>
        Navegación
      </div>
      <nav className="flex flex-col gap-3">
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/dashboard"
        >
          <span className="text-xl">📊</span>
          Panel Principal
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/pos"
        >
          <span className="text-xl">💰</span>
          Punto de Venta
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/sales"
        >
          <span className="text-xl">📊</span>
          Historial de Ventas
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/quotations"
        >
          <span className="text-xl">📋</span>
          Cotizaciones
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/refunds"
        >
          <span className="text-xl">🔄</span>
          Devoluciones
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/products"
        >
          <span className="text-xl">📦</span>
          Productos
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/inventory"
        >
          <span className="text-xl">📊</span>
          Inventario
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/customers"
        >
          <span className="text-xl">👥</span>
          Clientes
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/reports"
        >
          <span className="text-xl">📈</span>
          Reportes
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/ncf-monitor"
        >
          <span className="text-xl">🔍</span>
          Monitor NCF
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105"
          href="/backup"
        >
          <span className="text-xl">🗂️</span>
          Backup & Restauración
        </Link>
        <Link
          className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 text-gray-700 hover:text-white transition-all duration-200 font-semibold flex items-center gap-3 shadow-sm hover:shadow-lg transform hover:scale-105 relative"
          href="/settings"
        >
          <span className="text-xl">⚙️</span>
          <span className="flex-1">Configuración</span>
          {/* Sync indicator - this would need to be passed as props or from context */}
          {/* For now, users can see sync status in settings */}
        </Link>
      </nav>
    </aside>
  )
}
