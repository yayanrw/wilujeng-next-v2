# Implementation Plan: Flow Enhancement
> SimplePOS Pro — Berdasarkan analisis PRD  
> Scope: Section 1 — Flow yang Perlu Diperkuat

---

## 1. Summary

Terdapat 4 area flow utama yang perlu diperkuat sebelum development dimulai:

1. **Hutang & Pelunasan** — Schema tidak mendukung tracking pelunasan parsial per cicilan
2. **Loyalty Points** — Aturan pemberian poin pada transaksi hutang belum eksplisit
3. **Race Condition Stok** — Tidak ada mekanisme locking saat dua kasir checkout bersamaan
4. **Retur Barang** — Tidak ada flow return yang terhubung ke transaksi asal

Keempat area ini bukan blocker MVP secara keseluruhan, namun jika tidak ditangani dari awal akan menyebabkan **schema migration** dan **refactor logika bisnis** yang signifikan di kemudian hari.

---

## 2. Current State Analysis

### 2.1 Hutang & Pelunasan

- **Kondisi saat ini:** Hutang hanya direpresentasikan oleh field `total_debt` di tabel `customers` dan kolom `status` (`lunas`/`hutang`) di tabel `transactions`.
- **Gap:** Tidak ada tabel yang mencatat **riwayat pembayaran hutang per cicilan**. Ketika pelanggan melunasi hutang sebagian, tidak ada cara untuk mengetahui: hutang mana yang sudah dibayar, kapan dibayar, dan oleh kasir siapa.
- **Risiko:** Field `total_debt` bersifat denormalized — nilainya bisa out-of-sync jika ada bug di update logic. Tidak ada audit trail untuk rekonsiliasi.
- **Kontradiksi di PRD:** Section 3.3 menyebutkan fitur "Pay Debt Inline" sudah ada, namun Section 7.14 mencantumkan "Pelunasan hutang parsial & laporan detailnya" sebagai *di luar MVP*. Ini ambigu dan perlu keputusan eksplisit.

### 2.2 Loyalty Points

- **Kondisi saat ini:** Poin diberikan setelah transaksi berstatus `lunas` **atau** `hutang` berhasil disimpan (Section 4.2).
- **Gap:** Jika pelanggan bertransaksi hutang dan tidak pernah melunasinya, poin sudah diberikan padahal pembayaran belum terjadi. Tidak ada mekanisme untuk menarik kembali poin jika hutang tidak terlunasi.
- **Risiko:** Potensi abuse sistem loyalitas — pelanggan bisa akumulasi poin tanpa benar-benar membayar.

### 2.3 Race Condition Stok

- **Kondisi saat ini:** Validasi stok terjadi di dua tempat: saat produk ditambahkan ke cart (frontend) dan saat checkout (backend API).
- **Gap:** Tidak ada mekanisme **database-level locking**. Jika dua kasir melakukan checkout produk yang sama pada saat yang bersamaan, kedua request bisa lolos validasi stok karena keduanya membaca nilai stok yang sama sebelum salah satu sempat menguranginya.
- **Risiko:** Stok bisa menjadi negatif di database meskipun ada constraint `CHECK(stock >= 0)` — constraint ini akan throw error, tapi menyebabkan salah satu transaksi gagal secara tidak terduga tanpa error message yang jelas ke kasir.

### 2.4 Retur Barang

- **Kondisi saat ini:** Terdapat fitur **Stock Out manual** untuk pengurangan stok (barang rusak/retur), namun tidak terhubung ke transaksi asal manapun.
- **Gap:** Tidak ada flow "retur dari pelanggan" yang: menaikkan stok kembali, mengaitkan ke transaksi asal, dan menyesuaikan laporan penjualan/laba rugi.
- **Risiko:** Data laporan laba rugi bisa tidak akurat karena penjualan yang di-retur tetap tercatat sebagai revenue.

---

## 3. Proposed Changes

### 3.1 Hutang & Pelunasan

#### 3.1.1 Tambah Tabel `debt_payments`

Buat tabel baru untuk mencatat setiap aksi pembayaran hutang secara terpisah dari tabel transaksi.

```sql
CREATE TABLE debt_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  -- nullable: jika pembayaran untuk hutang spesifik satu transaksi
  transaction_id UUID NULL REFERENCES transactions(id),
  amount      INT NOT NULL CHECK(amount > 0),
  method      TEXT NOT NULL DEFAULT 'cash', -- cash, transfer, qris
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID NOT NULL REFERENCES users(id),
  note        TEXT NULL
);
```

#### 3.1.2 Update Logic `total_debt` di Tabel `customers`

Ubah strategi update `total_debt` agar selalu konsisten:

