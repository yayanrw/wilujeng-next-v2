# Inventaris & Produk

## Product List

- Tabel dengan search, paginasi Load More
- Dropdown filter: Kategori, Merk
- Kolom "Action": edit (pensil), toggle aktif/nonaktif, delete (sampah — admin only)
- Tombol **"Import Products"**: modal upload `.xlsx` untuk bulk upsert berdasarkan SKU (tidak mengubah tiering)
- Cache: Upstash Redis dengan Pattern Matching invalidation

## Tambah/Edit Produk

| Field | Keterangan |
|---|---|
| Nama | Wajib |
| SKU/Barcode | Wajib, unique. Tombol Dices untuk generate `SKU-XXXXXXXX` |
| Harga Beli | Wajib, ≥ 0 |
| Harga Jual Dasar | Wajib, ≥ 0 |
| Stok Awal | Wajib, ≥ 0 |
| Min Stock Threshold | Default 0 |
| Kategori | Autocomplete + Type to Create; di-cache Redis |
| Merk | Autocomplete + Type to Create; di-cache Redis |

- **Multi-Tier Pricing:** Form dinamis `{min_qty > 0, price > 0}`; unique per `min_qty`
- Auto-reset form + Toast sukses/gagal setelah save

## Soft Delete & Status

- `is_active` (default `true`): toggle aktif/nonaktif — hanya admin
- `is_deleted` (default `false`): soft delete — hanya admin
- Produk nonaktif/terhapus tidak muncul di POS search
- Optimistic update di UI; rollback jika API gagal

## Cache Invalidation

Saat update/status/delete: invalidate `products:catalog:*`, `pos:stocks:*`

## API

- `GET /api/products?search=&category_id=&brand_id=` → `200 [{id,sku,name,category,brand,base_price,stock,tiers[]}]`
- `POST /api/products` → body `{sku,name,category_id?,brand_id?,base_price,buy_price,stock,min_stock_threshold,tiers[]}` → `201 {id}`
- `PATCH /api/products/:id` → body subset field → `200 {updated:true}`
- `PATCH /api/products/:id/status` (admin) → `{isActive: boolean}` → `200 {updated:true, id}`
- `DELETE /api/products/:id` (admin) → `200 {deleted:true}`

## Master Data — Brands & Categories

- `GET /api/brands?search=` → `200 [{id,name}]`
- `DELETE /api/brands/:id` (admin) → validasi referensi produk → `200 {deleted:true}` atau `400`; invalidate `brands:list:*`
- `GET /api/categories?search=` → `200 [{id,name}]`
- `DELETE /api/categories/:id` (admin) → validasi referensi produk → `200 {deleted:true}` atau `400`; invalidate `categories:list:*`
