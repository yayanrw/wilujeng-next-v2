# Rencana: Refactor Products.tsx — Separation of Concern

> Status: **DRAFT — belum dikerjakan**
> Dibuat: 2026-06-07
> Konteks: audit kode `Products.tsx` menemukan god component dengan terlalu banyak tanggung jawab dalam satu file.

---

## 1. Latar Belakang & Masalah

`Products.tsx` saat ini menangani semua hal sekaligus:

| # | Tanggung Jawab | Masalah |
|---|---|---|
| 1 | Data fetching + pagination | Dicampur langsung di komponen utama |
| 2 | Sort state (`sortField`, `sortDir`) | Tidak bisa di-reuse di tempat lain |
| 3 | Filter state (`categoryId`, `brandId`) | Tersembunyi di dalam satu komponen besar |
| 4 | Delete flow (dialog, loading, API call) | Sulit diisolasi untuk testing |
| 5 | Status toggle (activate/deactivate) | Sama — async logic di dalam render component |
| 6 | Edit flow (`editId`, `selected`) | Coupled ke rendering tabel |
| 7 | Quick stock-in state | State tambahan yang tidak perlu ada di sini |
| 8 | Mobile action menu state | Seharusnya lokal ke row, bukan parent |
| 9 | Render tabel + render form panel | Dua panel besar dalam satu file |

**Dampak:** File sudah ~486 baris dan akan terus tumbuh. Setiap fitur baru (pagination, bulk action, dll.) memperparah masalah.

---

## 2. Tujuan Refactor

- Komponen `Products` menjadi thin coordinator — hanya menyatukan bagian-bagian
- Semua data logic diisolasi di satu custom hook yang bisa ditest secara mandiri
- Komponen rendering tabel terpisah, bisa dikembangkan tanpa menyentuh data logic
- Tipe `SortField` dipakai konsisten (tidak diulang sebagai literal union)
- Semua operasi CRUD pakai pola yang sama (`useCallback` semua atau plain function semua)

---

## 3. Arsitektur Target

```
src/components/pages/products/
  Products.tsx              ← thin coordinator (~100 baris)
  ProductsTable.tsx         ← rendering tabel + action buttons (baru)
  ProductsTableRow.tsx      ← satu baris tabel + mobile menu (baru, opsional)
  useProducts.ts            ← semua state + CRUD logic (baru)
  ProductForm.tsx           ← tidak berubah
  ProductFilters.tsx        ← tidak berubah
  ImportProductModal.tsx    ← tidak berubah
  QuickStockInModal.tsx     ← tidak berubah

src/components/ui/
  SortHeader.tsx            ← reusable sortable column header (baru)
```

---

## 4. Langkah-langkah

### Step 1 — Buat `useProducts` hook

**File baru:** `src/hooks/useProducts.ts`

Pindahkan ke hook ini:
- `categoryId`, `brandId`, `sortField`, `sortDir` state
- `editId`, `deletingId`, `deleting`, `quickStockInProduct` state
- `handleSort`, `handleStatusChange`, `confirmDelete`, `openDeleteDialog`
- `fetchFn` + `usePaginatedList` call
- Return semua state + handler yang dibutuhkan komponen

```ts
// Contoh shape return
return {
  // data
  products, loading, hasMore, search, setSearch, loadMore, refresh,
  // filter & sort
  categoryId, setCategoryId, brandId, setBrandId,
  sortField, sortDir, handleSort,
  // edit
  editId, setEditId, selected,
  // delete
  isDeleteDialogOpen, openDeleteDialog, confirmDelete, deleting,
  closeDeleteDialog,
  // quick stock
  quickStockInProduct, setQuickStockInProduct,
};
```

### Step 2 — Buat `SortHeader` UI component

**File baru:** `src/components/ui/SortHeader.tsx`

Pindahkan `SortHeader` function dari `Products.tsx` ke file ini. Buat generic dengan tipe parameter agar bisa dipakai di tabel lain (stock, customers, dll.).

