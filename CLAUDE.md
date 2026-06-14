@AGENTS.md
@DESIGN_SYSTEM.md

## Source of Truth

- **PRD** → `docs/prd/` (feature specs, API contracts, DB schema, business rules)
- **Design System** → `DESIGN_SYSTEM.md` (components, colors, spacing, i18n rules)
- **Knowledge Graph** → `graphify-out/graph.json` (run `/graphify` to regenerate)

---

## Codebase Map

```
src/
  app/
    (app)/          # Route pages (dashboard, pos, products, stock, customers, reports, settings)
    api/            # API Route Handlers — one folder per resource
    receipt/[id]/   # Thermal receipt print page
    setup/          # First-run admin setup
  components/
    pages/          # Client components (one per page, e.g. PosClient, ProductsClient)
    shared/         # Reusable cross-page components
    shell/          # AppShell, Sidebar, TopBar
    ui/             # shadcn/ui primitives
  db/
    schema.ts       # Drizzle ORM schema — single source of truth for DB shape
    seed.ts
  i18n/
    en.json         # All English strings
    id.json         # All Indonesian strings
    useTranslation.ts
  lib/
    redis.ts        # getCachedData / setCachedData / invalidateCachePattern
    server-session.ts  # getSession / requireSession / requireAdmin
    auth.ts / auth-client.ts / authz.ts
  stores/
    posStore.ts     # Cart state (Zustand)
    catalogStore.ts # Product catalog cache (Zustand)
    uiStore.ts      # Sidebar toggle, language (Zustand)
```

---

## Task Shortcuts

### Adding a new feature

1. Update the relevant PRD file in `docs/prd/` first
2. Add/alter the DB table in `src/db/schema.ts`
3. Create the API route under `src/app/api/<resource>/route.ts`
4. Add RBAC guard: `requireSession()` or `requireAdmin()` from `src/lib/server-session.ts`
5. Add Redis cache invalidation in `src/lib/redis.ts` where needed
6. Build the UI in `src/components/pages/<Feature>Client.tsx`
7. Add all new strings to both `src/i18n/en.json` and `src/i18n/id.json`

### Adding a new API route

- Auth check: always call `requireSession()` at the top; use `requireAdmin()` for admin-only
- Use helpers from `src/lib/server-session.ts` — never re-implement auth inline
- Pattern: `src/app/api/<resource>/route.ts` exports named `GET`, `POST`, etc.
- Cache: invalidate with `invalidateCachePattern('resource:list:*')` after mutations

### Adding a translation key

1. Add the key to `src/i18n/en.json` (English)
2. Add the same key to `src/i18n/id.json` (Indonesian)
3. Use it via `const { t } = useTranslation()` — **no hardcoded strings in components**

### Changing the DB schema

1. Update `src/db/schema.ts`
2. Update `docs/prd/12-database-schema.md` to match
3. Run the Drizzle migration

---

## Standard Table + Filter Page Pattern

**Reference implementation:** `src/components/pages/products/` — Products.tsx, ProductFilters.tsx, ProductsTable.tsx, useProducts.ts

Every list/table page follows this exact structure. Do not deviate.

### File structure

```
src/components/pages/<Feature>/
  <Feature>s.tsx          # Coordinator: layout only, no logic
  <Feature>sTable.tsx     # Pure table: thead, tbody, row actions
  <Feature>Filters.tsx    # Filter bar: search + dropdowns + clear
  use<Feature>s.ts        # All state, fetching, mutations, handlers
```

### Coordinator layout (`<Feature>s.tsx`)

