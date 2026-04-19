# Menu Kasir (Point of Sale)

## Layout

Full-height viewport; panel pencarian dan panel keranjang dapat di-scroll secara independen.

## Search & Filter (Split-Cache Strategy)

| Bucket | Data | Cache |
|---|---|---|
| Catalog | Nama, SKU, Kategori, Harga Dasar, Tiers | Redis TTL panjang; dimuat sekali ke Zustand |
| Stock | Stok produk (dinamis) | Redis TTL 10 detik; polling setiap 30 detik via `/api/pos/products/stocks` |

Seluruh pencarian dan filter kategori dilakukan **client-side** menggunakan data gabungan di memory (latensi nol).

## Product Discovery

- Search bar: Nama Produk atau SKU
- **Barcode Support:** Auto-focus search bar; SKU diakhiri `Enter` → produk otomatis masuk keranjang
- **Kategori:** Horizontal scroll button list
- Toggle: **List View** / **Card View**

## Keranjang Belanja (Cart)

- Item: `product_id, name, sku, qty, unit_price, subtotal`
- Validasi stok; prevent qty melebihi stok
- **Tiering Price Logic:** Harga satuan otomatis berubah berdasarkan total qty per item (lihat [business-logic.md](./09-business-logic.md))
- Toast saat produk ditambahkan (nama + qty)

## Checkout Modal

- **Customer Picker** (Autocomplete dropdown) di posisi paling atas; default "Walk-in"
- Metode Pembayaran: Tunai, QRIS, Transfer, Hutang
- **Quick Cash Buttons:** Exact, 1k, 2k, 5k, 10k, 20k, 50k, 100k, "Uang Pas"
- Kalkulasi kembalian (Change) dan outstanding debt real-time

### Skenario Pembayaran

| Skenario | Kondisi | Hasil |
|---|---|---|
| Kurang Bayar | `amount_received < total_amount` | `status='hutang'`, `outstanding_debt = total - received`, `change = 0`; wajib customer |
| Hutang Penuh | metode 'hutang' & `amount_received = 0` | `status='hutang'`, `outstanding_debt = total_amount`; wajib customer |
| Lunas | `amount_received >= total_amount` | `status='lunas'`, `change = received - total` |

- **Hutang Logic:** Wajib pilih pelanggan terdaftar; tombol "Add Pelanggan Baru" jika belum ada
- **Pay Debt Inline:** Kasir dapat melunasi hutang pelanggan langsung dari modal Checkout (sebagian atau penuh) + field catatan

## Post-Transaction

- Toast sukses
- Opsi "Cetak Struk" (Thermal Printer)
- Tombol "Selesai" → reset form

## API

- `GET /api/pos/search?query=&categoryId=&limit=&offset=` → `200 [{id, sku, name, price, stock, categoryId, categoryName, tiers[]}]`
- `GET /api/pos/promos?product_ids=[]` → `200 [{productId, buyQty, freeQty, validFrom, validTo, maxMultiplierPerTx}]`
- `POST /api/pos/checkout` → `{items:[{product_id, qty}], payment_method, amount_received?, customer_id?}`
  - Response: `200 {transaction_id, total_amount, paid_amount, change, status, outstanding_debt, printable:{store, items, totals, footer}}`
  - Error: `400/409` untuk stok tidak cukup
