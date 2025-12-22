import { useState } from 'react'
import Image from 'next/image'

interface LogoSelectorProps {
  onLogoSelect: (logoPath: string) => void
  currentLogo?: string
}

const availableLogos = [
  {
    id: 'pos-blue',
    name: 'POS Azul',
    path: '/logos/pos-blue.svg',
    description: 'Logo moderno con tema azul'
  },
  {
    id: 'gntech-green',
    name: 'GNTech Verde',
    path: '/logos/gntech-green.svg',
    description: 'Logo con carrito de compras'
  },
  {
    id: 'receipt-orange',
    name: 'Recibo Naranja',
    path: '/logos/receipt-orange.svg',
    description: 'Logo con diseño de recibo'
  },
  {
    id: 'gntech-modern',
    name: 'GNTech Moderno',
    path: '/logos/gntech-modern.svg',
    description: 'Logo moderno con gradientes'
  },
  {
    id: 'pos-letters',
    name: 'POS Letters',
    path: '/logos/pos-letters.svg',
    description: 'Logo limpio con letras POS'
  }
]

export default function LogoSelector({ onLogoSelect, currentLogo }: LogoSelectorProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null)

  const handleLogoClick = (logoPath: string) => {
    setSelectedLogo(logoPath)
    onLogoSelect(logoPath)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Selecciona uno de los logos pre-generados o sube tu propio logo personalizado.
      </div>

      {currentLogo && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Logo Actual:</h4>
          <Image
            src={currentLogo}
            alt="Logo actual"
            width={64}
            height={64}
            className="w-16 h-16 object-contain border border-gray-200 rounded"
            unoptimized
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {availableLogos.map((logo) => (
          <div
            key={logo.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedLogo === logo.path
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleLogoClick(logo.path)}
          >
            <div className="flex justify-center mb-2">
              <Image
                src={logo.path}
                alt={logo.name}
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
                unoptimized
              />
            </div>
            <h3 className="text-sm font-medium text-center text-gray-800">
              {logo.name}
            </h3>
            <p className="text-xs text-center text-gray-500 mt-1">
              {logo.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          💡 Consejos para logos:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Los logos SVG son escalables y se ven perfectos en cualquier tamaño</li>
          <li>• Para mejores resultados, usa logos con fondo transparente</li>
          <li>• Tamaños recomendados: 200x200px o más para alta calidad</li>
          <li>• Puedes subir tu propio logo personalizado usando el campo de arriba</li>
        </ul>
      </div>
    </div>
  )
}