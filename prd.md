Berikut adalah dokumen **Product Requirements Document (PRD)** yang komprehensif untuk aplikasi POS Anda. Dokumen ini disusun agar siap digunakan sebagai panduan teknis pengembangan menggunakan stack yang Anda tentukan.

---

# Product Requirements Document (PRD): SimplePOS Pro

## 1. Project Overview

**SimplePOS Pro** adalah aplikasi Point of Sale (POS) berbasis web yang dirancang untuk toko retail modern. Aplikasi ini fokus pada kecepatan transaksi kasir (mendukung barcode scanner), fleksibilitas harga (tiering/grosir), manajemen stok yang akurat, serta sistem loyalitas pelanggan.

### Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, shadcn/ui.
- **State Management:** Zustand (digunakan untuk mengelola state global seperti keranjang belanja, preferensi UI, dll).
- **Backend:** Next.js API Route Handlers.
- **Database:** Supabase (PostgreSQL).
- **ORM:** Drizzle ORM.
- **Authentication:** Better Auth.
- **Hardware Support:** Barcode Scanner (Keyboard emulation), Thermal Printer (Web Printing API/Window Print).
- **Deployment:** Vercel (Next.js).

---

## 2. User Roles & Permissions

| Role      | Deskripsi              | Izin Akses                                                                              |
| :-------- | :--------------------- | :-------------------------------------------------------------------------------------- |
| **Admin** | Pemilik toko / Manajer | Seluruh fitur termasuk manajemen user, laporan laba rugi, dan pengaturan sistem.        |
| **Kasir** | Staf operasional       | Transaksi kasir, manajemen stok, dan melihat data pelanggan. Tidak bisa mengelola user. |

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

- **Login Page:** Form email/username dan password.
- **No Registration:** User tidak dapat mendaftar sendiri. Data user dimasukkan melalui database seeding atau menu User Management oleh Admin.
- **Session Management:** Menggunakan Better Auth untuk proteksi route.

### 3.2 Dashboard (Ringkasan Eksekutif)

- **Widget Informasi:**
  - Total penjualan hari ini.
  - Jumlah produk dengan stok menipis (di bawah threshold).
  - Total piutang (hutang pelanggan) yang belum lunas.
  - Grafik transaksi mingguan/bulanan.
  - Top Supplier 30 hari (berdasarkan total nilai pembelian stok masuk).

### 3.3 Menu Kasir (Point of Sale)

- **Product Discovery:**
  - Search bar untuk Nama Produk atau SKU.
  - **Barcode Support:** Fokus otomatis pada search bar; ketika SKU di-scan (diakhiri karakter `Enter`), produk otomatis masuk ke keranjang.
  - **Kategori & Paginasi (Load More):**
    - Filter berdasarkan Kategori menggunakan daftar tombol kategori yang dapat digeser (horizontal scroll).
    - Menampilkan semua produk dengan sistem paginasi (menggunakan pendekatan tombol "Load More Products"). Default menampilkan 20 item per halaman.
  - Toggle tampilan: **List View** atau **Card View** (dengan gambar/ikon).
- **Keranjang Belanja (Cart):**
  - List produk, quantity, subtotal.
  - Pilihan Pelanggan: Default "Walk-in Customer".
  - **Tiering Price Logic:** Harga satuan otomatis berubah berdasarkan total Qty per item (Lihat Bagian 4.1).
  - Tampilkan toast sukses saat produk ditambahkan ke keranjang (menampilkan nama produk dan qty).