- **Saat transaksi berstatus `hutang`:** `total_debt += outstanding_debt` (dalam satu DB transaction)
- **Saat pembayaran hutang (`debt_payments` INSERT):** `total_debt -= amount` (dalam satu DB transaction)
- **Tambahkan endpoint reconcile** (admin only) yang menghitung ulang `total_debt` dari source of truth: `SUM(outstanding_debt) dari transactions WHERE status='hutang'` dikurangi `SUM(amount) dari debt_payments`.

#### 3.1.3 Klarifikasi Scope MVP untuk "Pay Debt Inline"

Tentukan secara eksplisit:

- **Opsi A (Recommended):** Pay Debt Inline di checkout hanya mendukung **pelunasan penuh** (`amount = total_debt`). Pelunasan parsial masuk roadmap post-MVP.
- **Opsi B:** Pay Debt Inline mendukung parsial, tapi wajib input nominal yang dibayarkan dan harus mencatat ke `debt_payments`.

Keputusan ini harus tercermin di PRD sebelum development dimulai.

---

### 3.2 Loyalty Points

#### 3.2.1 Ubah Trigger Pemberian Poin

Ubah aturan bisnis pemberian poin menjadi eksplisit:

```
BARU: Poin HANYA diberikan saat status transaksi = 'lunas'
      (amount_received >= total_amount pada saat checkout)

Untuk transaksi hutang yang kemudian dilunasi:
- Poin diberikan saat pembayaran hutang dicatat di debt_payments
  dan total_debt pelanggan mencapai 0 untuk transaksi tersebut
```

#### 3.2.2 Catat Riwayat Poin (Opsional tapi Direkomendasikan)

Tambahkan tabel `points_log` untuk audit trail poin:

```sql
CREATE TABLE points_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  transaction_id UUID NULL REFERENCES transactions(id),
  delta          INT NOT NULL, -- positif = tambah, negatif = kurang/reset
  reason         TEXT NOT NULL, -- 'transaction', 'debt_paid', 'admin_reset'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Ini memudahkan rekonsiliasi jika ada dispute poin dari pelanggan.

---

### 3.3 Race Condition Stok

#### 3.3.1 Implementasi `SELECT FOR UPDATE` di Checkout Handler

Di endpoint `POST /api/pos/checkout`, ubah query pengambilan stok produk menjadi:

```sql
-- Dalam satu DB transaction (BEGIN ... COMMIT)
SELECT id, stock FROM products
WHERE id = ANY($1)
FOR UPDATE;  -- lock rows sampai transaction selesai

