# Design System — wilujeng-next-v2

This document defines the canonical design system for wilujeng-next-v2. All UI components should follow these specifications to ensure visual and structural consistency across the application.

## Color Palette

### Primary
- **Zinc** (`zinc-900`/`zinc-100` light/dark) — default text, buttons, borders
- Hover states: `zinc-800`/`zinc-200`
- Backgrounds: `zinc-50` (hover), `zinc-950` (dark background)

### Status Colors
- **Success**: `emerald` — positive actions, completed states
- **Error**: `red` — destructive actions, errors
- **Warning**: `amber` — alerts, warnings
- **Info**: `blue` — informational badges, secondary CTAs

### Neutral
- `zinc-400`/`zinc-500` — secondary text, placeholders, icons
- `zinc-200`/`zinc-800` — borders, dividers

## Typography

### Scale
- **Page titles**: `text-xl font-bold` + `text-zinc-900 dark:text-zinc-100`
- **Section titles**: `text-lg font-bold`
- **Subtitles/metadata**: `text-sm text-zinc-500 dark:text-zinc-400`
- **Body text**: `text-sm` or `text-base`
- **Small labels**: `text-xs text-zinc-500`

### Example: PageHeader
```tsx
<div className="space-y-1.5">
  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
    Page Title
  </h1>
  <p className="text-sm text-zinc-500 dark:text-zinc-400">Subtitle</p>
</div>
```

## Spacing

### Gaps & Margins
- **Between major sections**: `gap-4` or `gap-6`
- **Between related elements**: `gap-2` or `gap-3`
- **Inside cards/containers**: `px-4 py-3` or `px-6 py-4`
- **Title + subtitle spacing**: `space-y-1.5`

### Table Spacing
- **Cell padding**: `py-3 px-4`
- **Header padding**: `py-3 px-4`
- **Row hover**: `hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50`

## Components

### Button
Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>

<Button variant="secondary" size="md">
  Secondary Action
</Button>

<Button variant="ghost" size="sm">
  Icon Button
</Button>

<Button variant="danger" size="md">
  Delete
</Button>
```

**Guidelines:**
- Primary: form submissions, main CTAs
- Secondary: filters, load-more, secondary actions
- Ghost: icon buttons, links-styled buttons
- Danger: delete operations, destructive actions

### Delete/Destructive Icon Button
All delete icon buttons must use a consistent pattern:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
  onClick={handleDelete}
  title={t.common.delete}
>
  <Trash className="h-4 w-4" />
  <span className="sr-only">{t.common.delete}</span>
</Button>
```

**Requirements:**
- Use `<Trash>` icon from `lucide-react` (NOT custom SVG)
- Size: `h-8 w-8` container, `h-4 w-4` icon
- Colors: `text-red-500/600` (light), `dark:text-red-400/300` (dark)
- Always include `transition-colors` for smooth hover effect
- Include `title` attribute for tooltip
- Include `<span className="sr-only">` for screen readers

### SearchInput
Search bar with left-aligned icon.

```tsx
<SearchInput
  placeholder="Search products..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

**Implementation:**
- Icon: `<Search>` from lucide-react
- Input styling: `pl-9` (padding-left for icon)
- Wrapper: `relative` container

### PageHeader
Title + subtitle + action slots.

```tsx
<PageHeader
  title="Products"
  subtitle="Manage your product catalog"
>
  <Button>Add Product</Button>
</PageHeader>
```

**Layout:** flex row, items-start, justify-between
**Title spacing:** space-y-1.5 between title and subtitle

### TabNav
Pill-style tab navigation.

```tsx
<TabNav
  tabs={[
    { value: "products", label: "Products" },
    { value: "categories", label: "Categories" },
  ]}
  value={activeTab}
  onChange={setActiveTab}
/>
```

**Styling:**
- Rounded pills: `rounded-full`
- Active state: `shadow-sm` + primary variant
- Inactive: secondary variant

### Table Anatomy

#### Header Row (thead)
```tsx
<thead className="border-y border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
  <tr>
    <th className="py-3 px-4 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
      Column Name
    </th>
  </tr>
</thead>
```

#### Body Row (tbody)
```tsx
<tbody>
  <tr className="border-b border-zinc-200 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
      Cell content
    </td>
  </tr>
</tbody>
```

**Guidelines:**
- Header: `border-y` (top + bottom), `bg-zinc-50/50` background
- Cell padding: `py-3 px-4` (consistent vertical & horizontal)
- Row hover: always include hover background
- Border color: `border-zinc-200` (light), `dark:border-zinc-800` (dark)

### Loading States

#### Spinner
Animated loading indicator.

```tsx
<Spinner size="md" label="Loading..." />
```

**In table:**
```tsx
<TableLoading colSpan={5} message="Loading products..." />
```

#### TableLoading
Full-row loading state inside `<tbody>`.

```tsx
<TableLoading colSpan={columnCount} />
```

### Empty States

#### TableEmpty
Full-row empty message inside `<tbody>`.

```tsx
<TableEmpty colSpan={columnCount} message="No products found" />
```

**Always place inside `<table>` > `<tbody>`, not outside.**

### Load More Button
Secondary button with border-top container for infinite scroll.

```tsx
<LoadMoreButton
  onClick={loadMore}
  loading={isLoading}
  hasMore={hasMore}
  label="Load more products"