- **Checkout Modal:**
  - Metode Pembayaran: Tunai, QRIS, Transfer, Hutang.
  - **Quick Cash Buttons:** Tombol nominal cepat (2rb, 5rb, 10rb, 20rb, 50rb, 100rb) dan tombol "Uang Pas".
  - **Hutang Logic:** Jika memilih "Hutang", wajib memilih pelanggan terdaftar. Jika belum ada, tersedia tombol "Add Pelanggan Baru".
  - Perhitungan kembalian secara real-time; dukung skenario “kurang bayar”:
    - Kurang Bayar (Partial Payment): Jika amount_received < total_amount → wajib pilih pelanggan; status transaksi = 'hutang'; outstanding_debt = total_amount - amount_received; change = 0.
    - Hutang Penuh: Jika memilih metode 'Hutang' dan amount_received 0 → wajib pilih pelanggan; status = 'hutang'; outstanding_debt = total_amount; change = 0.
    - Lunas: Jika amount_received ≥ total_amount → status = 'lunas'; change = amount_received - total_amount.
- **Post-Transaction:** Muncul Toast sukses, opsi "Cetak Struk" (Thermal Printer), dan tombol "Selesai" untuk reset form.

### 3.4 Inventaris & Produk

- **List Produk:** Tabel dengan fitur search, menampilkan data produk dengan skema pagination (Load More Products). Ditambah dengan fitur Dropdown Filter berdasarkan Kategori dan Merk untuk memudahkan pencarian. Terdapat kolom "Action" dengan ikon pensil untuk mengedit atau melihat detail produk. Tombol "New" terintegrasi ke dalam panel "Edit/New Product" daripada header tabel utama.
- **Tambah/Edit Produk:**
  - Field: Nama, SKU/Barcode, Harga Beli, Harga Jual Dasar, Stok Awal.
  - **SKU Generator:** Tersedia tombol dengan ikon (dadu/Dices) di sebelah field SKU untuk membuat kode SKU acak secara otomatis (format `SKU-XXXXXXXX`).
  - **Dynamic Input (Typeahead/Autocomplete):** Input Merk dan Kategori menampilkan dropdown list berdasarkan teks yang diketik. Mendukung "Type to Create" (jika nama baru diketik dan dipilih dengan menekan Enter, otomatis tersimpan ke master data).
  - **Auto Reset Form & Toast:** Setelah berhasil menambah/mengedit produk, form akan otomatis di-reset, dan pesan keberhasilan (atau kegagalan) ditampilkan melalui Toast notification yang lebih bersih.
  - **Multi-Tier Pricing:** Form dinamis untuk menambah tier (Contoh: Beli ≥10 harga Rp9.500).

### 3.5 Kelola Stok

- **Stock Log:** Histori perubahan stok (Opname, In, Out). Dilengkapi dengan paginasi (Load More), filter berdasarkan rentang tanggal, penambahan kolom nama produk, serta kolom aksi untuk melihat detail histori (Modal Detail).
- **Stock Opname:** Fitur untuk menyesuaikan stok sistem dengan stok fisik (Replace quantity). Kolom pencarian produk menggunakan Autocomplete/Typeahead dropdown, dan ditambahkan input Brand yang menggunakan fitur serupa.
- **Stock Masuk (In):** Input stok baru, harga beli (bisa berbeda dari sebelumnya), Supplier (menggunakan fitur Autocomplete/Type to Create), Brand (menggunakan fitur Autocomplete/Type to Create), dan Tanggal Kadaluarsa. Kolom pencarian produk menggunakan Autocomplete/Typeahead dropdown.
- **Stock Keluar (Out):** Pengurangan stok manual (misal: barang rusak/retur). Kolom pencarian produk menggunakan Autocomplete/Typeahead dropdown, dan ditambahkan input Brand yang menggunakan fitur serupa.

### 3.6 Manajemen Pelanggan

- **List Pelanggan:** Tabel dengan fitur search (debounce 500ms), paginasi (Load More Customers), menampilkan nama, telepon, total poin, dan hutang. Terdapat kolom "Action" dengan ikon pensil untuk mengedit atau melihat detail pelanggan. Tombol "New" terintegrasi di dalam panel "Add/Edit customer" daripada header tabel utama.
- **Detail Pelanggan:**
  - Profil dan total debt/points.
  - Tabel history transaksi terakhir.
