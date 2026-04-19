# Non-Functional Requirements

## Performance Targets

| Metric | Target |
|---|---|
| Search response | < 100ms untuk 1.000+ SKU |
| Cart update | < 50ms |
| POS first load | < 2s pada koneksi lokal |
| Scan→cart | ≤ 300ms |
| Checkout | ≤ 5 detik |

## Caching Architecture (Upstash Redis)

| Key Pattern | Data | Strategy |
|---|---|---|
| `system:setup_complete` | Status instalasi admin | Permanent setelah setup |
| `store:settings` | Branding & kontak toko | Invalidate saat update settings |
| `products:catalog:*` | Katalog produk | Invalidate saat add/edit/delete produk |
| `pos:stocks:*` | Stok dinamis | TTL 10 detik; polling 30 detik |
| `categories:list:*` | Master kategori | Pattern invalidation saat add/delete |
| `brands:list:*` | Master merk | Pattern invalidation saat add/delete |
| `suppliers:list:*` | Master supplier | Pattern invalidation saat add/delete |
| `customers:list:*` | List pelanggan | Invalidate saat add/edit/delete |

## UI/UX

- Desain modern minimalis (shadcn/ui + Tailwind)
- Navigation Progress Bar saat berpindah halaman
- Action buttons selalu tampil (tidak hidden on hover)
- Sidebar dapat di-collapse (Zustand state)
- Responsive: Desktop (utama) & Tablet
- Dark mode: semua komponen `dark:` prefix

## Security

- RBAC di level API Route Handlers dan server components
- Kasir tidak bisa akses laporan laba rugi atau manajemen user
- Tidak logging data sensitif

## Reliability

- Transaksi & mutasi stok atomik (DB transaction)
- Stok tidak boleh negatif

## Accessibility

- Navigasi keyboard
- Fokus jelas
- Label deskriptif, `sr-only` untuk screen reader

## Hardware

- **Barcode Scanner:** Keyboard emulation; proses saat Enter; debounce 100-150ms manual input
- **Thermal Printer:** Layout 58mm (`@media print`); Header: store_name + ikon SVG, alamat, telepon, tanggal/waktu; Body: item list; Footer: `receipt_footer`
