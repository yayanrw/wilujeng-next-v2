# Plan: Import Product Data (Excel)

## 1. Summary
This plan outlines the implementation of a bulk import feature for products using Excel (`.xlsx`) files. The import process will support creating new products and updating existing ones (upsert) based on their `SKU`. This feature will *not* include importing product tiering prices. 

## 2. Current State Analysis
Currently, products can only be created or updated individually through the `ProductsClient.tsx` UI and `POST/PATCH /api/products` endpoints. There is no bulk upload capability, which makes initial data population or large catalog updates tedious. The database schema relies on `sku` as a unique identifier for products, making it the ideal key for upsert operations.

## 3. Proposed Changes

### 3.1 Install Dependencies
- **Action:** Install the `xlsx` library to parse Excel files on the server and generate templates on the client.
- **Command:** `npm install xlsx`

### 3.2 API Endpoint: `POST /api/products/import`
- **File:** `src/app/api/products/import/route.ts` (New File)
- **What it does:** 
  1. Accepts `multipart/form-data` containing the `.xlsx` file.
  2. Parses the file using `xlsx.read`.
  3. Validates the columns: `SKU`, `Name`, `Category`, `Brand`, `Base Price`, `Buy Price`, `Stock`, `Min Stock`.
  4. Dynamically inserts any missing Categories and Brands to get their UUIDs.
  5. Performs a bulk `upsert` (Insert, or Update if SKU exists) on the `products` table using `onConflictDoUpdate` targeting the `sku` field.
  6. Invalidates Redis caches (`products:catalog:*`, `categories:list:*`, `brands:list:*`).
  7. Returns a success summary (e.g., number of imported/updated rows).

### 3.3 UI: Import Button & Modal
- **File:** `src/components/pages/ProductsClient.tsx`
  - Add an "Import" button next to the search/filter bar in the header.
- **File:** `src/components/pages/products/ImportProductModal.tsx` (New File)
  - A dialog/modal that contains:
    - A "Download Template" button (generates a dummy `.xlsx` with correct headers).
    - A file input for selecting the `.xlsx` file.
    - An upload button that sends the file to `POST /api/products/import`.
    - Loading states and success/error toast notifications.

### 3.4 Translations
- **Files:** `src/i18n/en.json` & `src/i18n/id.json`
- **What it does:** Add translation keys for the import feature (e.g., `importProducts`, `downloadTemplate`, `uploading`, `importSuccess`).

## 4. Assumptions & Decisions
- **File Format:** Excel (`.xlsx`) is used as it is more user-friendly for non-technical staff compared to CSV.
- **Conflict Resolution:** Upsert strategy. If the `SKU` already exists, the product's details (prices, stock, category, etc.) will be overwritten by the imported data.
- **Dynamic Categories/Brands:** If an imported row specifies a Category or Brand name that doesn't exist, it will be created automatically.
- **No Tiering:** As requested, product tiers (`product_tiers`) will be ignored during this import.
- **Performance:** Bulk upserts will be used instead of individual queries to ensure the import is fast even for hundreds of items.

## 5. Verification Steps
1. Click "Download Template" and verify the downloaded `.xlsx` has the correct columns.
2. Fill the template with a mix of new SKUs and existing SKUs. Include new category and brand names.
3. Upload the file and verify the success response.
4. Check the Products table in the UI to ensure new products appear and existing ones are updated.
5. Verify that the new Categories and Brands were created and are visible in their respective dropdowns.
6. Ensure that caches were correctly invalidated (the UI should show the latest data immediately after refresh).