- **Loyalty Points:** Otomatis bertambah saat transaksi (Contoh: Rp1.000 = 1 Poin). Admin bisa mereset poin melalui fitur edit pelanggan.
- **Manajemen Pelanggan (Edit/Add):**
  - Form untuk membuat atau mengedit data pelanggan (Nama, Telepon, Alamat).
  - Terdapat Toast notification setelah operasi berhasil atau gagal, dengan auto reset form.

### 3.7 Laporan

- **Laporan Penjualan Harian:** Menampilkan daftar transaksi per hari. Dilengkapi dengan kolom tanggal/waktu transaksi, nama pelanggan, metode pembayaran, status, serta tombol "View Detail" untuk melihat rincian barang yang dibeli pada transaksi tersebut (Modal Detail Transaksi).
- **Laporan Stok Habis:** List produk yang stoknya 0 atau di bawah batas minimum.
- **Laporan Hutang Piutang:** Daftar pelanggan yang memiliki tunggakan (total debt). Dilengkapi dengan tombol "Detail" untuk melihat riwayat transaksi hutang pelanggan secara spesifik dalam sebuah modal.
- **Laporan Laba Rugi:** Perhitungan (Total Penjualan - Harga Pokok Penjualan).
- **Laporan Pemasok:** Ringkasan pemasukan stok per pemasok (total qty masuk, total nilai pembelian) dengan filter tanggal & supplier.

### 3.8 Pengaturan Sistem

Menu ini digunakan untuk menentukan identitas visual toko tanpa perlu mengunggah file serta mengelola pengguna sistem.

- **Branding Toko**:
  - **Nama Toko**: Input text (Contoh: "Toko Wilujeng").
  - **Ikon Toko (Icon Picker)**: Menampilkan visual ikon yang dapat dipilih secara langsung (bukan teks). Pilihan ikon dikurasi dari library **Lucide React** (misal: `Store`, `ShoppingBag`, `Coffee`, `Utensils`, `Package`, `Printer`). Database menyimpan string nama ikon.
  - **Info Kontak**: Alamat dan nomor telepon untuk header struk.
  - **Konfigurasi Struk**: Pesan footer (Contoh: "Terima kasih telah berbelanja").
- **Manajemen Pengguna (User Management)**:
  - **List Pengguna**: Tabel dengan fitur pencarian (debounce 500ms), paginasi (menggunakan tombol Load More), dan menampilkan email, nama, serta role pengguna. Terdapat kolom "Action" dengan ikon pensil untuk mengedit detail pengguna.
  - **Tambah/Edit Pengguna**: Form untuk menambah pengguna baru (membutuhkan email dan password) atau mengedit pengguna yang sudah ada (mengubah role atau nama). Dilengkapi dengan notifikasi Toast untuk setiap aksi sukses atau gagal, serta otomatis me-reset form setelah penambahan berhasil.

### 3.9 Menu Kasir & Struk

- **Branding**: Nama dan Ikon yang dipilih di Pengaturan akan muncul secara otomatis di:
  1. **Sidebar/Navbar** aplikasi (Sidebar dapat di-collapse/disembunyikan untuk memberikan ruang lebih luas di layar kasir. State toggle dikelola via Zustand).
  2. **Halaman Login**.
  3. **Header Struk Thermal** (Ikon akan dirender sebagai komponen SVG/Icon saat cetak).

---

## 4. Business Logic & Rules

### 4.1 Logika Harga Tiering (Grosir)

Sistem menggunakan metode **Best Match Match** pada `min_qty` terbesar.

- **Struktur Data:** `[{min_qty: 1, price: 10000}, {min_qty: 10, price: 9500}, {min_qty: 50, price: 9000}]`
- **Algoritma:** 1. Ambil semua tier untuk Produk X. 2. Filter tier di mana `qty_beli >= min_qty`. 3. Pilih tier dengan `min_qty` paling tinggi dari hasil filter tersebut. 4. Jika tidak ada yang memenuhi, gunakan `Harga Jual Dasar`.

### 4.2 Sistem Loyalitas