/>
```

**Structure:**
- Container: `border-t py-4`
- Button: `variant="secondary" w-full max-w-xs`
- Centered alignment

### ModalFrame
Overlay modal with header and content slots.

```tsx
<ModalFrame
  title="Confirm Delete"
  icon={<AlertCircle className="h-5 w-5 text-red-600" />}
  onClose={handleClose}
  maxWidth="sm"
  zIndex={100}
>
  <p>Are you sure? This action cannot be undone.</p>
  <div className="mt-4 flex gap-2">
    <Button variant="danger" onClick={handleConfirm}>Delete</Button>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
  </div>
</ModalFrame>
```

**Styling:**
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm`
- Content: `rounded-2xl animate-in` with shadow
- Header: `border-b px-6 py-4`
- Z-index: default 100, configurable

### FilterBar
Horizontal filter control container with apply button.

```tsx
<FilterBar onApply={handleApply} loading={isApplying}>
  <select>
    <option>All Categories</option>
  </select>
  <input type="date" />
</FilterBar>
```

**Layout:** flex flex-wrap items-end gap-3

## Internationalization (i18n)

**CRITICAL RULE:** All user-facing text must be extracted to i18n files — **NO HARDCODED TEXT** in components.

### What Must Be Internationalized
- Label text: `<label>`, `<span>`, `<p>`, `<div>` content
- Placeholder text: `placeholder` attributes
- Button text and labels
- Error/success messages
- Tooltip content
- Alt text for images
- Title attributes

### What to Avoid (❌ INCORRECT)
```tsx
// ❌ Hardcoded text
<label>Tipe Keluar</label>
<Input placeholder="Contoh: Barang cacat..." />
<Button>Rusak / Hilang (Out)</Button>
<span>Transaksi Asal (Wajib untuk Retur)</span>
```

### How to Do It (✅ CORRECT)
```tsx
// ✅ Use i18n keys
import { useTranslation } from '@/i18n/useTranslation';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <>
      <label>{t.stock.outType}</label>
      <Input placeholder={t.stock.returnReasonPlaceholder} />
      <Button>{t.stock.outTypeDamaged}</Button>
      <span>{t.stock.originTransaction}</span>
    </>
  );
}
```

### Adding New Translation Keys

1. **Add to both `src/i18n/id.json` and `src/i18n/en.json`**
2. Group by feature (e.g., under `"stock"`, `"products"`, etc.)
3. Use descriptive key names reflecting the content
4. Provide both Indonesian and English translations

**Example:**
```json
{
  "stock": {
    "outType": "Tipe Keluar",
    "outTypeDamaged": "Rusak / Hilang (Out)",
    "returnReasonPlaceholder": "Contoh: Barang cacat, Salah beli..."
  }
}
```

## Dark Mode

All components include dark mode support via `dark:` prefix:

```tsx
className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
```

**Guidelines:**
- Always pair light/dark variants
- Use corresponding zinc shades (600/400, 900/100, etc.)
- Test in both modes before shipping

## Z-Index Scale

- Base content: 0 (default)
- Tooltips/popovers: 50
- Modals/overlays: 100 (default), 200 (critical)
- Sticky headers: 10

## Custom Hooks

### usePaginatedList
Manages pagination, search, and debouncing for list views.

```tsx
const { items, loading, hasMore, search, setSearch, loadMore, refresh } = 
  usePaginatedList({
    fetchFn: async (params) => {
      const res = await api.products.search({
        q: params.search,
        skip: params.offset,
        limit: params.limit,
      });
      return res.data;
    },
    limit: 50,
    debounceMs: 500,
  });
```

**Usage:**
- `search`: current search input value
- `setSearch()`: update search (auto-resets pagination)
- `items`: current page of results
- `loading`: fetch in progress
- `hasMore`: more results available
- `loadMore()`: append next page
- `refresh()`: refetch from offset 0

---

## Implementation Checklist

When implementing a new page or updating an existing one:

- [ ] Use `PageHeader` for main heading + actions
- [ ] Use `SearchInput` if filtering by text
- [ ] Use `TabNav` for multi-view navigation
- [ ] Use `TableLoading` while fetching
- [ ] Use `TableEmpty` for no-results state
- [ ] Apply `py-3 px-4` padding to all `<td>` elements
- [ ] Add `hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50` to all `<tr>` in tbody
- [ ] Use `LoadMoreButton` for infinite scroll
- [ ] Use `ModalFrame` for overlay modals
- [ ] Wrap modals in fixed-z-100 overlay with backdrop blur
- [ ] **NO hardcoded text** — extract all labels, placeholders, and messages to i18n
- [ ] Add missing translation keys to both `id.json` and `en.json`
- [ ] Test dark mode toggle
- [ ] Verify responsive behavior on mobile
