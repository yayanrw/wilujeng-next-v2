# Rencana Fitur: Promo Beli X Gratis Y (Buy X Get Y)

## Ringkasan
- Kebutuhan: Mendukung promo di mana pembeli mendapat produk gratis ketika membeli kuantitas tertentu dari produk yang sama, contoh: beli 2 gratis 1 (total kirim 3), beli 4 gratis 2 (total kirim 6).
- Keputusan: TIDAK memasukkan ke “tiering harga” karena tiering mengubah harga satuan berdasarkan qty berbayar. Promo Beli X Gratis Y lebih aman sebagai fitur terpisah agar:
  - Harga dan revenue dihitung hanya atas barang berbayar.
  - Stok berkurang sesuai total barang dikirim (berbayar + gratis).
  - Bukti transaksi/struk dan laporan PNL tetap akurat (COGS akan menghitung seluruh barang keluar, termasuk gratis).

## Kondisi Saat Ini
- Tiering (utils/tier-pricing.ts) menentukan unitPrice berdasarkan qty item; subtotal = unitPrice × qty.
- POS Checkout API (/src/app/api/pos/checkout/route.ts) menghitung unitPrice per item dari tiering dan mengurangi stok sesuai qty item.
- Tidak ada konsep “free item” yang dipisahkan dari item berbayar. Menyisipkan free di qty akan:
  - Menurunkan harga satuan (tier) secara tidak tepat.
  - Mengacaukan pencatatan pendapatan.

## Desain Solusi
### 1) Model Data
- Buat tabel baru: product_bxgy_promos
  - id (uuid, pk)
  - productId (uuid, fk → products.id)
  - buyQty (int > 0): X
  - freeQty (int ≥ 0): Y
  - active (boolean) default true
  - validFrom (timestamp, nullable)
  - validTo (timestamp, nullable)
  - maxMultiplierPerTx (int, nullable): batas kelipatan promo per transaksi (opsional, contoh: maksimal 3 kali).
  - Unique (productId, buyQty, freeQty, validFrom, validTo) secukupnya untuk mencegah duplikasi aturan yang sama.

Catatan: Satu produk bisa punya 1 aturan aktif. Versi lanjutan dapat mendukung banyak aturan + prioritas.

### 2) Aturan Hitung Promo (Server-Side)
- Diterapkan di API Checkout (server) agar sumber kebenaran berada di server, bukan UI.
- Definisi:
  - qtyPaid = jumlah yang dibayar pelanggan (input dari client).
  - multiplier = floor(qtyPaid / buyQty).
  - freeQtyComputed = multiplier × freeQty, dibatasi oleh maxMultiplierPerTx jika ada.
  - qtyDelivered = qtyPaid + freeQtyComputed.
- Harga:
  - unitPrice dihitung via tiering dengan qtyPaid (bukan qtyDelivered).
  - subtotal = unitPrice × qtyPaid.
  - Baris gratis dimasukkan sebagai transaction_item terpisah dengan unitPrice=0, subtotal=0, qty=freeQtyComputed.
- Stok:
  - Validasi stok saat checkout: stock ≥ qtyDelivered.
  - Pengurangan stok: qtyDelivered (berbayar + gratis).
- Pencatatan transaksi:
  - Buat 2 baris transaction_items untuk produk yang terkena promo:
    - Baris berbayar: qty=qtyPaid, price_at_transaction=unitPrice, subtotal>0.
    - Baris gratis: qty=freeQtyComputed, price_at_transaction=0, subtotal=0.
  - Produk tanpa promo atau qtyPaid < buyQty → hanya baris berbayar.

### 3) Interaksi dengan Tiering
- Tiering tetap berlaku pada qtyPaid saja, sehingga harga satuan tidak bias oleh barang gratis.
- Contoh (dari requirement):
  - Harga 1 pcs = 2.500
  - Beli 2 pcs → gratis 1 pcs. qtyPaid=2 → unitPrice=2.500 → subtotal=5.000. freeQtyComputed=1 → total keluar 3.
  - Beli 4 pcs → gratis 2 pcs. qtyPaid=4 → subtotal=10.000. freeQtyComputed=2 → total keluar 6.

### 4) Perubahan API & Alur Checkout
- Input client POS tetap mengirim items { productId, qty } dengan qty=qtyPaid.
- Server:
  1. Muat promo aktif untuk produk terkait (join / query product_bxgy_promos yang valid date & active).
  2. Hitung freeQtyComputed per item.
  3. Validasi stok terhadap qtyPaid + freeQtyComputed.
  4. Hitung unitPrice berdasarkan tiering dengan qtyPaid.
  5. Buat line item berbayar dan jika ada, line item gratis (0 price).
  6. Insert transactions + transaction_items; kurangi stok dengan qtyDelivered.
  7. Response printable menampilkan kedua baris (berbayar dan gratis).