-- Baru kemudian validasi dan UPDATE stok
UPDATE products SET stock = stock - $qty WHERE id = $id;
```

Pastikan seluruh operasi checkout (validasi stok, insert transaksi, insert items, update stok, update poin, update debt) berjalan dalam **satu database transaction atomik**.

#### 3.3.2 Error Handling yang Jelas untuk Konflik Stok

Jika `SELECT FOR UPDATE` menghasilkan stok tidak cukup setelah lock diperoleh, kembalikan response yang informatif:

```json
HTTP 409 Conflict
{
  "error": "stock_insufficient",
  "product_id": "...",
  "product_name": "...",
  "requested_qty": 5,
  "available_stock": 2,
  "message": "Stok tidak mencukupi. Stok tersedia: 2"
}
```

Frontend menampilkan pesan ini sebagai toast error yang actionable.

---

### 3.4 Retur Barang

#### 3.4.1 Tambah Flow Retur Minimal di Stock Out

Ubah form **Stock Out** agar mendukung referensi ke transaksi asal (opsional):

```sql
-- Tambah kolom di stock_logs (nullable agar backward compatible)
ALTER TABLE stock_logs ADD COLUMN transaction_id UUID NULL REFERENCES transactions(id);
ALTER TABLE stock_logs ADD COLUMN return_reason TEXT NULL; 
-- contoh: 'customer_return', 'damaged', 'expired'
```

#### 3.4.2 Tambah Tipe Log Retur

Tambahkan nilai baru ke enum `type` di `stock_logs`:

```sql
type ENUM('in', 'out', 'opname', 'return') NOT NULL
```

Sehingga Stock Out untuk retur pelanggan dibedakan dari Stock Out untuk barang rusak.

#### 3.4.3 Batasan Scope Retur untuk MVP

Untuk menjaga MVP tetap sederhana, retur **tidak** otomatis mengubah status transaksi asal atau mengembalikan uang. Flow retur MVP:

1. Kasir buka menu **Stock → Stock Out**
2. Pilih tipe: `return` (bukan `out`)
3. Input produk, qty, dan **Transaction ID asal** (opsional, untuk referensi)
4. Stok naik kembali dan log tercatat dengan `type = 'return'`
5. Penyesuaian keuangan (refund) dilakukan manual oleh Admin di luar sistem

Fitur refund otomatis dan koreksi laporan masuk roadmap post-MVP.

---

## 4. Assumptions & Decisions

| # | Topik | Keputusan | Alasan |
|---|-------|-----------|--------|
| 4.1 | Scope pelunasan hutang MVP | Pay Debt Inline hanya untuk **pelunasan penuh**. Parsial masuk post-MVP. | Menyederhanakan schema dan UI. Parsial membutuhkan tracking per-transaksi yang kompleks. |
| 4.2 | Trigger poin loyalitas | Poin **hanya** untuk transaksi `lunas`. Hutang yang dilunasi kemudian mendapat poin saat `debt_payments` dicatat. | Mencegah abuse dan memastikan poin hanya diberikan atas pembayaran nyata. |
| 4.3 | Race condition | Gunakan `SELECT FOR UPDATE` di level Supabase/PostgreSQL. Drizzle ORM mendukung `.for('update')` pada query. | Solusi paling reliable tanpa menambahkan infrastruktur baru. |
| 4.4 | Scope retur MVP | Retur hanya menaikkan stok, tidak otomatis adjust laporan keuangan atau refund. | Menjaga MVP tetap deliverable. Refund flow sangat kompleks dan jarang di konteks toko retail kecil. |
| 4.5 | `total_debt` denormalized | Tetap disimpan di `customers.total_debt` sebagai cache, tapi selalu diupdate dalam atomic DB transaction. Tambah endpoint reconcile untuk admin. | Performa baca lebih cepat, risiko out-of-sync dimitigasi dengan reconcile endpoint. |

---

## 5. Verification Steps

### 5.1 Hutang & Pelunasan

- [ ] Tabel `debt_payments` berhasil dibuat dengan semua constraint
- [ ] Transaksi hutang: `customers.total_debt` bertambah sebesar `outstanding_debt` — verifikasi di DB langsung
- [ ] Pay Debt: `debt_payments` row terbuat, `customers.total_debt` berkurang — verifikasi atomic (keduanya berhasil atau keduanya rollback)
- [ ] Endpoint reconcile mengembalikan nilai yang konsisten dengan kalkulasi manual dari `transactions` + `debt_payments`
- [ ] Jika DB transaction gagal di tengah jalan (simulasi error), tidak ada partial update yang tersimpan

### 5.2 Loyalty Points

- [ ] Transaksi `lunas`: poin bertambah sesuai formula `floor(total_amount / 1000)`
- [ ] Transaksi `hutang`: poin **tidak** bertambah saat checkout
- [ ] Setelah hutang dilunasi via `debt_payments`: poin baru bertambah
- [ ] Admin reset poin: `points_log` mencatat entry dengan `reason = 'admin_reset'` dan `delta` negatif

### 5.3 Race Condition Stok

- [ ] Simulasi dua request checkout bersamaan (produk sama, stok = 1) — hanya satu yang berhasil, satu mendapat response `409` dengan pesan informatif
- [ ] Verifikasi stok di DB tidak pernah negatif setelah berbagai skenario concurrent checkout
- [ ] Response error `409` menampilkan `product_name` dan `available_stock` yang akurat
- [ ] Toast error di frontend menampilkan pesan yang actionable (bukan generic "terjadi kesalahan")

### 5.4 Retur Barang

- [ ] Stock Out dengan tipe `return` berhasil menaikkan stok produk
- [ ] `stock_logs` mencatat entry dengan `type = 'return'`, `transaction_id` (jika diinput), dan `return_reason`
- [ ] Stock Out dengan tipe `out` (rusak) tidak terpengaruh oleh perubahan ini
- [ ] Filter Stock Log berdasarkan tipe `return` berfungsi di halaman Kelola Stok
---

## 6. UI/UX Enhancements

Following the backend logic strengthening, the UI/UX will be updated to expose these new capabilities to the users.

### 6.1 Debt Payment Notes (POS & Customers)
Allow cashiers to add context to debt payments (e.g., "Paid via sibling", "Partial payment for invoice X").

- **POS Checkout**: Add a `debtPaymentNote` field when a customer with outstanding debt is selected.
- **Customer Management**: Add a `note` field to the `PayDebtModal`.

### 6.2 Stock Return Flow (Stock Management)
Implement a dedicated flow for customer returns that increases stock and automatically adjusts loyalty points.

- **TransactionPicker**: A new autocomplete component to search and select past transactions using ID and Date.
- **Return Type**: A new toggle in the "Stock Out" tab to switch between standard manual stock-out and "Customer Return".
- **Refund/Point Reversal**: The system will fetch the original item price from the transaction history and deduct the corresponding loyalty points from the customer's balance automatically.

### 6.3 Verification
- [ ] POS Checkout saves `debtPaymentNote` to `debt_payments` table.
- [ ] Customer "Pay Debt" saves `note` to `debt_payments` table.
- [ ] Stock "Return" flow correctly increases stock and inserts a `points_log` entry with a negative delta (reason: 'return').