import { copyFile, readdir, mkdir } from 'fs/promises'
import { join } from 'path'

const PUBLIC_LOGOS_DIR = join(process.cwd(), 'public', 'logos')
const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads')

async function copyLogosToUploads() {
  try {
    console.log('🎨 Copiando logos SVG a storage/uploads...')

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Read all SVG files from public/logos
    const logoFiles = await readdir(PUBLIC_LOGOS_DIR)
    const svgFiles = logoFiles.filter(file => file.endsWith('.svg'))

    console.log(`📋 Encontrados ${svgFiles.length} logos SVG`)

    // Copy each SVG to uploads directory
    for (const file of svgFiles) {
      const sourcePath = join(PUBLIC_LOGOS_DIR, file)
      const destPath = join(UPLOAD_DIR, file)

      await copyFile(sourcePath, destPath)
      console.log(`✅ Copiado: ${file}`)
    }

    console.log('🎉 Logos copiados exitosamente!')
    console.log('💡 Los logos ahora están disponibles en /api/storage/uploads/[filename]')

  } catch (error) {
    console.error('❌ Error copiando logos:', error)
  }
}

// Run the copy operation
copyLogosToUploads()