### Step 3 — Buat `ProductsTable` component

**File baru:** `src/components/pages/products/ProductsTable.tsx`

Pindahkan:
- Seluruh `<div className="relative">` wrapper + stale overlay
- `<table>` beserta `<thead>`, `<tbody>`, semua `<tr>` dan `<td>`
- Mobile `…` dropdown (`actionMenuId` state bisa lokal di sini)
- `LoadMoreButton`

Props yang diterima dari `Products`:
```ts
interface ProductsTableProps {
  products: ProductDto[];
  loading: boolean;
  hasMore: boolean;
  sortField: SortField;
  sortDir: 'asc' | 'desc';
  editId: string | null;
  onSort: (field: SortField) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string) => void;
  onQuickStockIn: (product: ProductDto) => void;
  onLoadMore: () => void;
}
```

### Step 4 — Perbaiki `SortField` type usage

Di manapun `SortField` dipakai, ganti literal union `'name' | 'basePrice' | 'stock'` dengan tipe `SortField`.

Lokasi yang perlu diubah:
- `useState<'name' | 'basePrice' | 'stock'>` → `useState<SortField>`
- Parameter `useCallback((field: 'name' | 'basePrice' | 'stock')` → `(field: SortField)`

### Step 5 — Seragamkan style fungsi CRUD

Pilih satu pola dan terapkan ke semua operasi:

**Opsi A (rekomendasi):** semua pakai `useCallback` karena akan di-pass sebagai props ke `ProductsTable`

```ts
const openDeleteDialog = useCallback((id: string) => { ... }, []);
const confirmDelete = useCallback(async () => { ... }, [deletingId, editId, refresh, ...]);
```

**Opsi B:** semua plain function (hanya valid jika tidak di-pass ke komponen yang di-memo)

### Step 6 — Slim down `Products.tsx`

Setelah step 1–5, `Products.tsx` seharusnya hanya berisi:
- Destructure dari `useProducts()`
- Layout grid dua kolom
- `<ProductsTable ... />` (menggantikan tabel inline)
- `<Card>` berisi `<ProductForm>`
- Modal: `QuickStockInModal`, `ImportProductModal`, `ConfirmDialog`
- `<Toast />`

Target: ~100–120 baris.

---

## 5. Yang Tidak Perlu Diubah

- `ProductForm.tsx` — sudah terpisah dengan baik
- `ProductFilters.tsx` — sudah terpisah dengan baik
- `usePaginatedList.ts` — tetap generik, tidak spesifik ke products
- API route `/api/products/route.ts` — tidak ada perubahan

---

## 6. Urutan Pengerjaan yang Aman

```
Step 2 (SortHeader UI)       ← paling independen, tidak ada dep
Step 1 (useProducts hook)    ← setelah ini, bisa ditest hook-nya
Step 3 (ProductsTable)       ← butuh SortHeader sudah ada
Step 4 (fix SortField type)  ← bisa seiring Step 1/3
Step 5 (seragamkan CRUD)     ← seiring Step 1
Step 6 (slim Products.tsx)   ← terakhir, setelah semua bagian siap
```

Setiap step bisa di-commit secara terpisah tanpa merusak fungsi yang ada.

---

## 7. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Props drilling dari `Products` ke `ProductsTable` terlalu dalam | Jika lebih dari 8 props, pertimbangkan context atau gabungkan beberapa props ke object |
| `actionMenuId` lokal di `ProductsTable` tidak bisa dikontrol dari luar | Tidak perlu dikontrol dari luar — ini state UI murni |
| Breaking change di komponen lain yang import dari `Products.tsx` | Tidak ada — `Products` tetap di-export dari file yang sama |
| `useProducts` terlalu besar jadi god hook | Pisahkan `useProductSort` dan `useProductCrud` jika hook > 150 baris |
