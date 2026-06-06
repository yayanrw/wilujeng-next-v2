# Rencana: Refactor Harga Beli, HPP, & Stok Produk

> Status: **DRAFT — belum dikerjakan**
> Dibuat: 2026-06-06
> Konteks: hasil brainstorming soal `products.buyPrice` yang dipakai ganda (referensi harga beli + dasar profit).

---

## 1. Latar Belakang & Masalah

`products.buyPrice` saat ini dipakai untuk **dua hal sekaligus**:

1. Referensi harga beli (input di form Product & pre-fill Stock In).
2. Dasar perhitungan COGS/profit di laporan.

Harga beli bisa naik/turun tiap pembelian, jadi pemakaian ganda ini bermasalah.

### Temuan kritis (dari pembacaan kode)

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| T1 | ~~`transaction_items.unitBuyPrice` sudah ada~~ **KOREKSI:** kolom itu ada di `stock_logs`, **bukan** `transaction_items`. Kolom `transaction_items.unit_buy_price` ditambahkan di STEP 1 (migrasi 0005). | `schema.ts:190` (stock_logs), `pos/checkout/route.ts:243` | Snapshot cost tidak tersimpan |
| T2 | COGS dihitung dari `products.buyPrice` **saat ini**, bukan snapshot | `reports/pnl/route.ts:32`, `dashboard/route.ts:53,85` | **Profit historis berubah** tiap harga beli berubah |
| T3 | Checkout sudah mengambil `p.buyPrice` ke tangan tapi tidak disimpan | `pos/checkout/route.ts:53,158,172` | Data sudah tersedia, tinggal di-insert |
| T4 | Stock In set `buyPrice = harga terakhir` (bukan rata-rata) | `stock/in/route.ts:74` | Tidak ada konsep HPP rata-rata |
| T5 | Create product & import menerima `buyPrice` + `stock` sebagai input manual | `products/route.ts:133-135` | Stok/harga bisa diubah tanpa audit trail |

### Keputusan desain (hasil brainstorming)

- **Pakai Moving Average Cost** (HPP rata-rata bergerak) — bukan FIFO (terlalu kompleks untuk skala retail ini).
- `buyPrice` **tidak dihapus**, tapi dipisah fungsinya:
  - `products.buyPrice` → harga beli **terakhir** (referensi/pre-fill).
  - `products.averageCost` (**baru**) → HPP rata-rata untuk profit.
  - `transaction_items.unitBuyPrice` → **snapshot** HPP saat transaksi (untuk profit historis yang stabil).
- Satu-satunya cara mengubah `buyPrice`/`stock` adalah lewat menu **Stock** (In/Out/Opname).
- Di form Product: `stock` & `buyPrice` jadi **read-only** (edit mode); saat **create** ada section "Stok Awal" opsional yang otomatis memicu Stock In.

### Rumus Moving Average

```
average_baru = (stok_lama × average_lama + qty_masuk × harga_beli_masuk)
               ÷ (stok_lama + qty_masuk)
```

Contoh: 100 unit @10.000 + 50 unit @12.000
→ (100×10.000 + 50×12.000) ÷ 150 = **10.667**

---

## 2. Arsitektur Target (3 Lapis)

```
LAPIS 1 — Akurasi COGS (snapshot)         ← fondasi, sekaligus fix bug T2
  • Checkout isi transaction_items.unitBuyPrice
  • PNL & Dashboard pakai snapshot (fallback ke products.buyPrice utk data lama)

LAPIS 2 — Moving Average Cost
  • Tambah products.averageCost
  • Stock In recalc averageCost
  • Checkout snapshot pakai averageCost

LAPIS 3 — UX Form Product
  • Create: hapus input stock/buyPrice → section "Stok Awal" opsional
  • Edit: stock/buyPrice/averageCost read-only + tombol +Stock
```

**Urutan pengerjaan mengikuti dependency**: Lapis 1 → 2 → 3. Tiap step bisa di-deploy & dites berdiri sendiri.

---

## 3. Langkah per Step

### STEP 1 — Snapshot cost saat checkout (fix bug akurasi)
**Tujuan:** Profit historis tidak lagi berubah saat harga beli berubah.

- **File:** `src/app/api/pos/checkout/route.ts`
- **Aksi:** Pada `insert(transactionItems)` (sekitar baris 243), tambahkan `unitBuyPrice: i.buyPrice`. Data `buyPrice` sudah tersedia di `lineItems`.
- **Catatan:** Item gratis (BxGy, `isFree`) tetap menyimpan `unitBuyPrice` agar COGS barang gratis terhitung benar.
- **Data lama (Opsi A — freeze, lihat §5):** sertakan backfill sekali jalan di migrasi agar transaksi lama berhenti "melayang":
  ```sql
  UPDATE transaction_items ti
  SET unit_buy_price = p.buy_price
  FROM products p
  WHERE ti.product_id = p.id
    AND ti.unit_buy_price IS NULL;
  ```
