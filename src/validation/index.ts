import { z } from "zod"

// User validation schemas
export const userSchemas = {
  login: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters")
  }),

  create: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["ADMIN", "MANAGER", "CASHIER"])
  }),

  update: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
    isActive: z.boolean().optional()
  })
}

// Product validation schemas
export const productSchemas = {
  create: z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    cost: z.number().positive("Cost must be positive").optional(),
    sku: z.string().min(1, "SKU is required"),
    barcode: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    minStock: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true)
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    cost: z.number().positive().optional(),
    sku: z.string().min(1).optional(),
    barcode: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    minStock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
}

// Sale validation schemas
export const saleSchemas = {
  create: z.object({
    customerId: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive("Quantity must be positive"),
      price: z.number().positive("Price must be positive")
    })).min(1, "At least one item is required"),
    paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
    discount: z.number().min(0).default(0),
    tax: z.number().min(0).default(0)
  })
}

export class ValidationService {
  static validate(schema: z.ZodSchema, data: unknown) {
    try {
      return {
        success: true,
        data: schema.parse(data)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }]
      }
    }
  }

  static validateLogin(data: unknown) {
    return this.validate(userSchemas.login, data)
  }

  static validateUserCreate(data: unknown) {
    return this.validate(userSchemas.create, data)
  }

  static validateProductCreate(data: unknown) {
    return this.validate(productSchemas.create, data)
  }

  static validateSaleCreate(data: unknown) {
    return this.validate(saleSchemas.create, data)
  }
}