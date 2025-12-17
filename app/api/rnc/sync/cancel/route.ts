import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Reset sync status to allow new sync
    await prisma.syncStatus.upsert({
      where: { type: 'RNC' },
      update: {
        status: 'COMPLETED', // Set to COMPLETED so polling stops
        progress: 0,
        message: 'Sincronización cancelada por el usuario',
        completedAt: new Date()
      },
      create: {
        type: 'RNC',
        status: 'COMPLETED',
        progress: 0,
        message: 'Sincronización cancelada por el usuario',
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Sincronización cancelada exitosamente'
    })

  } catch (error) {
    console.error('Error cancelling RNC sync:', error)
    return NextResponse.json(
      { error: 'Error cancelando la sincronización' },
      { status: 500 }
    )
  }
}