### 5) UI/UX (MVP)
- Tidak perlu mengubah form produk utama untuk MVP; namun disarankan menambahkan panel kecil di ProductForm:
  - “Promo Beli X Gratis Y”: input BuyQty, FreeQty, Active, Valid From/To, Max Multiplier (opsional).
  - Validasi: buyQty>0, freeQty≥0; jika freeQty=0, nonaktifkan promo.
- Cart dan struk:
  - Tampilkan baris gratis sebagai item dengan label “FREE” atau badge khusus, harga 0.
  - Contoh pada struk: “Kecap ABC (FREE) × 1 → Rp0”.

### 6) Laporan & PNL
- Revenue hanya dari subtotal baris berbayar (sudah otomatis karena baris gratis subtotal=0).
- COGS di dashboard menggunakan sum(transactionItems.qty × products.buyPrice) → sudah mencakup baris gratis, sehingga margin tercermin benar.

### 7) Edge Cases & Validasi
- Jika stok hanya cukup untuk qtyPaid tapi tidak cukup untuk free, transaksi ditolak (409) dengan pesan “Insufficient stock (includes free items)”. Alternatif opsi lanjutan: kurangi multiplier hingga stok cukup.
- Promo bertumpuk: untuk MVP, satu aturan aktif per produk. Tidak stackable.
- Periode promo: jika waktu sekarang tidak dalam rentang validFrom–validTo, promo diabaikan.
- Interaksi dengan diskon lain (di luar lingkup MVP): tidak diterapkan dulu.

### 8) Perubahan Skema & Kode (Rencana Implementasi)
1. Skema (Drizzle):
   - Tambah tabel `product_bxgy_promos` (lihat kolom di atas). Siapkan migration.
2. Server (Checkout):
   - Update `/src/app/api/pos/checkout/route.ts`:
     - Query promo aktif untuk productIds.
     - Ubah validasi stok: bandingkan dengan qtyPaid + freeQtyComputed.
     - Ubah konstruksi lineItems: pecah berbayar dan gratis (0 price) untuk penyimpanan dan pengurangan stok.
     - Cetak freebies pada payload `printable.items`.
3. Admin UI (opsional MVP+):
   - Tambah panel sederhana di `/src/components/pages/products/ProductForm.tsx` untuk mengelola promo (CRUD). Untuk MVP, boleh tunda UI dan isi data manual via DB.
4. i18n:
   - Tambah label: “Promo Beli X Gratis Y”, “Gratis”, “FREE”.

### 9) Pengujian
- Unit test fungsi perhitungan freeQty (multiplier, batas maxMultiplier).
- Integration test checkout:
  - Tanpa promo → perilaku tidak berubah.
  - Dengan promo (beli 2 gratis 1):
    - qtyPaid=2 → buat 2 item: berbayar qty=2 (subtotal>0), gratis qty=1 (subtotal=0); stok berkurang 3; totalAmount sesuai 2 pcs.
    - qtyPaid=4 → gratis=2; stok berkurang 6.
  - Stok tidak cukup untuk total (paid+free) → 409.

## Asumsi & Keputusan
- Fitur baru (promo BxGy) dipisahkan dari tiering untuk menjaga akurasi revenue dan stok.
- Baris gratis disimpan sebagai transaction_item terpisah (unitPrice=0) agar laporan & struk transparan.
- Promo dihitung di server untuk konsistensi dan keamanan (client tetap sederhana).

## Langkah Eksekusi (Setelah Plan Disetujui)
1. Tambah migration `product_bxgy_promos` (Drizzle).
2. Update handler `/api/pos/checkout` untuk menghitung dan menerapkan promo.
3. (Opsional) Tambah UI pengaturan promo di ProductForm.
4. Tambah i18n label “Gratis/Free” dan “Promo Beli X Gratis Y”.
5. Tambah test unit & integration sesuai skenario di atas.

## Kriteria Penerimaan (Acceptance Criteria)
- Kasus contoh pada requirement:
  - Beli 2 pcs (harga 2.500) → total bayar Rp5.000, struk menampilkan 2 baris (2 berbayar, 1 gratis), stok berkurang 3.
  - Beli 4 pcs → total bayar Rp10.000, freebies 2, stok berkurang 6.
- Tanpa promo aktif → perilaku checkout identik seperti sebelumnya.

