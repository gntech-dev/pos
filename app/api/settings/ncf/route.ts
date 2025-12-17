import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { prisma } from '@/lib/prisma'

type NCFType = 'B01' | 'B02' | 'B14' | 'B15'

export async function GET() {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const sequences = await prisma.nCFSequence.findMany({
      orderBy: { type: 'asc' }
    })

    // Transform to the format expected by the frontend
    const ncfData = {
      b01Start: '00000001',
      b01End: '00001000',
      b01Current: '00000001',
      b01ExpiryDate: '',
      b02Start: '00000001',
      b02End: '00001000',
      b02Current: '00000001',
      b02ExpiryDate: '',
      b14Start: '00000001',
      b14End: '00001000',
      b14Current: '00000001',
      b14ExpiryDate: '',
      b15Start: '00000001',
      b15End: '00001000',
      b15Current: '00000001',
      b15ExpiryDate: ''
    }

    // Update with real data from database
    sequences.forEach(seq => {
      const type = seq.type.toLowerCase()
      ncfData[`${type}Start` as keyof typeof ncfData] = seq.startNumber.toString().padStart(8, '0')
      ncfData[`${type}End` as keyof typeof ncfData] = seq.endNumber.toString().padStart(8, '0')
      ncfData[`${type}Current` as keyof typeof ncfData] = seq.currentNumber.toString().padStart(8, '0')
      ncfData[`${type}ExpiryDate` as keyof typeof ncfData] = seq.expiryDate.toISOString().split('T')[0]
    })

    return NextResponse.json(ncfData)
  } catch (error) {
    console.error('Error loading NCF sequences:', error)
    return new NextResponse(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Only admins can modify NCF sequences
  if (session.role !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 })
  }

  try {
    const data = await request.json()

    // Update each NCF sequence
    const types = ['b01', 'b02', 'b14', 'b15']
    for (const type of types) {
      const startKey = `${type}Start`
      const endKey = `${type}End`
      const expiryKey = `${type}ExpiryDate`

      if (data[startKey] && data[endKey]) {
        const startNumber = parseInt(data[startKey])
        const endNumber = parseInt(data[endKey])

        if (startNumber >= endNumber) {
          return new NextResponse(
            JSON.stringify({ error: `Rango inválido para ${type.toUpperCase()}: inicio debe ser menor al final` }),
            { status: 400 }
          )
        }

        // Calculate expiry date
        let expiryDate: Date
        if (data[expiryKey]) {
          // Use provided expiry date
          expiryDate = new Date(data[expiryKey])
          if (isNaN(expiryDate.getTime())) {
            return new NextResponse(
              JSON.stringify({ error: `Fecha de expiración inválida para ${type.toUpperCase()}` }),
              { status: 400 }
            )
          }
        } else {
          // Default: 1 year from now if no date provided
          expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }

        await prisma.nCFSequence.upsert({
          where: { type: type.toUpperCase() },
          update: {
            startNumber,
            endNumber,
            currentNumber: Math.max(startNumber, parseInt(data[`${type}Current`] || startNumber.toString())),
            isActive: true,
            expiryDate
          },
          create: {
            type: type.toUpperCase() as NCFType,
            prefix: type.toUpperCase(),
            startNumber,
            endNumber,
            currentNumber: startNumber,
            isActive: true,
            expiryDate
          }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Configuración NCF guardada exitosamente' })
  } catch (error) {
    console.error('Error saving NCF sequences:', error)
    return new NextResponse(JSON.stringify({ error: 'Error al guardar la configuración NCF' }), { status: 500 })
  }
}