- **Konversi:** Setiap transaksi Rp1.000 mendapatkan 1 Poin (Pembulatan ke bawah).
- **Trigger:** Poin diperbarui sesaat setelah transaksi status "Lunas" atau "Hutang" berhasil disimpan.

### 4.3 Alur Hutang

- Pelanggan baru wajib terdaftar (Nama & No. HP) sebelum bisa mengambil metode pembayaran Hutang.
- Transaksi hutang akan menambah `total_debt` pada profil pelanggan.
- Kurang bayar (partial payment) menambah `total_debt` sebesar `total_amount - amount_received`; change = 0.

---

## 5. Database Schema (Conceptual)

### Tables:

1. **users**: `id, name, email, password, role (admin/kasir)`
2. **products**: `id, sku, name, category_id, brand_id, base_price, buy_price, stock, min_stock_threshold`
3. **product_tiers**: `id, product_id, min_qty, price`
4. **categories**: `id, name`
5. **brands**: `id, name`
6. **customers**: `id, name, phone, points, total_debt`
7. **transactions**: `id, customer_id, user_id, total_amount, payment_method, amount_received, change, status (lunas/hutang)`
8. **transaction_items**: `id, transaction_id, product_id, qty, price_at_transaction, subtotal`
9. **stock_logs**: `id, product_id, type (in/out/opname), qty, prev_stock, next_stock, note, expiry_date, supplier_id, unit_buy_price`
10. **settings**: `id, store_name, store_icon_name, store_address, store_phone, receipt_footer`
11. **suppliers**: `id, name, phone, address`

---

## 6. Non-Functional Requirements

- **UI/UX Design:** Desain antarmuka (UI) harus modern dan minimalis, dengan memanfaatkan komponen shadcn/ui dan utility class Tailwind CSS. Fokus pada scannability, hierarchy visual yang jelas, serta micro-interactions (animasi transisi halus) untuk meningkatkan pengalaman pengguna (UX).
- **Responsive Design:** Dioptimalkan untuk Desktop (Kasir) dan Tablet. Aplikasi harus memiliki **Sidebar yang dapat di-collapse (hide/show)** untuk memberikan ruang kerja yang lebih luas pada layar kasir. Halaman POS dikonfigurasi menggunakan _full height_ viewport agar keranjang belanja dan hasil pencarian dapat di-scroll secara independen tanpa perlu melakukan scroll pada halaman keseluruhan.
- **Performance:** Transaksi kasir harus tetap responsif dengan >1000 SKU menggunakan _client-side searching_ atau _SWR indexing_.
- **Offline Resilience:** Opsional, namun disarankan menggunakan _Optimistic Updates_ pada UI keranjang.
- **Security:** Proteksi API Routes sehingga kasir tidak bisa mengakses endpoint laporan laba rugi atau manajemen user.

---

## 7. Spesifikasi Detil (MVP)

### 7.1 Tujuan & KPI

- Kecepatan kasir: scan→item masuk cart ≤ 300ms; checkout normal ≤ 5 detik.
- Kinerja pencarian: respons < 100ms untuk katalog 1.000+ SKU pada perangkat kasir modern.
- Akurasi stok: tidak pernah negatif; setiap mutasi tercatat di stock_logs.
- Ketersediaan cetak: struk termal 58mm via window\.print dengan CSS cetak.

### 7.2 Personas & User Stories

- Admin:
  - Mengelola produk, kategori, merk.
  - Melakukan stok masuk/keluar/opname dan audit histori.
  - Mengelola pelanggan dan melihat laporan.
  - Mengatur branding toko (nama, ikon, kontak, footer struk).
- Kasir:
  - Mencari/men-scan produk, menambah ke keranjang, mengubah qty, menghapus item.
  - Checkout dengan tunai/QRIS/transfer/hutang, cetak struk.
  - Menambah pelanggan baru saat checkout hutang.

### 7.3 Matriks Role & Izin

