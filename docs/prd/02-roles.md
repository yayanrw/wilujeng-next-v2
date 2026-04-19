# User Roles & Permissions

| Role | Deskripsi | Izin Akses |
|---|---|---|
| **Admin** | Pemilik toko / Manajer | Seluruh fitur termasuk manajemen user, laporan laba rugi, dan pengaturan sistem |
| **Kasir** | Staf operasional | Transaksi kasir, manajemen stok, melihat data pelanggan. Tidak bisa mengelola user |

## Matriks Role & Izin

| Modul/Fungsi              | Admin | Kasir |
|:--------------------------|:-----:|:-----:|
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

> RBAC diimplementasikan di level API Route Handlers dan server components; sidebar menyesuaikan izin.
