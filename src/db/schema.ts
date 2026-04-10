import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    role: text('role').notNull().default('cashier'),
    createdAt: timestamp('createdAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull(),
    userId: text('userId').notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }),
  },
  (t) => [uniqueIndex('sessions_token_unique').on(t.token)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    type: text('type'),
    providerId: text('providerId').notNull(),
    accountId: text('accountId').notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    expiresAt: timestamp('expiresAt', { mode: 'date' }),
    tokenType: text('tokenType'),
    scope: text('scope'),
    password: text('password'),
    session_state: text('session_state'),
    createdAt: timestamp('createdAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }),
  },
  (t) => [
    uniqueIndex('accounts_providerId_accountId_unique').on(
      t.providerId,
      t.accountId,
    ),
  ],
);

export const verificationTokens = pgTable('verificationTokens', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }),
  updatedAt: timestamp('updatedAt', { mode: 'date' }),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('categories_name_unique').on(t.name)],
);

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('brands_name_unique').on(t.name)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    categoryId: uuid('category_id'),
    brandId: uuid('brand_id'),
    basePrice: integer('base_price').notNull(),
    buyPrice: integer('buy_price').notNull(),
    stock: integer('stock').notNull().default(0),
    minStockThreshold: integer('min_stock_threshold').notNull().default(0),
    createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedat', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('products_sku_unique').on(t.sku)],
);

export const productTiers = pgTable(
  'product_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull(),
    minQty: integer('min_qty').notNull(),
    price: integer('price').notNull(),
  },
  (t) => [
    uniqueIndex('product_tiers_product_minQty_unique').on(
      t.productId,
      t.minQty,
    ),
  ],
);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  points: integer('points').notNull().default(0),
  totalDebt: integer('total_debt').notNull().default(0),
  createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedat', { mode: 'date' }).notNull().defaultNow(),
});

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('suppliers_name_unique').on(t.name)],
);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id'),
  userId: text('user_id').notNull(),
  totalAmount: integer('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  amountReceived: integer('amount_received').notNull().default(0),
  change: integer('change').notNull().default(0),
  status: text('status').notNull(),
  createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull(),
  productId: uuid('product_id').notNull(),
  qty: integer('qty').notNull(),
  priceAtTransaction: integer('price_at_transaction').notNull(),
  subtotal: integer('subtotal').notNull(),
});

export const stockLogs = pgTable('stock_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull(),
  type: text('type').notNull(),
  qty: integer('qty').notNull(),
  prevStock: integer('prev_stock').notNull(),
  nextStock: integer('next_stock').notNull(),
  note: text('note'),
  expiryDate: date('expiry_date'),
  supplierId: uuid('supplier_id'),
  unitBuyPrice: integer('unit_buy_price'),
  transactionId: uuid('transaction_id'),
  returnReason: text('return_reason'),
  createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
});

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeName: text('store_name'),
    storeIconName: text('store_icon_name'),
    storeAddress: text('store_address'),
    storePhone: text('store_phone'),
    receiptFooter: text('receipt_footer'),
    updatedAt: timestamp('updatedat', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('settings_singleton').on(t.id)],
);

export const pointsLog = pgTable('points_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull(),
  transactionId: uuid('transaction_id'),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('createdat', { mode: 'date' }).notNull().defaultNow(),
});

export const debtPayments = pgTable('debt_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull(),
  transactionId: uuid('transaction_id'),
  amount: integer('amount').notNull(),
  method: text('method').notNull().default('cash'),
  paidAt: timestamp('paid_at', { mode: 'date' }).notNull().defaultNow(),
  userId: text('user_id').notNull(),
  note: text('note'),
});