| Modul/Fungsi              | Admin | Kasir |
| :------------------------ | :---: | :---: |
| Login/Logout              |   ✔   |   ✔   |
| Lihat Dashboard           |   ✔   |   ✔   |
| POS: Search/Scan          |   ✔   |   ✔   |
| POS: Checkout             |   ✔   |   ✔   |
| POS: Cetak Struk          |   ✔   |   ✔   |
| Produk: Lihat             |   ✔   |   ✔   |
| Produk: Tambah/Edit/Hapus |   ✔   |   ✖   |
| Stok: IN/OUT/OPNAME       |   ✔   |   ✔   |
| Pelanggan: Lihat          |   ✔   |   ✔   |
| Pelanggan: Tambah/Edit    |   ✔   |   ✔   |
| Laporan: Semua            |   ✔   |   ✖   |
| Pengaturan Sistem         |   ✔   |   ✖   |

Catatan: Implementasi RBAC di level API Route Handlers dan server components; sidebar menyesuaikan izin.

### 7.4 Alur Fungsional per Modul

- Authentication & Authorization
  - Login via email/username + password (Better Auth).
  - Session TTL default; proteksi route privat; redirect login jika belum autentikasi.
- Dashboard
  - Total penjualan hari ini: sum total_amount status ‘lunas’ by date(now).
  - Stok menipis: count products stock ≤ min_stock_threshold.
  - Total piutang: sum customers.total_debt > 0.
  - Grafik transaksi: agregasi harian/mingguan.
  - Top Supplier 30 hari: agregasi nilai pembelian (sum(qty×unit_buy_price) dari log type='in') per supplier, urutan desc.
- POS
  - Pencarian/Scan:
    - Input fokus otomatis; barcode scanner mengirimkan teks diakhiri Enter → tambahkan SKU ke cart.
    - Debounce 100–150ms untuk ketikan manual; filter by kategori opsional.
  - Keranjang:
    - Item: product_id, name, sku, qty, unit_price, subtotal.
    - Validasi stok cukup; prevent qty melebihi stock.
    - Tiering harga otomatis berdasarkan qty (lihat 4.1).
  - Checkout:
    - Metode: tunai, QRIS, transfer, hutang.
    - Quick cash (2k–100k) + Uang Pas; kalkulasi kembalian real‑time.
    - Hutang: wajib pilih pelanggan terdaftar; jika belum ada → tambah cepat minimal Nama & No. HP.
    - Kurang Bayar (Partial Payment):
      • Jika amount_received < total_amount → status='hutang', outstanding_debt=total_amount-amount_received, change=0; wajib customer.
      • Payment method boleh 'cash'/'qris'/'transfer', namun status tetap 'hutang' ketika masih ada outstanding_debt.
    - Hutang Penuh:
      • Jika memilih 'hutang' dan amount_received 0 → status='hutang', outstanding_debt=total_amount; wajib customer.
    - Lunas:
      • Jika amount_received ≥ total_amount → status='lunas', change=amount_received - total_amount.
  - Post-Transaction:
    - Simpan transaksi dan item, mutasi stok, update loyalti, update total_debt (jika hutang).
    - Tampilkan toast sukses, opsi Cetak Struk, tombol Selesai untuk reset.
- Inventaris & Produk
  - Produk:
    - Field wajib: name, sku(unique), base_price≥0, buy_price≥0, stock≥0, min_stock_threshold≥0.
    - Dynamic input kategori/merk (auto-create jika belum ada).
    - Multi-tier pricing: tambah baris {min_qty>0, price>0}; validasi unique per min_qty.
  - Kelola Stok:
    - IN: tambah qty, unit_buy_price, supplier (Type to Create), expiry_date opsional; simpan keterkaitan supplier_id pada log IN.
    - OUT: kurangi qty untuk rusak/retur, catat note.
    - OPNAME: set absolute quantity; log prev/next_stock.
- Pelanggan
  - Field: name, phone, address(optional), points default 0, total_debt default 0.
  - Riwayat: transaksi, poin, hutang belum lunas.
