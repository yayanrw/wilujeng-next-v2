create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  name text,
  email text not null,
  emailVerified timestamp,
  image text,
  role text not null default 'cashier',
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now()
);

create unique index if not exists users_email_unique on users (email);

create table if not exists sessions (
  id text primary key,
  sessionToken text not null,
  userId text not null,
  expires timestamp not null,
  createdAt timestamp not null default now()
);

create unique index if not exists sessions_sessionToken_unique on sessions (sessionToken);

create table if not exists accounts (
  id text primary key,
  userId text not null,
  type text not null,
  provider text not null,
  providerAccountId text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  createdAt timestamp not null default now()
);

create unique index if not exists accounts_provider_providerAccountId_unique on accounts (provider, providerAccountId);

create table if not exists verificationTokens (
  id text primary key,
  identifier text not null,
  token text not null,
  expires timestamp not null,
  createdAt timestamp not null default now()
);

create unique index if not exists verificationTokens_token_unique on verificationTokens (token);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  createdAt timestamp not null default now()
);

create unique index if not exists categories_name_unique on categories (name);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  createdAt timestamp not null default now()
);

create unique index if not exists brands_name_unique on brands (name);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  category_id uuid,
  brand_id uuid,
  base_price integer not null,
  buy_price integer not null,
  stock integer not null default 0,
  min_stock_threshold integer not null default 0,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now()
);

create unique index if not exists products_sku_unique on products (sku);
create index if not exists products_category_id_idx on products (category_id);
create index if not exists products_brand_id_idx on products (brand_id);

create table if not exists product_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  min_qty integer not null,
  price integer not null
);

create unique index if not exists product_tiers_product_minQty_unique on product_tiers (product_id, min_qty);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  points integer not null default 0,
  total_debt integer not null default 0,
  createdAt timestamp not null default now(),
  updatedAt timestamp not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  createdAt timestamp not null default now()
);

create unique index if not exists suppliers_name_unique on suppliers (name);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  user_id text not null,
  total_amount integer not null,
  payment_method text not null,
  amount_received integer not null default 0,
  change integer not null default 0,
  status text not null,
  createdAt timestamp not null default now()
);

create index if not exists transactions_createdAt_idx on transactions (createdAt);
create index if not exists transactions_status_idx on transactions (status);
create index if not exists transactions_customer_id_idx on transactions (customer_id);

create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  product_id uuid not null,
  qty integer not null,
  price_at_transaction integer not null,
  subtotal integer not null
);

create index if not exists transaction_items_transaction_id_idx on transaction_items (transaction_id);
create index if not exists transaction_items_product_id_idx on transaction_items (product_id);

create table if not exists stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  type text not null,
  qty integer not null,
  prev_stock integer not null,
  next_stock integer not null,
  note text,
  expiry_date date,
  supplier_id uuid,
  unit_buy_price integer,
  createdAt timestamp not null default now()
);

create index if not exists stock_logs_product_id_createdAt_idx on stock_logs (product_id, createdAt);
create index if not exists stock_logs_supplier_id_createdAt_idx on stock_logs (supplier_id, createdAt);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  store_name text,
  store_icon_name text,
  store_address text,
  store_phone text,
  receipt_footer text,
  updatedAt timestamp not null default now()
);

grant select on settings to anon;
grant all privileges on users, sessions, accounts, verificationTokens to authenticated;
grant all privileges on categories, brands, products, product_tiers, customers, suppliers, transactions, transaction_items, stock_logs, settings to authenticated;