- **Verifikasi:** Checkout baru → cek row `transaction_items.unit_buy_price` terisi. Transaksi lama ter-freeze: ubah `buy_price` produk → profit historisnya **tidak berubah**.

---

### STEP 2 — Laporan pakai snapshot cost
**Tujuan:** PNL & Dashboard hitung COGS dari snapshot, bukan harga beli berjalan.

- **File:** `src/app/api/reports/pnl/route.ts`, `src/app/api/dashboard/route.ts` (3 query COGS)
- **Aksi:** Ganti `sum(qty * products.buyPrice)` →
  `sum(qty * coalesce(transaction_items.unit_buy_price, products.buy_price))`.
  Fallback `products.buyPrice` untuk transaksi lama yang `unitBuyPrice`-nya masih null.
- **Verifikasi:** Angka profit transaksi lama tetap; transaksi baru memakai snapshot. Ubah harga beli sebuah produk → profit historis **tidak berubah**.

---

### STEP 3 — Tambah kolom `averageCost`
**Tujuan:** Sediakan kolom HPP rata-rata.

- **File:** `src/db/schema.ts`, migrasi drizzle, `docs/prd/12-database-schema.md`
- **Aksi:**
  - Tambah `averageCost: integer('average_cost').notNull().default(0)` di tabel `products`.
  - `npm run db:generate` lalu `npm run db:migrate` (atau `db:push`).
  - **Backfill (keputusan: `averageCost = buyPrice`, lihat §5):** set untuk semua produk eksisting di file migrasi:
    ```sql
    UPDATE products SET average_cost = buy_price;
    ```
    Tidak merekonstruksi dari `stock_logs` karena `opname`/`out` membuat replay rawan salah; `buyPrice` terakhir adalah baseline terbaik dan otomatis terkoreksi pada Stock In berikutnya.
- **Verifikasi:** Kolom ada; produk lama `average_cost = buy_price` (bukan 0).

---

### STEP 4 — Stock In hitung Moving Average
**Tujuan:** `averageCost` ter-update tiap barang masuk.

- **File:** `src/app/api/stock/in/route.ts`, `docs/prd/07-stock.md`, `docs/prd/11-business-logic.md`
- **Aksi:** Dalam transaksi, sebelum update produk, hitung:
  ```
  nextAverage = round((prevStock × prevAverage + qty × unitBuyPrice) / (prevStock + qty))
  ```
  Jika `prevStock <= 0` → `nextAverage = unitBuyPrice`.
  Update `products` set `stock`, `buyPrice = unitBuyPrice` (terakhir), `averageCost = nextAverage`.
- **Verifikasi:** Skenario 100@10rb + 50@12rb → averageCost = 10.667.

---

### STEP 5 — Checkout snapshot pakai `averageCost`
**Tujuan:** COGS transaksi mencerminkan HPP rata-rata, bukan harga beli terakhir.

- **File:** `src/app/api/pos/checkout/route.ts`
- **Aksi:** Tarik `averageCost` di `select` produk (baris ~53); pada lineItems pakai `averageCost` (fallback `buyPrice` bila 0) sebagai `unitBuyPrice` yang disimpan di STEP 1.
- **Verifikasi:** `transaction_items.unit_buy_price` = averageCost produk saat itu.
- **Dependency:** butuh STEP 1, 3, 4.

---

### STEP 6 — ProductForm edit: read-only stock/buyPrice + averageCost
**Tujuan:** Stok & harga beli tidak bisa diubah manual; tampilkan HPP.

- **File:** `src/components/pages/products/ProductForm.tsx`, `ProductDto` type, i18n `en.json`/`id.json`, `docs/prd/06-products.md`
- **Aksi (edit mode):**
  - Ganti input `stock` & `buyPrice` jadi panel info read-only.
  - Tambah baris "Harga Pokok Rata-rata" (`averageCost`).
  - `minStockThreshold` **tetap** input (ini konfigurasi).
  - Tombol `+ Stock` (sudah ada) jadi cara satu-satunya menambah stok.
  - Pastikan API GET product mengembalikan `averageCost`.
- **Verifikasi:** Field stock/buyPrice tidak editable; averageCost tampil.

---

### STEP 7 — ProductForm create: section "Stok Awal" opsional
**Tujuan:** Buat produk + stok awal dalam satu alur.

