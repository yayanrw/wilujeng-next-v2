# Laporan

## Laporan Penjualan Harian

- Filter: tanggal, metode pembayaran (Cash, Transfer, QRIS, Card)
- Kolom: tanggal/waktu, ID transaksi, pelanggan, total, metode bayar, status
- Badge: Lunas (emerald), Hutang (red)
- Aksi: Cetak Struk (tab baru), View Detail (modal item)

## Laporan Stok Habis (Stock Alerts)

- Produk dengan stok `< min_stock_threshold`
- Text merah untuk stok kritis

## Laporan Hutang Piutang

- Pelanggan dengan `total_debt > 0`
- Text merah untuk nominal hutang
- Tombol "Detail": modal riwayat transaksi hutang per pelanggan

## Laporan Laba Rugi

- Formula: Total Penjualan − HPP (`buy_price × qty terjual`)
- Summary Cards: Total Sales, COGS, Gross Profit

## Laporan Pemasok

- Ringkasan per supplier: total qty masuk, total nilai pembelian
- Filter: rentang tanggal, supplier

## API

- `GET /api/reports/sales?date=YYYY-MM-DD&payment_method=` → `200 [{transaction_id, total_amount, payment_method, status, created_at, customer_name}]`
- `GET /api/reports/stock-low?threshold=` → `200 [{product_id, sku, name, stock}]`
- `GET /api/reports/receivables` → `200 [{customer_id, name, total_debt}]`
- `GET /api/reports/profit-loss?from=&to=` → `200 {total_sales, cogs, gross_profit}`
- `GET /api/reports/suppliers?from=&to=&supplier_id=` → `200 [{supplier_id, name, total_qty, total_value}]`
