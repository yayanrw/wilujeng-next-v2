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