```tsx
<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0 overflow-x-hidden">
  {/* Left: table card */}
  <Card className="h-fit min-w-0">
    <CardHeader className="flex flex-col gap-4 pb-6">
      <div className="space-y-1.5">
        <div className="text-xl font-bold tracking-tight">{t.feature.title}</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {!loading && items.length > 0
            ? `${items.length}${hasMore ? '+' : ''} ${t.feature.itemsLoaded}`
            : t.feature.subtitle}
        </div>
      </div>
      <FeatureFilters ... />
    </CardHeader>
    <CardContent className="p-0 min-w-0">
      <FeatureTable ... />
    </CardContent>
  </Card>

  {/* Right: create/edit form card */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">
            {editId ? t.feature.editItem : t.feature.newItem}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.common.adminOnly}</div>
        </div>
        {editId && (
          <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>
            <Plus className="h-3 w-3 mr-1" /> {t.feature.newItem}
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <FeatureForm mode={editId ? 'edit' : 'create'} initial={editId ? selected ?? undefined : undefined} onSaved={handleSaved} />
    </CardContent>
  </Card>

  {/* Modals */}
  <ConfirmDialog ... />
  <Toast />
</div>
```

### Filter bar (`<Feature>Filters.tsx`)

```tsx
<div className="flex flex-col gap-2.5 w-full pt-2">
  {/* Search always full-width on top */}
  <SearchInput placeholder={t.feature.searchPlaceholder} value={search} onChange={...} autoFocus />

  {/* Dropdowns + clear + secondary action in a flex row */}
  <div className="flex items-center gap-2 flex-wrap">
    <SearchableSelect value={filterId} onChange={...} className="flex-1 min-w-[120px] sm:flex-none sm:w-36" />
    {hasActiveFilters && (
      <Button variant="ghost" className="shrink-0 h-10 w-10 p-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        onClick={clearFilters} title={t.feature.clearFilters}>
        <FilterX className="h-4 w-4" />
        <span className="sr-only">{t.feature.clearFilters}</span>
      </Button>
    )}
    {/* Secondary action (import, export, etc.) pushed right */}
    <Button variant="secondary" className="ml-auto shrink-0 whitespace-nowrap gap-1.5" onClick={onAction}>
      <FileUp className="h-4 w-4 shrink-0" /> {t.feature.importItems}
    </Button>
  </div>
</div>
```

### Table (`<Feature>sTable.tsx`)

```tsx
<>
  {/* Click-away overlay for mobile action menu */}
  {actionMenuId && <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />}

  <div className="relative">
    {/* Refetch overlay (when rows already rendered) */}
    {loading && items.length > 0 && (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px]">
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.feature.loading}
        </div>
      </div>
    )}

    <div className="w-full max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
            <th className="py-3 px-4 font-medium">Column</th>
            <th className="py-3 px-4 font-medium">
              <SortHeader label={t.feature.name} field="name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            </th>
            <th className="py-3 px-4 font-medium hidden sm:table-cell">Responsive Col</th>
            <th className="py-3 px-4 font-medium text-right">{t.feature.action}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading && items.length === 0 ? (
            <TableLoading colSpan={N} message={t.feature.loading} />
          ) : items.length === 0 ? (
            <TableEmpty colSpan={N} message={t.feature.noItems} />
          ) : (
            items.map((item) => (
              <tr key={item.id} className={`group transition-colors border-l-2 ${
                item.id === editId
                  ? 'border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50 dark:bg-zinc-900'
                  : 'border-l-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
              }`}>
                <td className="py-3 px-4 align-middle">...</td>

                {/* Actions: desktop inline, mobile dropdown */}
                <td className="py-3 px-4 align-middle text-right">
                  {/* Desktop */}
                  <div className="hidden sm:flex items-center justify-end">
                    <Button variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => onEdit(item.id)} title={t.feature.edit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      onClick={() => onDelete(item.id)} title={t.common.delete}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile: … dropdown */}
                  <div className="sm:hidden relative">
                    <Button variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {actionMenuId === item.id && (
                      <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1">
                        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                          onClick={() => { onEdit(item.id); setActionMenuId(null); }}>
                          <Pencil className="h-4 w-4 text-zinc-400 shrink-0" /> {t.common.edit}
                        </button>
                        <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => { onDelete(item.id); setActionMenuId(null); }}>
                          <Trash className="h-4 w-4 shrink-0" /> {t.common.delete}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>

  <LoadMoreButton onClick={onLoadMore} hasMore={hasMore && items.length > 0 && !loading} label={t.feature.loadMore} />
</>
```

### Hook (`use<Feature>s.ts`)