- Laporan
  - Penjualan Harian: filter tanggal; kolom tanggal/waktu, ID transaksi, pelanggan, total, metode bayar, status, dan tombol aksi untuk melihat detail item.
  - Stok Habis: list produk stock=0 atau ≤ threshold.
  - Hutang Piutang: pelanggan dengan total_debt>0, beserta aksi untuk melihat history transaksi pelanggan.
  - Laba Rugi: total penjualan – HPP (agregasi dari buy_price×qty terjual).
- Pengaturan
  - Branding: store_name, store_icon_name (string Lucide, kurasi), store_address, store_phone, receipt_footer.
  - Dampak: sidebar/login/header struk menampilkan branding.

### 7.5 Aturan Bisnis & Edge Cases

- Tiering Harga:
  - Pilih tier dengan min_qty tertinggi yang ≤ qty item; jika tidak ada, pakai base_price.
  - Contoh: tiers \[1:10000, 10:9500, 50:9000]; qty=12 → 9500; qty=49 → 9500; qty=50 → 9000.
- Loyalti:
  - 1 poin per Rp1.000 (pembulatan ke bawah) dari total_amount; update setelah transaksi tersimpan.
- Hutang:
  - Hanya untuk pelanggan terdaftar; menambah total_debt = total_amount; pelunasan parsial/final dicatat sebagai pengembangan lanjutan.
- Stok:
  - Tidak boleh negatif; tolak transaksi jika stok kurang; semua mutasi tercatat di stock_logs.

### 7.6 Skema Database (Rinci)

- users
  - id UUID PK, name TEXT, email TEXT UNIQUE, password_hash TEXT, role ENUM('admin','kasir'), created_at TIMESTAMPTZ default now()
- categories
  - id UUID PK, name TEXT UNIQUE
- brands
  - id UUID PK, name TEXT UNIQUE
- products
  - id UUID PK, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category_id UUID FK→categories(id), brand_id UUID FK→brands(id),
    base_price INT NOT NULL CHECK(base_price>=0), buy_price INT NOT NULL CHECK(buy_price>=0),
    stock INT NOT NULL CHECK(stock>=0), min_stock_threshold INT NOT NULL DEFAULT 0 CHECK(min_stock_threshold>=0),
    created_at TIMESTAMPTZ default now(), updated_at TIMESTAMPTZ default now()
- product_tiers
  - id UUID PK, product_id UUID FK→products(id) ON DELETE CASCADE, min_qty INT NOT NULL CHECK(min_qty>0),
    price INT NOT NULL CHECK(price>0), UNIQUE(product_id, min_qty)
- customers
  - id UUID PK, name TEXT NOT NULL, phone TEXT, address TEXT, points INT NOT NULL DEFAULT 0 CHECK(points>=0),
    total_debt INT NOT NULL DEFAULT 0 CHECK(total_debt>=0), created_at TIMESTAMPTZ default now()
- transactions
  - id UUID PK, customer_id UUID NULL FK→customers(id), user_id UUID FK→users(id),
    total_amount INT NOT NULL CHECK(total_amount>=0),
    payment_method ENUM('cash','qris','transfer','hutang') NOT NULL,
    amount_received INT NULL, change INT NULL DEFAULT 0,
    status ENUM('lunas','hutang') NOT NULL,
    created_at TIMESTAMPTZ default now()
- transaction_items
  - id UUID PK, transaction_id UUID FK→transactions(id) ON DELETE CASCADE, product_id UUID FK→products(id),
    qty INT NOT NULL CHECK(qty>0), price_at_transaction INT NOT NULL CHECK(price_at_transaction>=0),
    subtotal INT NOT NULL CHECK(subtotal>=0)
- stock_logs
  - id UUID PK, product_id UUID FK→products(id),
    type ENUM('in','out','opname') NOT NULL, qty INT NOT NULL CHECK(qty>=0),
    prev_stock INT NOT NULL CHECK(prev_stock>=0), next_stock INT NOT NULL CHECK(next_stock>=0),
    note TEXT NULL, expiry_date DATE NULL,
    supplier_id UUID NULL FK→suppliers(id),
    unit_buy_price INT NULL CHECK(unit_buy_price>=0),
    created_at TIMESTAMPTZ default now()
