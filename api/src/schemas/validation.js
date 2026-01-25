const { z } = require('zod');

/**
 * Schémas de validation Zod pour les routes principales
 */

// ========== ACCOUNTS ==========
const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Account name is required').max(255, 'Account name too long'),
    type: z.enum(['banque', 'cash', 'crypto', 'autre'], {
      errorMap: () => ({ message: 'Invalid account type' })
    }).default('banque'),
    currency: z.string().length(3, 'Currency must be 3 letters (e.g., EUR, USD)').default('EUR'),
    balance: z.number().finite('Balance must be a finite number').default(0),
    institution: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    portfolioId: z.number().int().positive().optional().nullable()
  })
});

const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Account ID must be a number').transform(Number)
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['banque', 'cash', 'crypto', 'autre']).optional(),
    currency: z.string().length(3).optional(),
    balance: z.number().finite().optional(),
    institution: z.string().max(255).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    portfolioId: z.number().int().positive().optional().nullable()
  })
});

// ========== TRANSACTIONS ==========
const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().finite('Amount must be a valid number'),
    amountHT: z.number().finite().default(0),
    amountTTC: z.number().finite().default(0),
    vatRate: z.number().min(0).max(100).default(0),
    vatMode: z.enum(['HT', 'TTC']).default('HT'),
    type: z.enum(['credit', 'debit'], {
      errorMap: () => ({ message: 'Type must be credit or debit' })
    }),
    accountId: z.number().int().positive('Account ID must be positive'),
    categoryId: z.number().int().positive().optional().nullable(),
    description: z.string().max(500).optional(),
    occurredAt: z.string().datetime().optional(),
    scheduledFor: z.string().datetime().optional().nullable(),
    status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED']).default('CONFIRMED')
  })
});

const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number)
  }),
  body: z.object({
    amount: z.number().finite().optional(),
    amountHT: z.number().finite().optional(),
    amountTTC: z.number().finite().optional(),
    vatRate: z.number().min(0).max(100).optional(),
    vatMode: z.enum(['HT', 'TTC']).optional(),
    type: z.enum(['credit', 'debit']).optional(),
    accountId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    occurredAt: z.string().datetime().optional(),
    scheduledFor: z.string().datetime().optional().nullable(),
    status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED']).optional(),
    archived: z.boolean().optional()
  })
});

// ========== BUDGETS ==========
const createBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Budget name is required').max(255),
    amount: z.number().finite('Amount must be valid').min(0, 'Amount cannot be negative').optional().nullable(),
    period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
    categoryId: z.number().int().positive().optional().nullable()
  })
});

// ========== CATEGORIES ==========
const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(255),
    kind: z.enum(['EXPENSE', 'INCOME'], {
      errorMap: () => ({ message: 'Kind must be EXPENSE or INCOME' })
    })
  })
});

// ========== USERS ==========
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).default('USER')
  })
});

// ========== AUTH ==========
const registerSchema = {
  body: z.object({
    companyName: z.string().min(1, 'Company name is required').max(255),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
};

module.exports = {
  // Accounts
  createAccountSchema,
  updateAccountSchema,
  // Transactions
  createTransactionSchema,
  updateTransactionSchema,
  // Budgets
  createBudgetSchema,
  // Categories
  createCategorySchema,
  // Users
  createUserSchema,
  // Auth
  registerSchema,
  loginSchema
};
