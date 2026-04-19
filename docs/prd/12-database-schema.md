# Database Schema

## Tables

### users
```
id UUID PK
name TEXT
email TEXT UNIQUE
password_hash TEXT
role ENUM('admin','kasir')
created_at TIMESTAMPTZ DEFAULT now()
```

### categories
```
id UUID PK
name TEXT UNIQUE
```

### brands
```
id UUID PK
name TEXT UNIQUE
```

### products
```
id UUID PK
sku TEXT UNIQUE NOT NULL
name TEXT NOT NULL
category_id UUID FK→categories(id)
brand_id UUID FK→brands(id)
base_price INT NOT NULL CHECK(>=0)
buy_price INT NOT NULL CHECK(>=0)
stock INT NOT NULL CHECK(>=0)
min_stock_threshold INT NOT NULL DEFAULT 0 CHECK(>=0)
is_active BOOLEAN NOT NULL DEFAULT true
is_deleted BOOLEAN NOT NULL DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### product_tiers
```
id UUID PK
product_id UUID FK→products(id) ON DELETE CASCADE
min_qty INT NOT NULL CHECK(>0)
price INT NOT NULL CHECK(>0)
UNIQUE(product_id, min_qty)
```

### product_bxgy_promos
```
id UUID PK
product_id UUID FK→products(id)
buy_qty INT NOT NULL
free_qty INT NOT NULL DEFAULT 0
active BOOLEAN NOT NULL DEFAULT true
valid_from TIMESTAMP NULL
valid_to TIMESTAMP NULL
max_multiplier_per_tx INT NULL
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
UNIQUE(product_id, buy_qty, free_qty)
```

### customers
```
id UUID PK
name TEXT NOT NULL
phone TEXT
address TEXT
points INT NOT NULL DEFAULT 0 CHECK(>=0)
total_debt INT NOT NULL DEFAULT 0 CHECK(>=0)
is_active BOOLEAN NOT NULL DEFAULT true
is_deleted BOOLEAN NOT NULL DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
```

### transactions
```
id UUID PK
customer_id UUID NULL FK→customers(id)
user_id UUID FK→users(id)
total_amount INT NOT NULL CHECK(>=0)
payment_method ENUM('cash','qris','transfer','hutang') NOT NULL
amount_received INT NULL
change INT NULL DEFAULT 0
status ENUM('lunas','hutang') NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### transaction_items
```
id UUID PK
transaction_id UUID FK→transactions(id) ON DELETE CASCADE
product_id UUID FK→products(id)
qty INT NOT NULL CHECK(>0)
price_at_transaction INT NOT NULL CHECK(>=0)
subtotal INT NOT NULL CHECK(>=0)
```

### stock_logs
```
id UUID PK
product_id UUID FK→products(id)
type ENUM('in','out','opname','return') NOT NULL
qty INT NOT NULL CHECK(>=0)
prev_stock INT NOT NULL CHECK(>=0)
next_stock INT NOT NULL CHECK(>=0)
note TEXT NULL
expiry_date DATE NULL
supplier_id UUID NULL FK→suppliers(id)
unit_buy_price INT NULL CHECK(>=0)
transaction_id UUID NULL
return_reason TEXT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### debt_payments
```
id UUID PK
customer_id UUID FK→customers(id)
transaction_id UUID NULL FK→transactions(id)
amount INT NOT NULL CHECK(>0)
method TEXT NOT NULL DEFAULT 'cash'
paid_at TIMESTAMPTZ DEFAULT now()
user_id TEXT NOT NULL
note TEXT NULL
```

### points_log
```
id UUID PK
customer_id UUID FK→customers(id)
transaction_id UUID NULL FK→transactions(id)
delta INT NOT NULL
reason TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### suppliers
```
id UUID PK
name TEXT UNIQUE NOT NULL
phone TEXT NULL
address TEXT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### settings
```
id UUID PK
store_name TEXT
store_icon_name TEXT
store_address TEXT
store_phone TEXT
receipt_footer TEXT
updated_at TIMESTAMPTZ DEFAULT now()
```

## Indexes (Recommended)

```
products(sku), products(category_id), products(brand_id)
product_tiers(product_id, min_qty)
transactions(created_at), transactions(status)
transaction_items(transaction_id)
stock_logs(product_id, created_at), stock_logs(supplier_id, created_at)
suppliers(name)
```
