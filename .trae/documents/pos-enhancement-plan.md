# POS Page Enhancement Plan: Split-Cache & Local Computing Strategy

## Summary
The Point of Sale (POS) page requires performance optimization to ensure instant search and filtering capabilities for cashiers. We will implement a split-cache strategy: fetching a slow-moving, large dataset of product catalogs once, while frequently polling a lightweight endpoint for real-time stock updates. Filtering and searching will be computed entirely on the client side based on the merged data, eliminating constant server round-trips.

## Current State Analysis
- **Fetching Bottleneck**: Currently, every POS page load and potentially every filter/search triggers an API request to fetch products from Redis (and falling back to the Database on cache miss).
- **Server-Side Operations**: Search and filter operations are handled via backend requests. This approach is highly inefficient for a POS system where operations must feel instantaneous to the cashier.
- **Combined Payload**: Product details (name, price, etc.) and product stock are returned together, preventing effective caching since stock changes frequently.

## Proposed Changes
We will completely decouple the product catalog data from the product stock data. 

### 1. Backend Endpoint Adjustments
- **Catalog Endpoint (`GET /api/pos/products`)**
  - Return all base product information (e.g., `id`, `name`, `sku`, `categoryId`, `basePrice`, `tiers`).
  - **Do NOT** include real-time stock levels.
  - Cache aggressively in Redis with a long Time-to-Live (TTL).
- **Stock Endpoint (`GET /api/pos/products/stocks`)**
  - Return a highly optimized, lightweight array of objects: `[{ id: string, stock: number }]`.
  - Cache in Redis with a very short TTL (e.g., 5 - 10 seconds).

### 2. Frontend State Management & Polling
- **Catalog In-Memory Store**
  - Fetch the catalog data **once** upon initializing the POS page.
  - Store the catalog in local memory (e.g., via Zustand).
- **Stock Polling Mechanism**
  - Implement a polling cycle (e.g., using SWR, React Query, or a custom hook) to hit the stock endpoint every **30 seconds**.
- **Data Merging & Representation**
  - Use React's `useMemo` to dynamically join the static catalog data with the changing stock data based on product `id`.

### 3. Local Computing for Search & Filter
- Implement client-side searching and filtering algorithms against the merged in-memory data (`catalog + stock`).
- This guarantees near zero-latency results when typing in the search bar or changing category filters.

### 4. Server-Side Safety Net
- **Checkout & Add-to-Cart Validation**
  - The final check for sufficient stock MUST occur on the server side when items are added to the cart or during final checkout validation.

## Assumptions & Decisions
- **Total Product Count**: We assume the total number of products is manageable to hold in local browser memory (typically < 10,000 items). If the catalog size exceeds this, we may need to explore IndexedDB or paginated loading.
- **Stale Data Tolerance**: We accept that stock levels displayed on the UI might be up to 30 seconds out-of-date.
- **Cart Conflict Behavior**: If an item in the cart runs out of stock before checkout, the checkout API will reject the request, and the UI will reflect the new stock. We might need to visually warn the user if polling indicates stock is depleted while the item sits in the cart.
- **Data Invalidation**: When an admin updates product details (name/price), we assume the backend will clear the `catalog` Redis cache, and the frontend will eventually fetch the fresh data (e.g., on page refresh).

## Verification
- **Performance Profiling**: Network tab should show only one large request for `products` and tiny repetitive requests for `stocks` every 30 seconds.
- **Functionality**:
  - Filtering by category visually updates the product grid instantly without network activity.
  - Searching by product name/sku updates instantly without network activity.
- **Safety Checking**:
  - Force stock to `0` from the database while the product is on the POS screen. Verify the POS screen reflects the out-of-stock state within ~30 seconds.
  - Attempt to checkout 5 items when the stock becomes 4. Verify checkout fails gracefully with an appropriate error message and the local stock state is refreshed.

## Execution Steps (post-approval)
1. **Backend: Create/Update Endpoints**
   - Refactor `GET /api/pos/products` to exclude dynamic stock and set a long cache.
   - Create `GET /api/pos/products/stocks` to return only `{id, stock}` elements with short cache rules.
2. **Frontend: State & Data Fetching**
   - Update the POS Zustand store to handle static catalog states.
   - Implement the 30-second polling logic for `GET /api/pos/products/stocks`.
3. **Frontend: UI Logic Integration**
   - Update the POS page UI to consume the locally merged data.
   - Remove backend query parameters for search/filtering and replace them with local `Array.prototype.filter` methods.
4. **Backend/Frontend: Checkout Validation**
   - Double-check the checkout endpoint to ensure strict stock re-evaluation.
   - Implement error handling on the frontend if checkout fails due to stock issues.
5. **Testing & QA**
   - Run manual tests simulating multi-user environments (admin changing stock vs. POS making sales).
