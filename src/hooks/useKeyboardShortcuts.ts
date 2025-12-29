import React, { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in input fields, unless it's a modifier key combination
    const isInputFocused = event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'

    // Allow shortcuts with modifier keys (Alt, Ctrl, Shift) even when inputs are focused
    const hasModifier = event.altKey || event.ctrlKey || event.shiftKey

    if (isInputFocused && !hasModifier) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const altMatches = !!shortcut.altKey === event.altKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Predefined shortcuts for POS system
export const POS_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'F1',
    altKey: true,
    action: () => {
      // Focus search input
      const searchInput = document.querySelector('input[placeholder*="buscar"], input[placeholder*="Buscar"]') as HTMLInputElement
      searchInput?.focus()
    },
    description: 'Buscar productos (Alt+F1)'
  },
  {
    key: 'F2',
    altKey: true,
    action: () => {
      // Add customer - this will be overridden in the component
    },
    description: 'Buscar cliente (Alt+F2)'
  },
  {
    key: 'F3',
    altKey: true,
    action: () => {
      // Quick sale - this will be overridden in the component
    },
    description: 'Procesar venta (Alt+F3)'
  },
  {
    key: 'C',
    altKey: true,
    action: () => {
      // Clear cart - this will be overridden in the component
    },
    description: 'Limpiar carrito (Alt+C)'
  },
  {
    key: 'H',
    altKey: true,
    action: () => {
      // Show help - this will be overridden in the component
    },
    description: 'Ayuda de atajos (Alt+H)'
  },
  {
    key: 'P',
    altKey: true,
    action: () => {
      // Park sale - this will be overridden in the component
    },
    description: 'Pausar venta (Alt+P)'
  },
  {
    key: 'F11',
    action: () => {
      // Toggle fullscreen - this will be overridden in the component
    },
    description: 'Pantalla completa (F11)'
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: () => {
      // Complete sale - this will be overridden in the component
    },
    description: 'Completar venta (Ctrl+Enter)'
  }
]

// Hook for displaying available shortcuts
export function useShortcutHelp() {
  const [showHelp, setShowHelp] = React.useState(false)

  useKeyboardShortcuts([
    {
      key: 'F12',
      action: () => setShowHelp(prev => !prev),
      description: 'Mostrar/ocultar ayuda de atajos'
    }
  ])

  return { showHelp, setShowHelp }
}