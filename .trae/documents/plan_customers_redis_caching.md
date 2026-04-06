# Plan: Add Redis Caching Strategy for Customers

## Summary
Add Redis caching for customer list and customer detail endpoints to reduce repeated database reads during search, sort, pagination, and detail viewing across POS, Customers page, and Receivables reports. Update the caching design document to include a new Customers section with keys, TTLs, and invalidation rules. Then implement caching in the relevant API routes using existing helpers (`getCachedData`, `setCachedData`, `invalidateCachePattern`) from `src/lib/redis.ts`.

## Current State Analysis
- Customers API endpoints:
  - List: [src/app/api/customers/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/route.ts) — supports `search`, `limit`, `offset`, `sortBy`, `sortOrder`.
  - Detail: [src/app/api/customers/[id]/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/%5Bid%5D/route.ts) — returns single customer + recent transactions; supports `GET` and `PATCH`.
  - Pay Debt: [src/app/api/customers/[id]/pay-debt/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/%5Bid%5D/pay-debt/route.ts) — `POST` reduces `totalDebt` and appends a payment entry.
- Redis utilities already exist at `src/lib/redis.ts` and are in use for categories, brands, suppliers, settings, and setup-admin.

## Proposed Changes
1. Documentation update in caching plan
   - File: [/.trae/documents/redis_caching_plan.md](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/.trae/documents/redis_caching_plan.md)
   - Add a new section “10. Customers (`GET /api/customers`, `GET /api/customers/:id`, `POST /api/customers`, `PATCH /api/customers/:id`, `POST /api/customers/:id/pay-debt`)” with:
     - Keys
       - List: `customers:list:{search || 'all'}:{sortBy || 'name'}:{sortOrder || 'asc'}:{limit || 50}:{offset || 0}`
       - Detail: `customers:detail:{customerId}`
     - Strategy
       - List: Cache with explicit invalidation after create/update/pay-debt. No TTL by default.
       - Detail: Short TTL (e.g., 60s) to tolerate frequent transaction updates, plus explicit invalidation on `PATCH` and `pay-debt`.
     - Invalidation
       - On `POST /api/customers`: `invalidateCachePattern('customers:list:*')`
       - On `PATCH /api/customers/:id`: `invalidateCachePattern('customers:list:*')` and delete `customers:detail:{id}`
       - On `POST /api/customers/:id/pay-debt`: `invalidateCachePattern('customers:list:*')` and delete `customers:detail:{id}`

2. Implement caching in API routes
   - List: [src/app/api/customers/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/route.ts)
     - GET: Build cache key from `search`, `sortBy`, `sortOrder`, `limit`, `offset`. Try `getCachedData(key)`; if miss, query DB, then `setCachedData(key, data)`.
     - POST: After successful insert, `invalidateCachePattern('customers:list:*')`.
   - Detail: [src/app/api/customers/[id]/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/%5Bid%5D/route.ts)
     - GET: Use `customers:detail:{id}` key. `getCachedData` then `setCachedData(..., ttlSeconds=60)`.
     - PATCH: After successful update, `invalidateCachePattern('customers:list:*')` and delete `customers:detail:{id}`.
   - Pay Debt: [src/app/api/customers/[id]/pay-debt/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/customers/%5Bid%5D/pay-debt/route.ts)
     - POST: After successful payment, `invalidateCachePattern('customers:list:*')` and delete `customers:detail:{id}`.

## Assumptions & Decisions
- Consistency: List data should reflect new/updated customers and debt changes quickly; hence explicit invalidation of all list pages via pattern deletion.
- Detail freshness: Transactions and `totalDebt` may change frequently (checkout, pay-debt). Use short TTL (60s) and explicit invalidation on writes that directly affect the customer to balance performance and staleness.
- Keys align with existing patterns for categories/brands/suppliers for maintainability.

## Verification
1. List caching
   - Call `GET /api/customers?search=a&limit=20&offset=0&sortBy=name&sortOrder=asc` twice; second call should be served from cache.
   - Create a new customer via `POST /api/customers`; subsequent list call should reflect the new entry (cache miss then set).
2. Detail caching
   - Call `GET /api/customers/:id` twice; second call should be cached. Within 60s, data should return fast; after 60s, it should refresh.
   - Perform `PATCH /api/customers/:id` or `POST /api/customers/:id/pay-debt` and confirm subsequent `GET /api/customers/:id` is a cache miss, then re-cached.
3. Observe Redis keys `customers:list:*` and `customers:detail:{id}` being created and deleted as expected.

## Execution Steps (post-approval)
1. Update redis_caching_plan.md with section 10 and details above.
2. Modify `src/app/api/customers/route.ts` GET and POST to add list caching and invalidation.
3. Modify `src/app/api/customers/[id]/route.ts` GET and PATCH for detail caching and invalidation.
4. Modify `src/app/api/customers/[id]/pay-debt/route.ts` POST for invalidation.
5. Run and verify via API calls; adjust TTL if needed based on UX staleness tolerance.

