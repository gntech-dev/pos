import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function seedUsers() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      email: "admin@possystem.com",
      username: "admin",
      password: adminPassword,
      name: "Administrator",
      role: "ADMIN",
    }
  })

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 10)
  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      email: "manager@possystem.com",
      username: "manager",
      password: managerPassword,
      name: "Manager User",
      role: "MANAGER",
    }
  })

  // Create cashier user
  const cashierPassword = await bcrypt.hash("cashier123", 10)
  const cashier = await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      email: "cashier@possystem.com",
      username: "cashier",
      password: cashierPassword,
      name: "Cashier User",
      role: "CASHIER",
    }
  })

  console.log({ admin, manager, cashier })
}

async function seedNCFSequences() {
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1) // Valid for 1 year

  const sequences = [
    {
      type: "B01",
      prefix: "B01",
      currentNumber: 0,
      startNumber: 1,
      endNumber: 10000,
      expiryDate,
      isActive: true,
    },
    {
      type: "B02",
      prefix: "B02",
      currentNumber: 0,
      startNumber: 1,
      endNumber: 10000,
      expiryDate,
      isActive: true,
    },
    {
      type: "B14",
      prefix: "B14",
      currentNumber: 0,
      startNumber: 1,
      endNumber: 10000,
      expiryDate,
      isActive: true,
    },
  ]

  for (const seq of sequences) {
    await prisma.nCFSequence.upsert({
      where: { type: seq.type as any },
      update: {},
      create: seq as any,
    })
  }

  console.log("NCF sequences seeded")
}

async function seedSettings() {
  const settings = [
    {
      key: "business_name",
      value: "Mi Negocio",
      description: "Nombre del negocio",
    },
    {
      key: "business_rnc",
      value: "000000000",
      description: "RNC del negocio",
    },
    {
      key: "business_address",
      value: "Calle Principal #123, Santo Domingo",
      description: "Dirección del negocio",
    },
    {
      key: "business_phone",
      value: "809-000-0000",
      description: "Teléfono del negocio",
    },
    {
      key: "receipt_footer",
      value: "Gracias por su compra",
      description: "Mensaje al pie del recibo",
    },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log("Settings seeded")
}

async function seedProducts() {
  const products = [
    {
      name: "Agua 500ml",
      description: "Agua purificada 500ml",
      barcode: "7501234567890",
      sku: "AGU-500",
      price: 25.0,
      cost: 15.0,
      taxRate: 0.18,
      category: "Bebidas",
      stock: 100,
      minStock: 20,
    },
    {
      name: "Refresco Cola 2L",
      description: "Refresco de cola 2 litros",
      barcode: "7501234567891",
      sku: "REF-COLA-2L",
      price: 85.0,
      cost: 55.0,
      taxRate: 0.18,
      category: "Bebidas",
      stock: 50,
      minStock: 10,
    },
    {
      name: "Pan de Agua",
      description: "Pan fresco de agua",
      barcode: "7501234567892",
      sku: "PAN-AGUA",
      price: 15.0,
      cost: 8.0,
      taxRate: 0.18,
      category: "Panadería",
      stock: 200,
      minStock: 50,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    })
  }

  console.log("Products seeded")
}

async function main() {
  console.log("Starting seed...")
  
  await seedUsers()
  await seedNCFSequences()
  await seedSettings()
  await seedProducts()
  
  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
