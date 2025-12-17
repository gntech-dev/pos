"use client"
import React from 'react'

export default function Button({ children, onClick, variant = 'solid' }: { children: React.ReactNode; onClick?: () => void; variant?: 'solid' | 'ghost' }) {
  const className = variant === 'solid' ? 'bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors' : 'px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'
  return (
    <button onClick={onClick} className={className}>{children}</button>
  )
}
