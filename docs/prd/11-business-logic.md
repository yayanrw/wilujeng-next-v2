# Business Logic & Rules

## Tiering Harga (Grosir)

Algoritma **Best Match** pada `min_qty` terbesar:

1. Ambil semua tier untuk Produk X
2. Filter tier di mana `qty_beli >= min_qty`
3. Pilih tier dengan `min_qty` paling tinggi dari hasil filter
4. Jika tidak ada yang memenuhi → gunakan `base_price`

**Contoh:**
```
tiers: [{min_qty:1, price:10000}, {min_qty:10, price:9500}, {min_qty:50, price:9000}]
qty=12 → 9500
qty=49 → 9500
qty=50 → 9000
```

## Sistem Loyalitas

- **Konversi:** Rp1.000 = 1 Poin (floor/pembulatan ke bawah)
- **Trigger:** Hanya transaksi status `'lunas'`
- Pelunasan hutang → poin tambahan berdasarkan nominal bayar
- Retur → poin dikurangi sesuai nilai beli barang retur

## Alur Hutang

- Pelanggan wajib terdaftar (Nama & No. HP) sebelum metode Hutang
- Transaksi hutang: `total_debt += total_amount`
- Kurang bayar (partial): `total_debt += (total_amount - amount_received)`, `change = 0`
- Setiap pelunasan (parsial atau penuh) dicatat di tabel `debt_payments` dan mengurangi `total_debt`

## BXGY Promotions

- Cek promo aktif per item saat checkout
- Validasi tanggal: `valid_from ≤ today ≤ valid_to` (jika diisi)
- Kalkulasi: `multiplier = floor(qty / buy_qty)`, capped by `max_multiplier_per_tx`
- `free_qty_total = multiplier × free_qty`
- **Subtotal** tetap dihitung dari qty yang **dibayar** saja (qty gratis tidak masuk harga)
- Tiering dihitung lebih dulu, kemudian BXGY diterapkan

**Contoh:**
```
Promo: Beli 2 gratis 1, max_multiplier=2
qty=5 → multiplier=floor(5/2)=2 (capped 2) → free=2 → total qty=7, subtotal=5×price
```

## Stok

- Tidak boleh negatif; tolak transaksi jika stok kurang
- Semua mutasi (IN/OUT/OPNAME/RETURN) tercatat di `stock_logs`
- Atomik: transaksi & mutasi stok dalam satu DB transaction