```ts
export function useFeatures({ statFilter, onChanged }) {
  const { showToast, Toast } = useToast();
  const { t } = useTranslation();

  // filter state
  const [filterId, setFilterId] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editId, setEditId] = useState<string | null>(null);

  // fetchFn rebuilds when filters/sort change — usePaginatedList reacts
  const fetchFn = useCallback(async ({ search, offset, limit }) => {
    const params = new URLSearchParams({ sort: sortField, order: sortDir, limit, offset, ... });
    if (filterId !== 'all') params.append('filterId', filterId);
    return fetch(`/api/items?${params}`).then(r => r.json()).catch(() => []);
  }, [filterId, sortField, sortDir, statFilter]);

  const { items, loading, hasMore, search, setSearch, loadMore, refresh } =
    usePaginatedList({ fetchFn, limit: 50 });

  // Mutations: fetch → refresh() → onChanged?.() → showToast()
  const confirmDelete = useCallback(async () => {
    const res = await fetch(`/api/items/${deletingId}`, { method: 'DELETE' });
    if (res.ok) { refresh(); onChanged?.(); showToast(t.feature.deletedSuccess); }
    else showToast(t.feature.deleteFailed);
  }, [...]);

  return { items, loading, hasMore, search, setSearch, loadMore,
           filterId, setFilterId, sortField, sortDir, handleSort,
           editId, setEditId, selected,
           isDeleteDialogOpen, openDeleteDialog, closeDeleteDialog, confirmDelete, deleting,
           handleSaved, t, Toast };
}
```

### Rules

- **No logic in the coordinator** — all state and handlers live in `use<Feature>s.ts`
- **No hardcoded text** — every label, placeholder, and message goes through `t.*`
- **Responsive columns** — hide secondary columns on mobile with `hidden sm:table-cell`, show inline in the name cell meta row instead
- **Selected row highlight** — `border-l-2 border-l-zinc-900` on the row being edited
- **Sort** — use `<SortHeader>` component for sortable columns; `useCallback` + `usePaginatedList` auto-resets on `fetchFn` change
- **Mobile actions** — always use `…` dropdown on mobile (`sm:hidden`), inline buttons on desktop (`hidden sm:flex`)
- **Mutations pattern** — `fetch → res.ok check → refresh() → onChanged?.() → showToast()`

---

## PRD Navigation

| Working on… | Read this PRD file |
|---|---|
| Dashboard widgets / charts | `docs/prd/04-dashboard.md` |
| POS, cart, checkout | `docs/prd/05-pos.md` |
| Products, import, soft delete | `docs/prd/06-products.md` |
| Stock IN/OUT/OPNAME | `docs/prd/07-stock.md` |
| Customers, loyalty, debt | `docs/prd/08-customers.md` |
| Reports | `docs/prd/09-reports.md` |
| Settings, branding, users | `docs/prd/10-settings.md` |
| Tiering, loyalty, hutang calc | `docs/prd/11-business-logic.md` |
| DB tables / columns | `docs/prd/12-database-schema.md` |
| Caching, perf, RBAC rules | `docs/prd/13-non-functional.md` |
| BXGY promotions | `docs/prd/14-bxgy-promotions.md` |
| Roles & permission matrix | `docs/prd/02-roles.md` |

Full index: `docs/prd/README.md`

---

## Codebase Knowledge Graph

Run `/graphify` to build or refresh the graph. Outputs go to `graphify-out/`:

- `graph.json` — query with `/graphify query "<question>"`
- `graph.html` — open in browser for visual exploration

Regenerate after: new files added, major refactors, or cross-module analysis.

---

## PRD Update Rule

**Every code change that affects schema, API, UI, or business logic must update the relevant `docs/prd/` file before the session ends.**

| Change type | Update here |
|---|---|
| New/altered DB column or table | `12-database-schema.md` |
| New/altered API endpoint | Feature file (e.g. `06-products.md`) |
| New UI behaviour | Feature file |
| Business logic change | `11-business-logic.md` |
| Cache key or strategy change | `13-non-functional.md` |
| Permission change | `02-roles.md` |
