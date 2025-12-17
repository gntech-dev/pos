"use client"
import React from 'react'

export default function Card({ title, value, subtitle, color }: { title: string; value: React.ReactNode; subtitle?: string; color?: string }) {
  const colorClass = color ?? 'text-blue-600'
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-sm text-gray-400 mt-2">{subtitle}</div>}
    </div>
  )
}
