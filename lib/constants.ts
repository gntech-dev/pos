// DGII Constants for Dominican Republic
export const DGII_CONSTANTS = {
  ITBIS_RATE: 0.18, // 18% tax rate
  RNC_LENGTH: 9,
  CEDULA_LENGTH: 11,
  NCF_LENGTH: 13, // B01 + 10 digits
}

// NCF Prefixes
export const NCF_PREFIXES = {
  B01: 'B01', // Crédito Fiscal
  B02: 'B02', // Consumo
  B14: 'B14', // Regímenes Especiales
  B15: 'B15', // Gubernamental
  B16: 'B16', // Exportaciones
}

// Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  ACCOUNTANT: 'ACCOUNTANT',
}

// Permissions by role
export const PERMISSIONS = {
  ADMIN: ['*'], // All permissions
  MANAGER: [
    'sales.create',
    'sales.view',
    'sales.delete',
    'products.create',
    'products.update',
    'products.delete',
    'inventory.manage',
    'customers.manage',
    'quotations.manage',
    'refunds.manage',
    'reports.view',
  ],
  CASHIER: [
    'sales.create',
    'sales.view',
    'customers.view',
    'quotations.view',
    'refunds.create',
  ],
  ACCOUNTANT: [
    'sales.view',
    'reports.view',
    'reports.export',
    'invoices.view',
  ],
}
