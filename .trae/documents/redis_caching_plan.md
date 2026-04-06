# Redis Caching Implementation Plan

## Summary
To enhance the application's performance, implementing Redis caching is a highly effective strategy, especially for endpoints that perform heavy database aggregations or serve frequently requested data that doesn't change every second. This plan outlines which APIs are the best candidates for Redis caching, the caching strategies (TTL and Invalidation), and the steps to implement them.

## Current State Analysis
Currently, all API requests directly query the PostgreSQL database via Drizzle ORM. Endpoints like the Dashboard and Reports execute multiple complex aggregations (`SUM`, `COUNT`, `JOIN`s) on every request. In a high-traffic scenario, this can lead to database bottlenecks and slower response times.

## Proposed Caching Candidates

### 1. Dashboard API (`GET /api/dashboard`)
- **Why**: This endpoint executes multiple heavy queries to fetch today's sales, transaction counts, low stock items, top receivables, PNL chart data, and top selling products.
- **Strategy**: **Time-To-Live (TTL) Caching**. Cache the response for a short duration (e.g., 1-5 minutes). Since the dashboard is an overview, slight delays in real-time data are usually acceptable.
- **Cache Key**: `dashboard:summary`

### 2. Profit and Loss Report (`GET /api/reports/pnl`)
- **Why**: Calculates total sales and COGS over specific date ranges. Historical data doesn't change.
- **Strategy**: **TTL & Parameterized Caching**. Cache based on the date range parameters. For past months/weeks, the cache can have a long TTL. For the current month, a shorter TTL (e.g., 5-10 minutes).
- **Cache Key**: `reports:pnl:{startDate}:{endDate}`

### 3. Store Settings (`GET /api/settings`)
- **Why**: Settings (store name, icon, receipt footer) are loaded frequently (on initial load, sidebar, POS) but rarely change.
- **Strategy**: **Cache with Explicit Invalidation**. Cache indefinitely and only invalidate/delete the cache when `POST /api/settings` is called.
- **Cache Key**: `store:settings`

### 4. Products Catalog (`GET /api/products`)
- **Why**: The POS system fetches the product catalog frequently to allow the cashier to search and add items.
- **Strategy**: **Cache with Explicit Invalidation**. Cache the product list and invalidate it whenever a product is added, updated, or when stock changes (Stock In, Stock Out, Checkout).
- **Cache Key**: `products:catalog`

### 5. Setup Admin Status (`GET /setup` & `POST /api/setup-admin`)
- **Why**: The system frequently checks if the admin setup is complete (e.g., in middleware or initial page loads) by running a `COUNT(*)` query on the users table. Once setup is complete, this status never changes back to false.
- **Strategy**: **Cache with Explicit Invalidation/Set**. Cache the setup status (`true` or `false`). Update the cache to `true` permanently once the `POST /api/setup-admin` successfully creates the first user.
- **Cache Key**: `system:setup_complete`

### 6. Other Reports (`GET /api/reports/*`)
- **APIs**: Sales, Low Stock, Receivables, Suppliers.
- **Why**: Similar to PNL, these involve joins and aggregations.
- **Strategy**: Parameterized caching with short TTL (e.g., 1-5 minutes) to reduce database load during peak reporting times.

### 7. Categories (`GET /api/categories`, `POST /api/categories`)
- **Why**: Categories are read frequently for filters/typeahead and rarely change. Caching improves list/search response times.
- **Strategy**: Cache with explicit invalidation on create. Parameterize by `search`, `limit`, and (if added later) `offset`.
- **Cache Key**: `categories:list:{search || 'all'}:{limit || 50}:{offset || 0}`
- **Invalidate On**: `POST /api/categories` using pattern deletion `categories:list:*`
- **Files**:
  - GET/POST: [src/app/api/categories/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/categories/route.ts)

### 8. Brands (`GET /api/brands`, `POST /api/brands`)
- **Why**: Brands are used broadly in filters and typeahead with pagination; benefit from cached pages of results.
- **Strategy**: Cache with explicit invalidation on create. Parameterize by `search`, `limit`, `offset`.
- **Cache Key**: `brands:list:{search || 'all'}:{limit || 50}:{offset || 0}`
- **Invalidate On**: `POST /api/brands` using pattern deletion `brands:list:*`
- **Files**:
  - GET/POST: [src/app/api/brands/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/brands/route.ts)