- **File:** `src/components/pages/products/ProductForm.tsx`, `src/app/api/products/route.ts` (CreateSchema), i18n, `docs/prd/06-products.md`
- **Aksi:**
  - Hapus input `buyPrice` & `stock` dari create mode → ganti section collapsible **"Stok Awal (Opsional)"**: qty, harga beli, supplier, tgl expired, catatan (pola sama seperti Tier/BxGy section).
  - Flow submit: `POST /api/products` (stock=0, buyPrice=0) → jika stok awal diisi, lanjut `POST /api/stock/in` dengan productId baru.
  - Sesuaikan `CreateSchema`: `buyPrice`/`stock` default 0 (atau hapus dari input publik).
- **Verifikasi:** Buat produk dengan stok awal → stock, buyPrice, averageCost terisi via Stock In + ada audit di `stock_logs`.

---

### STEP 8 — Import produk konsisten
**Tujuan:** Import tidak melanggar aturan "harga/stok hanya dari Stock In".

- **File:** `src/app/api/products/import/route.ts`, `docs/prd/06-products.md`
- **Aksi (opsi, pilih saat eksekusi):**
  - (a) Tetap izinkan import set stok awal, tapi sekalian set `averageCost = buyPrice` + buat `stock_logs` tipe `in`; atau
  - (b) Import hanya master data (sku/nama/kategori/brand/harga jual), stok via Stock In terpisah.
- **Verifikasi:** Hasil import punya averageCost konsisten.

---

## 4. Ringkasan File Terdampak

| File | Step |
|---|---|
| `src/app/api/pos/checkout/route.ts` | 1, 5 |
| `src/app/api/reports/pnl/route.ts` | 2 |
| `src/app/api/dashboard/route.ts` | 2 |
| `src/db/schema.ts` + migrasi | 3 |
| `src/app/api/stock/in/route.ts` | 4 |
| `src/components/pages/products/ProductForm.tsx` | 6, 7 |
| `src/app/api/products/route.ts` | 7 |
| `src/app/api/products/[id]/route.ts` (GET kembalikan averageCost) | 6 |
| `src/app/api/products/import/route.ts` | 8 |
| `src/i18n/en.json` & `id.json` | 6, 7 |
| `docs/prd/{06,07,11,12}-*.md` | 3,4,6,7,8 |

---

## 5. Keputusan Penanganan Data Lama & Risiko

### Keputusan (final)

| Kategori | Pilihan | Alasan |
|---|---|---|
| **Produk lama → `averageCost`** | Backfill `average_cost = buy_price` (STEP 3) | Tidak ada catatan HPP historis yang andal; `buyPrice` baseline terbaik & terkoreksi otomatis saat Stock In berikutnya. |
| **Transaksi lama → COGS** | **Opsi A — Freeze sekali** di migrasi (STEP 1): `unit_buy_price = products.buy_price` untuk item `NULL` | Menghentikan "profit melayang" tanpa effort rekonstruksi. Pakai harga beli saat ini sebagai perkiraan, lalu dibekukan. |

> Opsi B (rekonstruksi historis dari `stock_logs` `in` terakhir sebelum tanggal transaksi) **ditolak** — effort tinggi untuk akurasi data yang sudah lewat. Bisa ditinjau ulang kalau ada kebutuhan audit ketat.

### Risiko & catatan

- **Pengaman runtime:** query laporan (STEP 2) tetap pakai `coalesce(unit_buy_price, products.buy_price)` jika ada item lolos backfill.
- **Akurasi data lama:** transaksi lama memakai harga beli **saat migrasi** sebagai perkiraan, bukan harga beli persis saat transaksi terjadi. Dapat diterima.
- **Backfill averageCost** wajib di STEP 3 agar produk lama tidak ber-HPP 0.
- **Integer rounding:** averageCost dibulatkan (`Math.round`) karena kolom `integer`. Akumulasi pembulatan kecil, dapat diterima untuk skala ini.
- **Idempotensi:** kedua backfill aman dijalankan ulang (hanya menyentuh baris `NULL` / nilai turunan).
- **Urutan deploy:** Lapis 1 (Step 1–2) aman dideploy lebih dulu sebagai bugfix murni, tanpa menunggu sisanya.

---

## 6. Status Pengerjaan

- [x] STEP 1 — Snapshot cost saat checkout (migrasi `0005_flippant_wonder_man.sql`)
- [x] STEP 2 — Laporan pakai snapshot cost (PNL + 2 query dashboard)
- [x] STEP 3 — Kolom averageCost + migrasi + backfill (migrasi `0006_tan_epoch.sql`)
- [ ] STEP 4 — Stock In moving average
- [ ] STEP 5 — Checkout snapshot pakai averageCost
- [ ] STEP 6 — ProductForm edit read-only + averageCost
- [ ] STEP 7 — ProductForm create section Stok Awal
- [ ] STEP 8 — Import konsisten
