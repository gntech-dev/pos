import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import AdmZip from 'adm-zip'
import csv from 'csv-parser'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

interface DGIIRecord {
  rnc: string
  businessName: string
  businessType: string
  status: string
  address: string
  province: string
  municipality: string
  sector: string
  phone: string
  email: string
}

interface CSVData {
  RNC?: string
  'RAZÓN SOCIAL'?: string
  'ACTIVIDAD ECONÓMICA'?: string
  ESTADO?: string
  [key: string]: string | undefined
}

export async function POST(req: NextRequest) {
  try {
    const { forceSync = false, useLocalCsv = false } = await req.json()

    console.log('Starting RNC synchronization from DGII...')

    // Check if sync is already running
    const existingSync = await prisma.syncStatus.findUnique({
      where: { type: 'RNC' }
    })

    if (existingSync?.status === 'RUNNING' && !forceSync) {
      return NextResponse.json(
        { error: 'Ya hay una sincronización en curso. Use "Forzar Sincronización" para iniciar una nueva.' },
        { status: 409 }
      )
    }

    // Initialize sync status
    await prisma.syncStatus.upsert({
      where: { type: 'RNC' },
      update: {
        status: 'RUNNING',
        progress: 0,
        message: 'Iniciando sincronización...',
        startedAt: new Date(),
        errorMessage: null
      },
      create: {
        type: 'RNC',
        status: 'RUNNING',
        progress: 0,
        message: 'Iniciando sincronización...',
        startedAt: new Date()
      }
    })

    const dgiiUrl = 'https://dgii.gov.do/app/WebApps/Consultas/RNC/RNC_CONTRIBUYENTES.zip'

    // Create cache directory if it doesn't exist
    const cacheDir = path.join(process.cwd(), 'cache', 'rnc')
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }

    // Check for cached ZIP file from today before 2 AM
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const cacheFilePath = path.join(cacheDir, `rnc_contribuyentes_${todayString}.zip`)

    let zipBuffer: Buffer = Buffer.alloc(0) // Initialize with empty buffer
    let _usedCache = false
    let _localRecords: DGIIRecord[] | undefined

    // If requested, prefer a local CSV file in cache for testing
    const localCsvPath = path.join(cacheDir, 'RNC.csv')
    if (useLocalCsv && fs.existsSync(localCsvPath)) {
      console.log('Using local CSV for RNC sync:', localCsvPath)
      const csvContent = fs.readFileSync(localCsvPath, 'latin1')

      // Update progress
      await prisma.syncStatus.update({
        where: { type: 'RNC' },
        data: {
          progress: 30,
          message: 'Procesando CSV de prueba local...'
        }
      })

      // Parse CSV and proceed to processing (skip ZIP path)
      const records: DGIIRecord[] = []
      let rowCount = 0
      await new Promise((resolve, reject) => {
        Readable.from(csvContent)
          .pipe(csv())
          .on('data', (data: CSVData) => {
            rowCount++
            const isActive = data.ESTADO && data.ESTADO.toUpperCase() === 'ACTIVO'
            if (isActive) {
              records.push({
                rnc: data.RNC || '',
                businessName: data['RAZÓN SOCIAL'] || '',
                businessType: data['ACTIVIDAD ECONÓMICA'] || '',
                status: 'ACTIVE',
                address: '',
                province: '',
                municipality: '',
                sector: '',
                phone: '',
                email: ''
              })
            }
          })
          .on('end', () => {
            console.log(`Local CSV rows processed: ${rowCount}, active: ${records.length}`)
            resolve(null)
          })
          .on('error', reject)
      })

      // Store records for later processing
      _localRecords = records
    } else {
      // Check if we have a cached file from today
      if (fs.existsSync(cacheFilePath)) {
        const stats = fs.statSync(cacheFilePath)
        const fileDate = new Date(stats.mtime)
        const today2AM = new Date(today)
        today2AM.setHours(2, 0, 0, 0) // 2:00 AM today

        // Use cache if file was created today before 2 AM
        if (fileDate.toDateString() === today.toDateString() && fileDate < today2AM) {
          console.log('Using cached ZIP file from today')
          zipBuffer = fs.readFileSync(cacheFilePath)
          _usedCache = true

          // Update progress: Using cache
          await prisma.syncStatus.update({
            where: { type: 'RNC' },
            data: {
              progress: 10,
              message: 'Usando archivo ZIP en caché (descargado hoy antes de las 2:00 AM)...'
            }
          })
        } else {
          console.log('Cached file is not from today or was downloaded after 2 AM, downloading new one')
          // Download new file
          await prisma.syncStatus.update({
            where: { type: 'RNC' },
            data: {
              progress: 10,
              message: 'Descargando archivo ZIP de la DGII...'
            }
          })

          const response = await axios.get(dgiiUrl, { responseType: 'arraybuffer' })
          zipBuffer = Buffer.from(response.data)

          // Save to cache
          fs.writeFileSync(cacheFilePath, zipBuffer)
          console.log(`Saved ZIP file to cache: ${cacheFilePath}`)
        }
      } else {
        // No cache file exists, download new one
        await prisma.syncStatus.update({
          where: { type: 'RNC' },
          data: {
            progress: 10,
            message: 'Descargando archivo ZIP de la DGII...'
          }
        })

        const response = await axios.get(dgiiUrl, { responseType: 'arraybuffer' })
        zipBuffer = Buffer.from(response.data)

        // Save to cache
        fs.writeFileSync(cacheFilePath, zipBuffer)
        console.log(`Saved ZIP file to cache: ${cacheFilePath}`)
      }
    }

    // Read with latin1 encoding (Windows-1252) for proper Spanish characters
    let records: DGIIRecord[] = []
    if (typeof _localRecords !== 'undefined') {
      // already parsed local CSV
      records = _localRecords
    } else {
      // Update progress: Extracting
      await prisma.syncStatus.update({
        where: { type: 'RNC' },
        data: {
          progress: 20,
          message: 'Extrayendo archivo ZIP...'
        }
      })

      // Extract the ZIP
      console.log('Extracting ZIP file...')
      const zip = new AdmZip(zipBuffer)
      const zipEntries = zip.getEntries()

      // Find the CSV file (assuming it's the only file or named something like RNC_CONTRIBUYENTES.csv)
      const csvEntry = zipEntries.find(entry => entry.entryName.endsWith('.csv'))
      if (!csvEntry) {
        throw new Error('No CSV file found in the ZIP')
      }

      // Update progress: Parsing
      await prisma.syncStatus.update({
        where: { type: 'RNC' },
        data: {
          progress: 30,
          message: 'Procesando datos CSV...'
        }
      })

      const csvContent = zip.readAsText(csvEntry, 'latin1')

      // Parse CSV and filter active records
      console.log('Parsing CSV and filtering active RNC records...')
      const stream = Readable.from(csvContent)
      let rowCount = 0
      let headersLogged = false

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data: CSVData) => {
            rowCount++
            // Log headers and first few rows to understand structure
            if (!headersLogged) {
              console.log('CSV Headers:', Object.keys(data))
              headersLogged = true
            }
            if (rowCount <= 5) {
              console.log('Sample row:', data)
            }

            // Status column is 'ESTADO', active is 'ACTIVO'
            const isActive = data.ESTADO && data.ESTADO.toUpperCase() === 'ACTIVO'

            if (isActive) {
              records.push({
                rnc: data.RNC || '',
                businessName: data['RAZÓN SOCIAL'] || '',
                businessType: data['ACTIVIDAD ECONÓMICA'] || '',
                status: 'ACTIVE',
                address: '', // Not available in this CSV
                province: '', // Not available
                municipality: '', // Not available
                sector: '', // Not available
                phone: '', // Not available
                email: '' // Not available
              })
            }
          })
          .on('end', () => {
            console.log(`Total rows processed: ${rowCount}`)
            resolve(null)
          })
          .on('error', reject)
      })
    }

    console.log(`Found ${records.length} active RNC records`)

    // Update progress: Processing records
    await prisma.syncStatus.update({
      where: { type: 'RNC' },
      data: {
        progress: 40,
        message: `Procesando ${records.length} registros RNC...`
      }
    })

    let syncedCount = 0
    let updatedCount = 0
    let errorCount = 0

    // Process records in batches to avoid memory issues
    const batchSize = 100
    const totalBatches = Math.ceil(records.length / batchSize)
    console.log(`Starting batch processing: ${records.length} records, ${totalBatches} batches`)

    // Track processed records for more granular progress updates
    let processedCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const currentBatch = Math.floor(i / batchSize) + 1

      // Check if sync has been cancelled
      const currentStatus = await prisma.syncStatus.findUnique({
        where: { type: 'RNC' },
        select: { status: true }
      })

      if (currentStatus?.status === 'CANCELLED') {
        console.log('Sync has been cancelled, stopping batch processing')
        break
      }

      // Update progress for each batch (also update more granularly inside the batch)
      try {
        // Set message to indicate current batch
        await prisma.syncStatus.update({
          where: { type: 'RNC' },
          data: {
            message: `Procesando lote ${currentBatch} de ${totalBatches}...`
          }
        })
        console.log(`Starting batch ${currentBatch}/${totalBatches}: ${batch.length} records`)
      } catch (progressError) {
        console.error(`Failed to set batch message for batch ${currentBatch}:`, progressError)
      }

      for (const dgiiRecord of batch) {
        try {
          // Check if RNC already exists
          const existingRNC = await prisma.rNCRegistry.findUnique({
            where: { rnc: dgiiRecord.rnc }
          })

          if (existingRNC && !forceSync) {
            // Skip if exists and not force sync
            continue
          }

          // Upsert RNC record
          await prisma.rNCRegistry.upsert({
            where: { rnc: dgiiRecord.rnc },
            update: {
              businessName: dgiiRecord.businessName,
              businessType: dgiiRecord.businessType,
              status: dgiiRecord.status,
              address: dgiiRecord.address,
              province: dgiiRecord.province,
              municipality: dgiiRecord.municipality,
              sector: dgiiRecord.sector,
              phone: dgiiRecord.phone,
              email: dgiiRecord.email,
              lastSyncDate: new Date(),
              syncStatus: 'SYNCED',
              updatedAt: new Date()
            },
            create: {
              rnc: dgiiRecord.rnc,
              businessName: dgiiRecord.businessName,
              businessType: dgiiRecord.businessType,
              status: dgiiRecord.status,
              address: dgiiRecord.address,
              province: dgiiRecord.province,
              municipality: dgiiRecord.municipality,
              sector: dgiiRecord.sector,
              phone: dgiiRecord.phone,
              email: dgiiRecord.email,
              lastSyncDate: new Date(),
              syncStatus: 'SYNCED'
            }
          })

          if (existingRNC) {
            updatedCount++
          } else {
            syncedCount++
          }

          // Increment processed counter and update progress every N records (e.g., every 50 records)
          processedCount++
          if (processedCount % 50 === 0 || processedCount === records.length) {
            const progressPercent = 40 + Math.floor((processedCount / records.length) * 50) // maps to 40-90%
            try {
              await prisma.syncStatus.update({
                where: { type: 'RNC' },
                data: {
                  progress: progressPercent,
                  message: `Procesando ${processedCount} de ${records.length} registros (lote ${currentBatch}/${totalBatches})...`
                }
              })
                console.log(`Updated granular progress: ${progressPercent}% (${processedCount}/${records.length})`)
            } catch (progressErr) {
              console.error('Failed to update granular progress:', progressErr)
            }
          }

        } catch (error) {
          console.error(`Error syncing RNC ${dgiiRecord.rnc}:`, error)
          errorCount++

          // Mark as failed
          await prisma.rNCRegistry.upsert({
            where: { rnc: dgiiRecord.rnc },
            update: {
              syncStatus: 'FAILED',
              updatedAt: new Date()
            },
            create: {
              rnc: dgiiRecord.rnc,
              businessName: dgiiRecord.businessName,
              businessType: dgiiRecord.businessType,
              status: dgiiRecord.status,
              address: dgiiRecord.address,
              province: dgiiRecord.province,
              municipality: dgiiRecord.municipality,
              sector: dgiiRecord.sector,
              phone: dgiiRecord.phone,
              email: dgiiRecord.email,
              lastSyncDate: new Date(),
              syncStatus: 'FAILED'
            }
          })
        }
      }
    }

    // Check if sync was cancelled during processing
    const finalStatus = await prisma.syncStatus.findUnique({
      where: { type: 'RNC' },
      select: { status: true }
    })

    if (finalStatus?.status === 'CANCELLED') {
      console.log('Sync was cancelled, not marking as completed')
      return NextResponse.json({
        success: true,
        message: `Sincronización cancelada. ${syncedCount} nuevos, ${updatedCount} actualizados, ${errorCount} errores procesados antes de la cancelación.`,
        stats: {
          synced: syncedCount,
          updated: updatedCount,
          errors: errorCount,
          cancelled: true
        }
      })
    }

    // Update progress: Finalizing
    await prisma.syncStatus.update({
      where: { type: 'RNC' },
      data: {
        progress: 95,
        message: 'Finalizando sincronización...'
      }
    })

    // Get total count
    const totalRecords = await prisma.rNCRegistry.count()

    // Mark as completed
    await prisma.syncStatus.update({
      where: { type: 'RNC' },
      data: {
        status: 'COMPLETED',
        progress: 100,
        message: `Sincronización completada. ${syncedCount} nuevos, ${updatedCount} actualizados, ${errorCount} errores.`,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Sincronización completada. ${syncedCount} nuevos, ${updatedCount} actualizados, ${errorCount} errores.`,
      stats: {
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        total: totalRecords
      }
    })

  } catch (error) {
    console.error('RNC sync error:', error)

    // Mark sync as failed
    await prisma.syncStatus.upsert({
      where: { type: 'RNC' },
      update: {
        status: 'FAILED',
        progress: 0,
        message: 'Error en la sincronización',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      },
      create: {
        type: 'RNC',
        status: 'FAILED',
        progress: 0,
        message: 'Error en la sincronización',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    })

    return NextResponse.json(
      { error: 'Error en la sincronización de RNC' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get sync statistics
    const totalRecords = await prisma.rNCRegistry.count()
    const syncedRecords = await prisma.rNCRegistry.count({
      where: { syncStatus: 'SYNCED' }
    })
    const failedRecords = await prisma.rNCRegistry.count({
      where: { syncStatus: 'FAILED' }
    })

    const lastSync = await prisma.rNCRegistry.findFirst({
      orderBy: { lastSyncDate: 'desc' },
      select: { lastSyncDate: true }
    })

    // Get current sync status
    const syncStatus = await prisma.syncStatus.findUnique({
      where: { type: 'RNC' }
    })

    return NextResponse.json({
      totalRecords,
      syncedRecords,
      failedRecords,
      lastSyncDate: lastSync?.lastSyncDate,
      syncStatus: syncStatus ? {
        status: syncStatus.status,
        progress: syncStatus.progress,
        message: syncStatus.message,
        startedAt: syncStatus.startedAt,
        completedAt: syncStatus.completedAt,
        errorMessage: syncStatus.errorMessage
      } : null
    })

  } catch (error) {
    console.error('Error getting RNC sync stats:', error)
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas de sincronización' },
      { status: 500 }
    )
  }
}