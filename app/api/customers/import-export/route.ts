import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookie } from "@/lib/session"
import { validateRNC, validateCedula } from "@/lib/utils"
import { z } from "zod"

const CustomerImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  rnc: z.string().optional(),
  cedula: z.string().optional(),
  address: z.string().optional(),
  isCompany: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // If it's a company, RNC is required
    if (data.isCompany && !data.rnc) {
      return false
    }
    // Validate RNC format if provided
    if (data.rnc && data.rnc.trim() && !validateRNC(data.rnc)) {
      return false
    }
    // Validate Cédula format if provided
    if (data.cedula && data.cedula.trim() && !validateCedula(data.cedula)) {
      return false
    }
    return true
  },
  {
    message: "Invalid RNC or Cédula format, or missing required fields for company"
  }
)

/**
 * GET /api/customers/export - Export customers to CSV
 */
export async function GET(_request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            sales: true,
          }
        },
        sales: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            total: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Create CSV header
    const headers = [
      'Name',
      'Email',
      'Phone',
      'RNC',
      'Cedula',
      'Address',
      'Is Company',
      'Total Purchases',
      'Total Spent',
      'Last Purchase Date',
      'Average Order Value',
      'Created At'
    ]

    // Create CSV rows
    const rows = customers.map(customer => {
      const completedSales = customer.sales || []
      const totalPurchases = completedSales.length
      const totalSpent = completedSales.reduce((sum, sale) => sum + sale.total, 0)
      const lastPurchaseDate = completedSales.length > 0 ? completedSales[0].createdAt : null
      const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0

      return [
        `"${customer.name.replace(/"/g, '""')}"`,
        customer.email ? `"${customer.email}"` : '',
        customer.phone ? `"${customer.phone}"` : '',
        customer.rnc ? `"${customer.rnc}"` : '',
        customer.cedula ? `"${customer.cedula}"` : '',
        customer.address ? `"${customer.address.replace(/"/g, '""')}"` : '',
        customer.isCompany ? 'Yes' : 'No',
        totalPurchases.toString(),
        totalSpent.toFixed(2),
        lastPurchaseDate ? lastPurchaseDate.toISOString().split('T')[0] : '',
        averageOrderValue.toFixed(2),
        customer.createdAt.toISOString().split('T')[0]
      ]
    })

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

    return response
  } catch (error) {
    console.error('Error exporting customers:', error)
    return new NextResponse(JSON.stringify({ error: 'Export failed' }), { status: 500 })
  }
}

/**
 * POST /api/customers/import - Import customers from CSV
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided' }), { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return new NextResponse(JSON.stringify({ error: 'File must be a CSV' }), { status: 400 })
    }

    // Read file content
    const csvContent = await file.text()
    const lines = csvContent.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return new NextResponse(JSON.stringify({ error: 'CSV must contain at least a header row and one data row' }), { status: 400 })
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

    // Check if required headers are present (Name is required)
    if (!header.includes('Name')) {
      return new NextResponse(JSON.stringify({ error: 'CSV must contain a "Name" column' }), { status: 400 })
    }

    // Find column indices
    const nameIndex = header.findIndex(h => h === 'Name')
    const emailIndex = header.findIndex(h => h === 'Email')
    const phoneIndex = header.findIndex(h => h === 'Phone')
    const rncIndex = header.findIndex(h => h === 'RNC')
    const cedulaIndex = header.findIndex(h => h === 'Cedula')
    const addressIndex = header.findIndex(h => h === 'Address')
    const isCompanyIndex = header.findIndex(h => h === 'Is Company')

    // Parse data rows
    const customers = []
    const errors = []
    const duplicates = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])

        const customerData = {
          name: values[nameIndex]?.trim() || '',
          email: emailIndex >= 0 ? values[emailIndex]?.trim() || undefined : undefined,
          phone: phoneIndex >= 0 ? values[phoneIndex]?.trim() || undefined : undefined,
          rnc: rncIndex >= 0 ? values[rncIndex]?.trim() || undefined : undefined,
          cedula: cedulaIndex >= 0 ? values[cedulaIndex]?.trim() || undefined : undefined,
          address: addressIndex >= 0 ? values[addressIndex]?.trim() || undefined : undefined,
          isCompany: isCompanyIndex >= 0 ? (values[isCompanyIndex]?.trim().toLowerCase() === 'yes' || values[isCompanyIndex]?.trim() === '1') : false,
        }

        // Validate customer data
        const validationResult = CustomerImportSchema.safeParse(customerData)
        if (!validationResult.success) {
          errors.push({
            row: i + 1,
            name: customerData.name,
            errors: validationResult.error.format()
          })
          continue
        }

        // Check for duplicates
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { rnc: customerData.rnc },
              { cedula: customerData.cedula },
              { email: customerData.email },
              { phone: customerData.phone }
            ].filter(condition => Object.values(condition)[0] !== undefined)
          }
        })

        if (existingCustomer) {
          duplicates.push({
            row: i + 1,
            name: customerData.name,
            existingCustomer: {
              id: existingCustomer.id,
              name: existingCustomer.name,
              rnc: existingCustomer.rnc,
              cedula: existingCustomer.cedula,
              email: existingCustomer.email,
              phone: existingCustomer.phone
            }
          })
          continue
        }

        customers.push(validationResult.data)
      } catch {
        errors.push({
          row: i + 1,
          name: 'Unknown',
          errors: { general: 'Failed to parse row' }
        })
      }
    }

    // If there are validation errors or duplicates, return them for user review
    if (errors.length > 0 || duplicates.length > 0) {
      return new NextResponse(JSON.stringify({
        success: false,
        errors,
        duplicates,
        validCustomers: customers.length
      }), { status: 200 })
    }

    // Import valid customers
    const importedCustomers = []
    for (const customerData of customers) {
      try {
        const customer = await prisma.customer.create({
          data: customerData
        })
        importedCustomers.push(customer)
      } catch (error) {
        console.error('Error creating customer:', error)
        errors.push({
          row: 'N/A',
          name: customerData.name,
          errors: { general: 'Database error during import' }
        })
      }
    }

    return new NextResponse(JSON.stringify({
      success: true,
      imported: importedCustomers.length,
      errors: errors.length,
      customers: importedCustomers
    }), { status: 200 })

  } catch (error) {
    console.error('Error importing customers:', error)
    return new NextResponse(JSON.stringify({ error: 'Import failed' }), { status: 500 })
  }
}

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}