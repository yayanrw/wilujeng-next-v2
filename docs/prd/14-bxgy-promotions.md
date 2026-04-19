# BXGY Promotions (Post-MVP)

## Overview

Sistem promosi "Beli X dapatkan Y gratis" per produk. Otomatis diterapkan berdasarkan qty saat checkout.

## Database

Tabel `product_bxgy_promos` — lihat [database-schema.md](./12-database-schema.md).

## Business Logic

Lihat [business-logic.md](./11-business-logic.md) bagian BXGY.

## UI/UX

### Product List & Dashboard
- Badge promo pada produk dengan BXGY aktif (contoh: "Buy 2 Get 1 Free")

### POS Cart
- Badge "+N Gratis" di sebelah qty item yang mendapat promo
- Kalkulasi qty gratis real-time saat qty diubah

### Struk (Receipt)
- Tampilkan: qty dibayar vs qty total, dengan catatan qty gratis

## API

- `GET /api/pos/promos?product_ids=[]` → `200 [{productId, buyQty, freeQty, validFrom, validTo, maxMultiplierPerTx}]`
- `GET /api/products/:id/promo` → `200 {...}` atau `404`
- `POST /api/admin/promos` (admin) → `{productId, buyQty, freeQty, validFrom?, validTo?, maxMultiplierPerTx?, active}` → `201 {id}`
- `PATCH /api/admin/promos/:id` (admin) → body subset → `200 {updated:true}`
- `DELETE /api/admin/promos/:id` (admin) → `200 {deleted:true}`
