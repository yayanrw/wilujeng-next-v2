# UI/UX Audit & Design System — wilujeng-next-v2

## Context

Multiple pages have drifted apart in visual and structural patterns: search bars, table styles, loading states, empty states, card headers, pagination buttons, and modals all have subtle inconsistencies across the codebase. The goal is to (1) document the canonical design system, (2) extract reusable components and a custom hook, and (3) update all affected pages to use them so future changes stay consistent.

---

## Audit Summary — Inconsistencies Found

| Pattern                  | Canonical (Products/Customers/Stock)                     | Non-canonical (Brand/Category/Supplier/Users)                   |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| Search bar               | Icon `<Search>` + `pl-9` input                           | Plain `<Input>` with no icon                                    |
| Table header             | `border-y` + `bg-zinc-50/50` background                  | `border-b` or no bg (ReportsClient, UsersSettings)              |
| Table cell padding       | `py-3 px-4`                                              | `py-2` (UsersSettings, Brand/Category/Supplier)                 |
| Table row hover          | Explicit `hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50` | Missing hover (Brand/Category/Supplier)                         |
| Empty state location     | Inside `<tr><td colSpan>`                                | Outside table (Products/Customers)                              |
| Load-more button variant | `variant="secondary"` + border-t container               | `variant="ghost"` + no border-t (Brand/Category/Supplier/Users) |
| Modal z-index            | Various: 50, 100, 200                                    | Inconsistent                                                    |
| Tab nav                  | Has `shadow-sm` on active (StockClient)                  | Missing `shadow-sm` on active (others)                          |
| Loading state            | Full flex container inside `<tr><td>`                    | Some use outer div (ReportsClient), others inline               |

---

## Phase 1 — Create Reusable UI Components

### New files to create in `src/components/ui/`:

#### 1. `Spinner.tsx`

```tsx
// Props: size?: 'sm' | 'md', label?: string
// Renders: animate-spin rounded-full + optional text below
```

#### 2. `PageHeader.tsx`

```tsx
// Props: title: string, subtitle?: string, children?: ReactNode (right slot for buttons)
// Pattern: space-y-1.5 with text-xl font-bold + text-sm zinc-500
```

#### 3. `TabNav.tsx`

```tsx
// Props: tabs: {value, label}[], value: string, onChange: (v: string) => void
// Pattern: flex flex-wrap gap-2, rounded-full pill buttons, shadow-sm on active
```

#### 4. `SearchInput.tsx`

```tsx
// Props: extends InputHTMLAttributes, wrapperClassName?
// Pattern: relative container with <Search> icon absolute left-3 + pl-9 input
```

#### 5. `TableEmpty.tsx`

```tsx
// Props: colSpan: number, message: string
// Pattern: <tr><td colSpan py-8 text-center text-zinc-500></td></tr>
```

#### 6. `TableLoading.tsx`

```tsx
// Props: colSpan: number, message?: string
// Pattern: <tr><td colSpan py-12><Spinner /></td></tr>
```

#### 7. `LoadMoreButton.tsx`

```tsx
// Props: onClick, loading?, hasMore: boolean, label?: string
// Pattern: border-t container + variant="secondary" w-full max-w-xs
```

#### 8. `ModalFrame.tsx`

```tsx
// Props: title, icon?, onClose, children, maxWidth?: 'sm'|'lg'|'2xl', zIndex?: number
// Pattern: fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm + rounded-2xl animate-in header
```

#### 9. `FilterBar.tsx`

```tsx
// Props: children, onApply?, loading?, applyLabel?
// Pattern: flex flex-wrap items-end gap-3 wrapper, places filter controls + apply button
```

---

## Phase 2 — Create Custom Hook

### New file `src/hooks/usePaginatedList.ts`

Extracts the repeated pagination + search + debounce + load-more pattern used in:

- BrandProducts, CategoryProducts, SupplierProducts, Products, Customers, Users

```ts
// usePaginatedList<T>({
//   fetchFn: (params) => Promise<T[]>,
//   limit?: number,       // default 50
//   debounceMs?: number,  // default 500
// }): {
//   items: T[], loading, hasMore,
//   search, setSearch,
//   loadMore, refresh,
// }
```

---

## Phase 3 — Update All Pages

### Files to update:

| File                                                     | Changes                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/pages/products/BrandProducts.tsx`        | Use `SearchInput`, `TableEmpty`, `TableLoading`, `LoadMoreButton`, fix `py-3` padding, add hover row classes    |
| `src/components/pages/products/CategoryProducts.tsx`     | Same as BrandProducts                                                                                           |
| `src/components/pages/products/SupplierProducts.tsx`     | Same as BrandProducts                                                                                           |
| `src/components/pages/products/Products.tsx`             | Use `SearchInput`, `TableLoading`, `LoadMoreButton`, `PageHeader`                                               |
| `src/components/pages/CustomersClient.tsx`               | Use `SearchInput`, `PageHeader`, `LoadMoreButton`                                                               |
| `src/components/pages/StockClient.tsx`                   | Use `TabNav`, `PageHeader`, `TableEmpty`, `TableLoading`, `LoadMoreButton`, `ModalFrame` in StockLogDetailModal |
| `src/components/pages/ReportsClient.tsx`                 | Use `TabNav`, `PageHeader`; fix table `border-y` + bg                                                           |
| `src/components/pages/settings/UsersSettings.tsx`        | Use `SearchInput`, `TableEmpty`, `TableLoading`, `LoadMoreButton`, fix `py-3` padding                           |
| `src/components/pages/stock/StockLogDetailModal.tsx`     | Use `ModalFrame`                                                                                                |
| `src/components/pages/reports/SalesDetailModal.tsx`      | Use `ModalFrame`                                                                                                |
| `src/components/pages/reports/ReceivableDetailModal.tsx` | Use `ModalFrame`                                                                                                |
| `src/components/pages/customers/PayDebtModal.tsx`        | Use `ModalFrame`                                                                                                |

---

## Phase 4 — Design System Documentation

Create `docs/design-system.md` (or `DESIGN_SYSTEM.md` at root):

- Color palette (zinc as primary, red/emerald/amber/blue for status)
- Typography scale (text-xl bold for page titles, text-sm zinc-500 for subtitles)
- Spacing (gap-4 between sections, space-y-1.5 for title/subtitle)
- Table anatomy (thead: border-y + bg-zinc-50/50, th: py-3 px-4, tr hover, td: py-3 px-4 align-middle)
- Button usage guide (primary for submit, secondary for filter/load-more, ghost for icon actions, danger for delete)
- Modal overlay spec (z-[100], backdrop-blur-sm, rounded-2xl, animate-in)
- Card header spec (border-b + bg-zinc-50/50 + pb-4 for headers that contain filters)
- Loading/empty state specs
- Search input spec
- Tab nav spec
- Picker components reference

---

## Critical Files

**New:**

- `src/components/ui/Spinner.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/TabNav.tsx`
- `src/components/ui/SearchInput.tsx`
- `src/components/ui/TableEmpty.tsx`
- `src/components/ui/TableLoading.tsx`
- `src/components/ui/LoadMoreButton.tsx`
- `src/components/ui/ModalFrame.tsx`
- `src/components/ui/FilterBar.tsx`
- `src/hooks/usePaginatedList.ts`
- `DESIGN_SYSTEM.md`

**Updated:**

- `src/components/pages/products/BrandProducts.tsx`
- `src/components/pages/products/CategoryProducts.tsx`
- `src/components/pages/products/SupplierProducts.tsx`
- `src/components/pages/products/Products.tsx`
- `src/components/pages/CustomersClient.tsx`
- `src/components/pages/StockClient.tsx`
- `src/components/pages/ReportsClient.tsx`
- `src/components/pages/settings/UsersSettings.tsx`
- `src/components/pages/stock/StockLogDetailModal.tsx`
- `src/components/pages/reports/SalesDetailModal.tsx`
- `src/components/pages/reports/ReceivableDetailModal.tsx`
- `src/components/pages/customers/PayDebtModal.tsx`

---

## Existing Utilities to Reuse

- `src/components/ui/Button.tsx` — all button variants
- `src/components/ui/Input.tsx` — base input
- `src/components/ui/Card.tsx` — Card, CardHeader, CardContent
- `src/components/ui/Badge.tsx` — tone-based status badges
- `src/components/ui/ConfirmDialog.tsx` — delete confirmations
- `src/hooks/useToast.tsx` — toast notifications
- `src/i18n/useTranslation.ts` — translations
- `src/utils/money.ts#formatIdr` — currency formatting
- `src/stores/uiStore.ts` — language/sidebar state

---

## Execution Order

1. Create 9 new UI components (parallel where possible)
2. Create `usePaginatedList` hook
3. Create `DESIGN_SYSTEM.md`
4. Update BrandProducts, CategoryProducts, SupplierProducts (parallel, same changes)
5. Update Products.tsx, CustomersClient.tsx, UsersSettings.tsx
6. Update StockClient.tsx, ReportsClient.tsx
7. Update the 4 modal files to use ModalFrame

---

## Verification

- Open `/products` → click Brands, Categories, Suppliers tabs → confirm search bar has icon, table has background header, rows have hover, load-more is secondary variant
- Open `/stock` → logs tab → confirm table matches products style
- Open `/reports` → confirm table header consistent
- Open `/settings` → Users tab → confirm search icon, consistent table
- Open any detail modal (stock log, sales detail) → confirm consistent overlay and animation
- Dark mode toggle → verify all components respect dark mode
