# Dashboard (Ringkasan Eksekutif)

## Widgets

- Total penjualan hari ini (Sales)
- Total transaksi hari ini (react-countup animation)
- Total laba bersih hari ini / Today Net Profit (react-countup animation)
- Jumlah produk stok menipis (di bawah threshold)
- Total piutang (hutang pelanggan) yang belum lunas
- Setiap widget menggunakan ikon Lucide React (ShoppingCart, TrendingUp, Banknote, dll)

## Grafik Laba Rugi (Sales & Profit Overview)

- AreaChart (Recharts): Revenue vs Net Profit
- Filter: Daily (7 hari), Weekly (4 minggu), Monthly (6 bulan)

## Tabel Ringkasan (Top Lists)

| Tabel | Deskripsi |
|---|---|
| Low Stock Items | 5 produk teratas dengan stok di bawah minimum |
| Top Receivables | 5 pelanggan dengan hutang (outstanding debt) tertinggi |
| Top Sales Products | 5 produk terlaris all-time berdasarkan qty terjual |
| Top Suppliers | Supplier teratas 30 hari terakhir berdasarkan total nilai pembelian stok masuk |

> Semua tabel ringkasan menggunakan desain "Card" dengan header `border-b` dan layout responsif.

## Query Logic

- Total penjualan hari ini: `SUM(total_amount) WHERE status='lunas' AND date=today`
- Stok menipis: `COUNT(products) WHERE stock <= min_stock_threshold`
- Total piutang: `SUM(customers.total_debt) WHERE total_debt > 0`
- Top Supplier 30 hari: `SUM(qty × unit_buy_price) FROM stock_logs WHERE type='in'` per supplier, desc
