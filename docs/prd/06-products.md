# Inventaris & Produk

## Product List

- Tabel dengan search, paginasi Load More
- Dropdown filter: Kategori, Merk
- Kolom "Action": edit (pensil), toggle aktif/nonaktif, delete (sampah — admin only)
- Tombol **"Import Products"**: modal upload `.xlsx` untuk bulk upsert berdasarkan SKU (tidak mengubah tiering)
  - Kolom wajib: `SKU`, `Name`, `Base Price`; opsional: `Buy Price`, `Stock`, `Min Stock`, `Category`, `Brand`, `id`
  - Produk **baru** dengan `Stock > 0`: insert produk (`averageCost = buyPrice`) + otomatis buat `stock_logs` tipe `in` (audit trail stok awal)
  - Produk **lama** (match by `id` atau SKU): update langsung termasuk `averageCost = buyPrice`; tidak membuat `stock_logs`
- Cache: Upstash Redis dengan Pattern Matching invalidation

## Tambah/Edit Produk

| Field | Create | Edit | Keterangan |
|---|---|---|---|
| Nama | Input | Input | Wajib |
| SKU/Barcode | Input | Input | Wajib, unique. Tombol Dices untuk generate `SKU-XXXXXXXX` |
| Harga Beli | Input | **Read-only** | Diisi awal saat create; selanjutnya hanya berubah lewat Stock In |
| HPP Rata-rata (`averageCost`) | — | **Read-only** | Dihitung otomatis dari Moving Average Cost tiap Stock In |
| Harga Jual Dasar | Input | Input | Wajib, ≥ 0 |
| Stok | Input | **Read-only** | Hanya dapat diubah lewat menu Stok (In/Out/Opname) |
| Min Stock Threshold | Input | Input | Default 0 |
| Kategori | Autocomplete + Type to Create | Autocomplete + Type to Create | — |
| Merk | Autocomplete + Type to Create | Autocomplete + Type to Create | — |

- **Multi-Tier Pricing:** Form dinamis `{min_qty > 0, price > 0}`; unique per `min_qty`
- **`+ Stock` button** (edit mode): shortcut Stock In langsung dari form produk
- **Section "Stok Awal (Opsional)"** (create mode): collapsible, fields: qty, harga beli, supplier, tgl expired, catatan. Jika diisi → `POST /api/products` (stock=0) lalu `POST /api/stock/in` otomatis sehingga stok awal terekam di `stock_logs` dan `averageCost` terisi.
- Auto-reset form + Toast sukses/gagal setelah save

## Soft Delete & Status

- `is_active` (default `true`): toggle aktif/nonaktif — hanya admin
- `is_deleted` (default `false`): soft delete — hanya admin
- Produk nonaktif/terhapus tidak muncul di POS search
- Optimistic update di UI; rollback jika API gagal

## Cache Invalidation

Saat update/status/delete: invalidate `products:catalog:*`, `pos:stocks:*`

## API

- `GET /api/products?search=&category_id=&brand_id=` → `200 [{id,sku,name,category,brand,base_price,buy_price,average_cost,stock,tiers[]}]`
- `POST /api/products` → body `{sku,name,category_id?,brand_id?,base_price,buy_price,stock,min_stock_threshold,tiers[]}` → `201 {id}`
- `PATCH /api/products/:id` → body subset field (tidak termasuk `buy_price`/`stock` — keduanya hanya dari Stock) → `200 {updated:true}`
- `PATCH /api/products/:id/status` (admin) → `{isActive: boolean}` → `200 {updated:true, id}`
- `DELETE /api/products/:id` (admin) → `200 {deleted:true}`

## Master Data — Brands & Categories

- `GET /api/brands?search=` → `200 [{id,name}]` (default limit 50)
- `GET /api/brands?all=1` → `200 [{id,name}]` (semua merk, tanpa limit; cache key `brands:list:all-full`) — dipakai ProductForm untuk search lokal
- `DELETE /api/brands/:id` (admin) → validasi referensi produk → `200 {deleted:true}` atau `400`; invalidate `brands:list:*`
- `GET /api/categories?search=` → `200 [{id,name}]` (default limit 50)
- `GET /api/categories?all=1` → `200 [{id,name}]` (semua kategori, tanpa limit; cache key `categories:list:all-full`) — dipakai ProductForm untuk search lokal
- `DELETE /api/categories/:id` (admin) → validasi referensi produk → `200 {deleted:true}` atau `400`; invalidate `categories:list:*`