- suppliers
  - id UUID PK, name TEXT UNIQUE NOT NULL, phone TEXT NULL, address TEXT NULL, created_at TIMESTAMPTZ default now()
- settings
  - id UUID PK, store_name TEXT, store_icon_name TEXT, store_address TEXT, store_phone TEXT, receipt_footer TEXT, updated_at TIMESTAMPTZ default now()
- Indeks yang direkomendasikan:
  - products(sku), products(category_id), products(brand_id)
  - product_tiers(product_id, min_qty)
  - transactions(created_at), transactions(status), transaction_items(transaction_id)
  - stock_logs(product_id, created_at), stock_logs(supplier_id, created_at)
  - suppliers(name)

### 7.7 Kontrak API (Next.js Route Handlers)

- Autentikasi
  - POST /api/auth/login → {email, password} → 200 {user, session} | 401
  - POST /api/auth/logout → 204
- Produk
  - GET /api/products?search=\&category_id=\&brand_id= → 200 \[{id,sku,name,category,brand,base_price,stock,tiers\[]}]
  - POST /api/products → body {sku,name,category_id?,brand_id?,base_price,buy_price,stock,min_stock_threshold,tiers\[]} → 201 {id}
  - PATCH /api/products/:id → body subset field → 200 {updated:true}
- Stok
  - POST /api/stock/in → {product_id, qty, unit_buy_price, supplier_id?, supplier_name?, expiry_date?, note?} → 200 {next_stock, supplier_id}
  - POST /api/stock/out → {product_id, qty, note} → 200 {next_stock}
  - POST /api/stock/opname → {product_id, qty, note?} → 200 {prev_stock, next_stock}
- Pemasok
  - GET /api/suppliers?search= → 200 \[{id,name,phone,address}]
  - POST /api/suppliers → {name, phone?, address?} → 201 {id}
- POS
  - GET /api/pos/search?query=\&categoryId=\&limit=\&offset= → 200 \[{id, sku, name, price, stock, categoryId, categoryName, tiers\[]}]
  - POST /api/pos/checkout → {items:\[{product_id, qty}], payment_method, amount_received?, customer_id?} →
    - Validasi:
      • Jika amount_received < total_amount → customer_id wajib; status='hutang'.
      • Jika payment_method='hutang' dan amount_received 0 → customer_id wajib; status='hutang'.
      • Jika amount_received ≥ total_amount → status='lunas'; change = amount_received - total_amount.
    - Response 200: {transaction_id, total_amount, paid_amount, change, status, outstanding_debt, printable:{store, items, totals, footer}}
    - 400/409 untuk validasi stok tidak cukup
- Pelanggan
  - GET /api/customers?search= → 200 \[{id,name,phone,points,total_debt}]
  - POST /api/customers → {name, phone, address?} → 201 {id}
- Laporan
  - GET /api/reports/sales?date=YYYY-MM-DD → 200 \[{transaction_id, total_amount, payment_method, status, created_at}]
  - GET /api/reports/stock-low?threshold= → 200 \[{product_id, sku, name, stock}]
- Pengaturan
  - GET /api/settings → 200 {store_name, store_icon_name, store_address, store_phone, receipt_footer}
  - POST /api/settings → body yang sama → 200 {updated:true}
- Konvensi error: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error).

### 7.8 Peta UI & Komponen

- Rute: /login, / (dashboard), /pos, /products, /stock, /customers, /reports, /settings.
- Komponen inti (shadcn/ui): Button, Input, Select, Dialog, Sheet, Table, Toast, Badge. Desain modern minimalis dengan sidebar dapat di-collapse.
- POS: ProductSearch, ProductList, CartPanel, CartItem, CheckoutModal, QuickCash, ReceiptView.
- State Management: **Zustand** digunakan secara eksklusif untuk state global (contoh: state keranjang belanja, toggle sidebar, dan status UI global lainnya) guna memberikan reaktivitas tinggi dan mengurangi _prop-drilling_.
- Data Fetching: SWR untuk data fetch/caching; tindakan POS dapat memakai server actions atau API + optimistik update untuk UX cepat.
- Stok Masuk: SupplierSelect dengan dukungan Type‑to‑Create (ketik nama + Enter untuk membuat pemasok baru).

