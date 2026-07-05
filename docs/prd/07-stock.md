# Kelola Stok

## Stock Log

- Histori perubahan stok: Opname, In, Out
- Paginasi Load More
- Filter: rentang tanggal (native date picker), tipe (all/in/out/opname), Product Picker (autocomplete); **auto-apply** (debounce ~400ms) — tanpa tombol Apply. Overlay blur + spinner saat refetch bila baris sudah tampil
- Kolom: nama produk, tipe, qty, prev/next stock, tanggal, aksi (modal detail). Kolom Catatan disembunyikan di mobile (`hidden sm:table-cell`)

## Stock Masuk (IN)

- Fields: Produk (autocomplete), Qty, Harga Beli, Supplier (autocomplete + Type to Create), Tanggal Kadaluarsa (date picker), Note
- Supplier di-cache Redis; Type to Create otomatis membuat supplier baru dan menyimpan `supplier_id` pada log
- Auto-reset form + Toast sukses/gagal

## Stock Keluar (OUT)

- Fields: Produk (autocomplete, menampilkan stok saat ini), Qty, Tipe (Rusak/Hilang | Retur), Note
- Retur: Transaction Picker wajib (transaksi 30 hari terakhir, filter lokal by ID/pelanggan) + alasan retur
- Standard Form Pattern: loading bar, inline error (produk/qty/transaksi wajib), Enter-nav, Shift+Enter submit, success/fail sound
- **Validasi stok lokal**: tipe non-retur → qty tidak boleh melebihi stok tersedia (inline error + submit disabled); server tetap validasi
- Auto-reset form + Toast

## Stock Opname

- Fields: Produk (autocomplete), Qty (replace absolute), Note
- Saat produk dipilih: qty di-prefill stok sistem + auto-focus; panel menampilkan **Stok Sistem** dan **Selisih** (badge warna: `+n` hijau, `-n` merah, `0` "Sesuai")
- Standard Form Pattern (loading bar, inline error, Enter-nav, sound)
- Set stok fisik; log prev/next_stock
- Auto-reset form + Toast

## API

- `POST /api/stock/in` → `{product_id, qty, unit_buy_price, supplier_id?, supplier_name?, expiry_date?, note?}` → `200 {prev_stock, next_stock, average_cost, supplier_id}` — `average_cost` adalah HPP rata-rata baru hasil moving average
- `POST /api/stock/out` → `{product_id, qty, type, note?, transaction_id?, return_reason?}` → `200 {next_stock}`
- `POST /api/stock/opname` → `{product_id, qty, note?}` → `200 {prev_stock, next_stock}`
- `GET /api/stock/logs?from&to&type&productId&limit&offset` → daftar log (staff)
- `GET /api/transactions/recent` → 100 transaksi 30 hari terakhir `[{id, customerName, totalAmount, createdAt}]` — **staff-accessible** (bukan admin-only), dipakai Return picker; filter dilakukan di klien

## Master Data — Suppliers

- `GET /api/suppliers?search=` → `200 [{id,name,phone,address}]`
- `POST /api/suppliers` → `{name, phone?, address?}` → `201 {id}`
- `DELETE /api/suppliers/:id` (admin) → validasi referensi stock_logs → `200 {deleted:true}` atau `400`; invalidate `suppliers:list:*`
