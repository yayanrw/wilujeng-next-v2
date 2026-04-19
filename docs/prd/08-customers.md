# Manajemen Pelanggan

## Customer List

- Tabel dengan search (debounce 500ms), paginasi Load More
- Kolom: Nama, Telepon, Poin, Hutang, Aksi
- Sorting berdasarkan kolom: Nama, Poin, Hutang (Ascending/Descending)
- Badge: highlight pelanggan dengan hutang
- Action: edit (pensil), Pay Debt, Delete (sampah — admin only)

## Tambah/Edit Pelanggan

| Field | Keterangan |
|---|---|
| Nama | Wajib |
| Telepon | Wajib (untuk hutang) |
| Alamat | Opsional |
| Poin | Default 0 (Admin bisa reset) |

- Layout 2-kolom (grid), label uppercase tracking
- Toast sukses/gagal + auto-reset form

## Pembayaran Hutang

- Tombol "Pay Debt" di tabel utama dan panel edit
- Modal khusus: input nominal, metode, catatan
- Dicatat ke tabel `debt_payments`; otomatis kurangi `total_debt` pelanggan

## Loyalty Points

- Konversi: Rp1.000 = 1 Poin (pembulatan ke bawah)
- Trigger: HANYA transaksi status "Lunas"
- Pelunasan hutang → poin tambahan berdasarkan nominal bayar
- Retur → poin dikurangi sesuai nilai beli barang retur

## Soft Delete

- `is_active` (default `true`), `is_deleted` (default `false`)
- Delete: set `is_deleted=true` & `is_active=false` — admin only
- Pelanggan terhapus tidak muncul di list default
- Customer Picker di checkout hanya menampilkan pelanggan aktif & tidak terhapus
- Cache invalidation: `customers:list:*`

## API

- `GET /api/customers?search=` → `200 [{id,name,phone,points,total_debt}]`
- `POST /api/customers` → `{name, phone, address?}` → `201 {id}`
- `PATCH /api/customers/:id` → body subset → `200 {updated:true}`
- `PATCH /api/customers/:id/status` (admin) → `{isActive: boolean}` → `200 {updated:true, id}`
- `DELETE /api/customers/:id` (admin) → soft delete → `200 {deleted:true}`
