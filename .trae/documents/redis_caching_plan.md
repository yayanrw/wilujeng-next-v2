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

### 5. Other Reports (`GET /api/reports/*`)
- **APIs**: Sales, Low Stock, Receivables, Suppliers.
- **Why**: Similar to PNL, these involve joins and aggregations.
- **Strategy**: Parameterized caching with short TTL (e.g., 1-5 minutes) to reduce database load during peak reporting times.

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