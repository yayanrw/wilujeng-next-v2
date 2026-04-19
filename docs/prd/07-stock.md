# Kelola Stok

## Stock Log

- Histori perubahan stok: Opname, In, Out
- Paginasi Load More
- Filter: rentang tanggal, Product Picker (autocomplete)
- Kolom: nama produk, tipe, qty, prev/next stock, tanggal, aksi (modal detail)

## Stock Masuk (IN)

- Fields: Produk (autocomplete), Qty, Harga Beli, Supplier (autocomplete + Type to Create), Tanggal Kadaluarsa (date picker), Note
- Supplier di-cache Redis; Type to Create otomatis membuat supplier baru dan menyimpan `supplier_id` pada log
- Auto-reset form + Toast sukses/gagal

## Stock Keluar (OUT)

- Fields: Produk (autocomplete), Qty, Note
- Untuk barang rusak/retur manual
- Auto-reset form + Toast

## Stock Opname

- Fields: Produk (autocomplete), Brand (autocomplete), Qty (replace absolute), Note
- Set stok fisik; log prev/next_stock
- Auto-reset form + Toast

## API

- `POST /api/stock/in` → `{product_id, qty, unit_buy_price, supplier_id?, supplier_name?, expiry_date?, note?}` → `200 {next_stock, supplier_id}`
- `POST /api/stock/out` → `{product_id, qty, note}` → `200 {next_stock}`
- `POST /api/stock/opname` → `{product_id, qty, note?}` → `200 {prev_stock, next_stock}`

## Master Data — Suppliers

- `GET /api/suppliers?search=` → `200 [{id,name,phone,address}]`
- `POST /api/suppliers` → `{name, phone?, address?}` → `201 {id}`
- `DELETE /api/suppliers/:id` (admin) → validasi referensi stock_logs → `200 {deleted:true}` atau `400`; invalidate `suppliers:list:*`
