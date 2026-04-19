# Pengaturan Sistem

## Branding Toko

| Field | Keterangan |
|---|---|
| Nama Toko | Text input (contoh: "Toko Wilujeng") |
| Ikon Toko | Icon Picker — pilih dari Lucide React (Store, ShoppingBag, Coffee, Utensils, Package, Printer); DB simpan string nama ikon |
| Alamat | Info kontak untuk header struk |
| Telepon | Info kontak untuk header struk |
| Footer Struk | Pesan footer (contoh: "Terima kasih telah berbelanja") |

- Cache: `store:settings` di Upstash Redis; invalidate saat update
- Branding muncul di: Sidebar/Navbar, Halaman Login, Header Struk Thermal

## Manajemen Pengguna (Admin only)

- List: search (debounce 500ms), Load More, kolom email/nama/role
- Tambah: wajib email + password
- Edit: ubah role atau nama
- Toast sukses/gagal + auto-reset form

## Profil Pengguna

- Route: `/profile` (via dropdown Top Bar)
- Update: Nama, Password (dengan konfirmasi)
- Email: read-only
- Toast validasi + notifikasi

## Appearance

- **Theme:** Light, Dark, System (next-themes; tersimpan lokal)
- **Bahasa:** English / Bahasa Indonesia (Zustand + persisted localStorage)
  - Teks dari `src/i18n/en.json` dan `src/i18n/id.json`
  - Rendered via custom hook `useTranslation`

## Master Data Tabs (di halaman Products/Inventory)

Tabs: **Brands**, **Categories**, **Suppliers** — delete only (admin)

Setiap tab:
- Kolom: Nama, Aksi (delete icon)
- Konfirmasi dialog sebelum delete
- Toast sukses/gagal; validasi referensi sebelum delete

## API

- `GET /api/settings` → `200 {store_name, store_icon_name, store_address, store_phone, receipt_footer}`
- `POST /api/settings` → body sama → `200 {updated:true}`