### 9. Suppliers (`GET /api/suppliers`, `POST /api/suppliers`)
- **Why**: Supplier lists are consulted in Stock In workflows with type-to-create; cached reads reduce load while still reflecting new entries via invalidation.
- **Strategy**: Cache with explicit invalidation on create. Parameterize by `search`, `limit`, and (if added later) `offset`.
- **Cache Key**: `suppliers:list:{search || 'all'}:{limit || 50}:{offset || 0}`
- **Invalidate On**: `POST /api/suppliers` using pattern deletion `suppliers:list:*`
- **Files**:
  - GET/POST: [src/app/api/suppliers/route.ts](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/app/api/suppliers/route.ts)

## Implementation Steps

1. **Install Redis Client**
   - Install `ioredis` or `@upstash/redis` (if using serverless/Vercel).
   - Set up the Redis connection utility (`src/lib/redis.ts`).

2. **Implement Caching Utility Functions**
   - Create helper functions: `getCachedData(key)`, `setCachedData(key, data, ttl)`, and `invalidateCache(key)`.

3. **Update API Routes**
   - **Settings API**: 
     - Update `GET /api/settings` to check Redis first.
     - Update `POST /api/settings` to call `invalidateCache('store:settings')`.
   - **Dashboard API**:
     - Wrap the logic in `GET /api/dashboard` to check `dashboard:summary`. If empty, calculate, store in Redis with a 5-minute TTL, and return.
   - **Reports APIs**:
     - Apply similar TTL caching logic based on the request URL parameters.
   - **Setup Admin API**:
     - Create a helper function `isSetupComplete()` that checks Redis `system:setup_complete` first, and if missing, queries the DB and caches the result.
     - Use this helper in `src/app/setup/page.tsx` and `src/app/api/setup-admin/route.ts`.
     - In `POST /api/setup-admin`, after successful creation, call `setCachedData('system:setup_complete', true)`.
   - **Categories API**:
     - In `GET /api/categories`, build a cache key using `search`, `limit`, `offset` and return cached results when present. On DB fetch, store into Redis.
     - In `POST /api/categories`, call `invalidateCachePattern('categories:list:*')` after successful insert.
   - **Brands API**:
     - In `GET /api/brands`, build a cache key using `search`, `limit`, `offset` and return cached results when present. On DB fetch, store into Redis.
     - In `POST /api/brands`, call `invalidateCachePattern('brands:list:*')` after successful insert.
   - **Suppliers API**:
     - In `GET /api/suppliers`, build a cache key using `search`, `limit`, `offset` and return cached results when present. On DB fetch, store into Redis.
     - In `POST /api/suppliers`, call `invalidateCachePattern('suppliers:list:*')` after successful insert.

4. **Environment Variables**
   - Add `REDIS_URL` or Upstash credentials to the `.env` file.

## Assumptions & Decisions
- **Consistency vs. Performance**: For dashboards and reports, we accept eventual consistency (up to 5 minutes delay) in exchange for significant performance gains.
- **Infrastructure**: We assume a Redis instance (local or managed like Upstash/Aiven) will be provisioned.
- **Library**: `ioredis` is recommended for traditional Node environments, while `@upstash/redis` is better for edge environments like Vercel Edge functions.

## Verification
1. Call the updated APIs and measure response times. The first call should take normal time, while subsequent calls within the TTL should return in < 50ms.
2. Verify that updating settings immediately reflects on the next `GET /api/settings` call (cache invalidation works).
3. Monitor Redis memory usage to ensure keys are expiring correctly.
4. Verify that hitting `/setup` or `/api/setup-admin` after setup is complete correctly returns cached 400/redirect responses without querying the database for `COUNT(*)`.
5. Verify that creating a category/brand/supplier immediately reflects in subsequent GETs by observing that `categories:list:*`, `brands:list:*`, or `suppliers:list:*` keys are cleared and refetched.
