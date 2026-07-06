# Kelola Stok

## Stock Log

- Histori perubahan stok: Opname, In, Out
- Paginasi Load More
- Filter: rentang tanggal (native date picker), tipe (all/in/out/opname), Product Picker (autocomplete); **auto-apply** (debounce ~400ms) — tanpa tombol Apply. Overlay blur + spinner saat refetch bila baris sudah tampil
- Kolom: nama produk, tipe, qty, prev/next stock, tanggal, aksi (modal detail). Kolom Catatan disembunyikan di mobile (`hidden sm:table-cell`)

## Stock Masuk (IN)

- **Alur bulk (scan-based)**: header shared Supplier (autocomplete + Type to Create) + Note diisi sekali untuk seluruh kiriman. Produk ditambahkan lewat search/scan (kamera barcode, exact SKU match) — produk baru → baris baru (qty 1, harga beli prefill dari `buyPrice` produk); scan/pilih produk yang sudah ada di list → qty baris itu +1 (tanpa baris duplikat)
- Tiap baris: qty & harga beli editable manual, tombol hapus baris, tanggal kadaluarsa opsional (disembunyikan di belakang toggle per baris)
- Footer menampilkan ringkasan `{jumlah produk} · {total unit}` dan submit tunggal untuk seluruh baris
- Supplier di-cache Redis; Type to Create otomatis membuat supplier baru dan menyimpan `supplier_id` pada seluruh log dalam batch
- Submit sukses → toast + reset seluruh baris/supplier/note; submit gagal → baris tetap ada agar user bisa retry tanpa mengulang scan
- Form single-item (`QuickStockInModal` di halaman Produk) tetap memakai endpoint single `/api/stock/in` untuk koreksi cepat 1 produk

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

- `POST /api/stock/in` → `{product_id, qty, unit_buy_price, supplier_id?, supplier_name?, expiry_date?, note?}` → `200 {prev_stock, next_stock, average_cost, supplier_id}` — `average_cost` adalah HPP rata-rata baru hasil moving average; single-item, dipakai `QuickStockInModal`
- `POST /api/stock/in/bulk` → `{items: [{product_id, qty, unit_buy_price, expiry_date?}] (1-100), supplier_id?, supplier_name?, note?}` → `200 {items: [{product_id, prev_stock, next_stock, average_cost}], count, total_qty, supplier_id}` — satu transaksi DB untuk seluruh item; item invalid (produk tidak ditemukan) me-rollback seluruh batch; dipakai alur bulk Stock IN
- `POST /api/stock/out` → `{product_id, qty, type, note?, transaction_id?, return_reason?}` → `200 {next_stock}`
- `POST /api/stock/opname` → `{product_id, qty, note?}` → `200 {prev_stock, next_stock}`
- `GET /api/stock/logs?from&to&type&productId&limit&offset` → daftar log (staff)
- `GET /api/transactions/recent` → 100 transaksi 30 hari terakhir `[{id, customerName, totalAmount, createdAt}]` — **staff-accessible** (bukan admin-only), dipakai Return picker; filter dilakukan di klien

## Master Data — Suppliers

- `GET /api/suppliers?search=` → `200 [{id,name,phone,address}]`
- `POST /api/suppliers` → `{name, phone?, address?}` → `201 {id}`
- `DELETE /api/suppliers/:id` (admin) → validasi referensi stock_logs → `200 {deleted:true}` atau `400`; invalidate `suppliers:list:*`
