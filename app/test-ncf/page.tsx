'use client'

import { useState, useEffect } from 'react'
import ThermalReceipt from '@/components/ThermalReceipt'
import A4Invoice from '@/components/A4Invoice'

interface TestSale {
  id: string
  saleNumber: string
  ncf: string
  ncfType: string
  subtotal: number
  tax: number
  discount: number
  total: number
  createdAt: Date
  customer: {
    id: string
    name: string
    rnc?: string | null
    cedula?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
  }
  items: Array<{
    product: {
      id: string
      name: string
      sku: string
      price: number
      taxRate: number
      stock?: number
      minStock?: number
      trackInventory?: boolean
      barcode?: string | null
    }
    quantity: number
    unitPrice: number
    discount: number
  }>
  paymentMethod: string
}

interface NCFInfo {
  expiryDate: Date | null
  daysUntilExpiry: number | null
  isExpired: boolean
}

export default function TestNCF() {
  const [testSale, setTestSale] = useState<TestSale | null>(null)
  const [ncfInfo, setNcfInfo] = useState<NCFInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTestData = async () => {
      // Create a test sale with NCF
      const testSaleData: TestSale = {
        id: 'test-sale-id',
        saleNumber: 'TEST-001',
        ncf: 'B0200000001',
        ncfType: 'B02',
        subtotal: 1000,
        tax: 180,
        discount: 0,
        total: 1180,
        createdAt: new Date(),
        customer: {
          id: 'test-customer-id',
          name: 'Test Customer',
          rnc: '123456789'
        },
        items: [
          {
            product: {
              id: 'test-product-id',
              name: 'Test Product',
              sku: 'TEST-001',
              price: 1000,
              taxRate: 0.18
            },
            quantity: 1,
            unitPrice: 1000,
            discount: 0
          }
        ],
        paymentMethod: 'CASH'
      }

      setTestSale(testSaleData)

      try {
        // Test NCF expiration info via API
        const response = await fetch('/api/ncf/expiration/B0200000001')
        const data = await response.json()
        setNcfInfo(data)
      } catch (error) {
        console.error('Error fetching NCF info:', error)
        setNcfInfo({
          expiryDate: null,
          daysUntilExpiry: null,
          isExpired: false
        })
      } finally {
        setLoading(false)
      }
    }

    loadTestData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading test data...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-8">NCF Expiration Test Page</h1>
      
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">NCF Info Debug</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(ncfInfo, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Thermal Receipt</h2>
          {testSale && <ThermalReceipt sale={testSale} />}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">A4 Invoice</h2>
          {testSale && <A4Invoice sale={testSale} />}
        </div>
      </div>
    </div>
  )
}