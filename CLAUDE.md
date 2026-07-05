@AGENTS.md
@DESIGN_SYSTEM.md

## Source of Truth

- **PRD** → `docs/prd/` (feature specs, API contracts, DB schema, business rules)
- **Design System** → `DESIGN_SYSTEM.md` (components, colors, spacing, i18n rules)

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

**Reference implementation:** `src/components/pages/products/` — Products.tsx, ProductFilters.tsx, ProductsTable.tsx, useProducts.ts. Copy this, don't reinvent — read it before building a new list page.

### File structure

```
src/components/pages/<Feature>/
  <Feature>s.tsx          # Coordinator: layout only, no logic
  <Feature>sTable.tsx     # Pure table: thead, tbody, row actions
  <Feature>Filters.tsx    # Filter bar: search + dropdowns + clear
  use<Feature>s.ts        # All state, fetching, mutations, handlers
```

### Rules

- **No logic in the coordinator** — layout only (grid: table card left, create/edit form card right); all state and handlers live in `use<Feature>s.ts`
- **No hardcoded text** — every label, placeholder, and message goes through `t.*`
- **Responsive columns** — hide secondary columns on mobile with `hidden sm:table-cell`, show inline in the name cell meta row instead
- **Selected row highlight** — `border-l-2 border-l-zinc-900` on the row being edited
- **Sort** — use `<SortHeader>` component for sortable columns; `useCallback` + `usePaginatedList` auto-resets on `fetchFn` change
- **Mobile actions** — always use `…` dropdown on mobile (`sm:hidden`), inline buttons on desktop (`hidden sm:flex`)
- **Mutations pattern** — `fetch → res.ok check → refresh() → onChanged?.() → showToast()`
- **Loading/empty states** — `<TableLoading>` / `<TableEmpty>` inside `<tbody>`, refetch overlay (blurred, spinner) when rows already rendered

---

## Standard Form Pattern

**Reference implementation:** `src/components/pages/products/ProductForm.tsx`. Copy this, don't deviate.

### State structure

- `pending` (submit in-flight) + `submitted` (show inline errors after first attempt) — always both
- One ref per focusable field, for `Enter`-to-next-field nav
- `canSave` = `useMemo` validation gate over required fields
- On edit-selection change: `useEffect` syncs all fields from `initial` (or clears them in create mode) and resets `submitted`

### Rules

- **Loading bar first** — `h-1` progress bar as first child of `<form>`, always reserves the space (opacity toggle, no layout shift) so nothing jumps when `pending` flips
- **`submitted` before `canSave`** — set `submitted=true` before checking, so errors appear immediately
- **Form disabled on pending** — `opacity-60 pointer-events-none` on `<form>` itself while request is in-flight
- **Refs for every field** — `Enter` moves focus to the next ref; `Shift+Enter` (wired at `<form onKeyDown>`) submits from anywhere
- **`Alt+N` per optional section** — each collapsible section gets a numbered shortcut; toggle-switch pattern, auto-focus first field on open
- **Shortcuts popup** — `<Info>` icon top-right reveals a panel listing `Enter` / `⇧ Enter` / `⌥ N` shortcuts
- **Currency fields** — `inputMode="numeric"`, strip non-digits via `replace(/[^0-9]/g, '')`, `Rp` prefix absolutely-positioned inside the input
- **Inline errors** — show only after `submitted === true`; `text-xs text-red-500 dark:text-red-400 mt-1`
- **Dividers** — `<div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2" />` between logical field groups
- **Submit button** — full-width, `h-12`, bottom of form, `disabled={pending || !canSave}`
- **onSubmit order** — `preventDefault → setSubmitted(true) → canSave gate → setPending(true) → fetch → res.ok check → playSuccessSound/playFailSound (from @/utils/sounds, only on terminal states) → onSaved() → reset fields on create / keep on edit → refocus first field`

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