### 7.9 Integrasi Perangkat Keras

- Barcode Scanner:
  - Keyboard emulation; input fokus default; proses saat Enter.
  - Debounce input manual; tampilkan feedback audio/visual saat item masuk cart.
- Thermal Printer:
  - Layout 58mm (CSS @media print); opsi 80mm sebagai catatan masa depan.
  - Header: store_name + ikon (render SVG Lucide); alamat/telepon; tanggal/waktu.
  - Body: daftar item {name, qty × unit_price = subtotal}; total; payment_method; change; status.
  - Footer: receipt_footer dari settings.

### 7.10 Non-Fungsional (Target Terukur)

- Kinerja: search < 100ms, update cart < 50ms, first load POS < 2s pada koneksi lokal.
- Reliabilitas: transaksi & mutasi stok atomic (transaksi DB).
- Keamanan: batasi akses API berdasarkan role; hindari logging data sensitif; audit untuk stok & transaksi.
- Aksesibilitas: navigasi keyboard, fokus jelas, label terdeskripsi.

### 7.11 Acceptance Criteria

- Scan SKU menambahkan item ke cart otomatis dan menampilkan harga sesuai tier.
- Checkout tunai menghasilkan change yang benar; transaksi tercatat; stok berkurang; poin bertambah.
- Partial payment: tagihan Rp12.000, bayar Rp10.000 → status 'hutang', outstanding_debt Rp2.000, customers.total_debt bertambah Rp2.000, change=0.
- Hutang penuh: tagihan Rp12.000, bayar Rp0 → status 'hutang'; outstanding_debt Rp12.000; wajib pilih pelanggan.
- Laporan penjualan harian menampilkan transaksi yang sesuai filter tanggal.
- Pengaturan branding tercermin di sidebar, halaman login, dan header struk.
- Stok Masuk: saat mengetik nama pemasok baru, sistem membuat pemasok di master dan mengaitkan log IN dengan supplier_id tersebut.
- Laporan Pemasok: ringkasan periode menampilkan total qty dan total nilai pembelian per pemasok sesuai data log IN.
- Dashboard: widget “Top Supplier 30 hari” muncul dan menghitung berdasarkan sum(qty×unit_buy_price) dari log type='in'.

### 7.12 Rencana Test

- Unit: fungsi tiering, kalkulasi change, perhitungan poin, validator stok.
- Integration:
  - POST /api/pos/checkout ‘lunas’ (amount_received ≥ total).
  - POST /api/pos/checkout partial payment (amount_received < total): verifikasi status='hutang', outstanding_debt, update customers.total_debt.
  - POST /api/pos/checkout hutang penuh (amount_received=0): verifikasi kewajiban customer_id.
  - Stok IN: type‑to‑create pemasok (supplier_name baru) → pemasok dibuat, log mencatat supplier_id dan unit_buy_price.
  - Laporan pemasok: agregasi qty dan nilai pembelian sesuai filter tanggal & supplier.
  - Stok OUT/OPNAME, proteksi route.
- E2E (opsional): alur scan→cart→checkout→print dengan data dummy.

### 7.13 Glosarium

- SKU: Kode unik produk yang dipakai untuk scan & pencarian.
- Tiering: Skema harga bertingkat berbasis qty item.
- OPNAME: Penyesuaian stok agar sesuai fisik; replace quantity.
- Hutang: Metode pembayaran yang menambah total_debt pelanggan.

### 7.14 Ruang Lingkup Lanjutan (Di Luar MVP)

- Pajak (include/exclude), diskon per item/transaksi, varian produk.
- Pelunasan hutang parsial & laporan detailnya.
- Multi-cabang, gudang, transfer stok antar cabang.
