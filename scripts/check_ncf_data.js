const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('=== NCF Sequences ===')
    const ncfSequences = await prisma.nCFSequence.findMany()
    console.log('NCF Sequences count:', ncfSequences.length)
    ncfSequences.forEach(seq => {
      console.log(`Type: ${seq.type}, Expiry: ${seq.expiryDate}, Active: ${seq.isActive}`)
    })

    console.log('\n=== Sales with NCF ===')
    const salesWithNCF = await prisma.sale.findMany({
      where: { ncf: { not: null } },
      include: { customer: true }
    })
    console.log('Sales with NCF count:', salesWithNCF.length)
    salesWithNCF.forEach(sale => {
      console.log(`Sale: ${sale.saleNumber}, NCF: ${sale.ncf}, Customer: ${sale.customer?.name || 'N/A'}`)
    })

    console.log('\n=== Sample Sale Details ===')
    if (salesWithNCF.length > 0) {
      const sampleSale = salesWithNCF[0]
      console.log('Sample sale NCF:', sampleSale.ncf)
      console.log('Sample sale NCF type:', sampleSale.ncfType)
      
      // Test our new function
      const { getNCFExpirationDate, getNCFExpirationInfo } = require('./lib/ncf.ts')
      if (getNCFExpirationDate) {
        const expiryDate = await getNCFExpirationDate(sampleSale.ncf)
        console.log('Retrieved expiry date:', expiryDate)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()