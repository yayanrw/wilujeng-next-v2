import * as xlsx from 'xlsx';

import { db } from '@/db';
import { brands, categories, products } from '@/db/schema';
import { badRequest, json, requireApiRole } from '@/server/api-helpers';
import { invalidateCachePattern } from '@/lib/redis';

async function ensureCategoryByName(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return null;
  const [created] = await db
    .insert(categories)
    .values({ name: cleanName })
    .onConflictDoNothing()
    .returning();
  if (created) return created.id;
  const existing = await db.query.categories.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, cleanName),
  });
  return existing?.id ?? null;
}

async function ensureBrandByName(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return null;
  const [created] = await db
    .insert(brands)
    .values({ name: cleanName })
    .onConflictDoNothing()
    .returning();
  if (created) return created.id;
  const existing = await db.query.brands.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, cleanName),
  });
  return existing?.id ?? null;
}

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return badRequest('No file uploaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.length) {
      return badRequest('Excel file is empty');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData =
      xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (!rawData.length) {
      return badRequest('No data found in the Excel file');
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Cache to avoid hitting DB for the same category/brand repeatedly
    const categoryCache = new Map<string, string | null>();
    const brandCache = new Map<string, string | null>();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Assuming row 1 is header

      try {
        const sku = String(row['SKU'] ?? '').trim();
        const name = String(row['Name'] ?? '').trim();
        const categoryName = String(row['Category'] ?? '').trim();
        const brandName = String(row['Brand'] ?? '').trim();
        const basePrice = parseInt(String(row['Base Price'] ?? '0'), 10);
        const buyPrice = parseInt(String(row['Buy Price'] ?? '0'), 10);
        const stock = parseInt(String(row['Stock'] ?? '0'), 10);
        const minStockThreshold = parseInt(String(row['Min Stock'] ?? '0'), 10);

        if (!sku || !name) {
          errors.push(`Row ${rowNum}: Missing SKU or Name`);
          errorCount++;
          continue;
        }

        if (
          isNaN(basePrice) ||
          isNaN(buyPrice) ||
          isNaN(stock) ||
          isNaN(minStockThreshold)
        ) {
          errors.push(
            `Row ${rowNum}: Invalid numeric value for prices or stock`,
          );
          errorCount++;
          continue;
        }

        let categoryId = null;
        if (categoryName) {
          if (categoryCache.has(categoryName)) {
            categoryId = categoryCache.get(categoryName);
          } else {
            categoryId = await ensureCategoryByName(categoryName);
            categoryCache.set(categoryName, categoryId);
          }
        }

        let brandId = null;
        if (brandName) {
          if (brandCache.has(brandName)) {
            brandId = brandCache.get(brandName);
          } else {
            brandId = await ensureBrandByName(brandName);
            brandCache.set(brandName, brandId);
          }
        }

        await db
          .insert(products)
          .values({
            sku,
            name,
            categoryId,
            brandId,
            basePrice,
            buyPrice,
            stock,
            minStockThreshold,
          })
          .onConflictDoUpdate({
            target: products.sku,
            set: {
              name,
              categoryId,
              brandId,
              basePrice,
              buyPrice,
              stock,
              minStockThreshold,
              updatedAt: new Date(),
            },
          });

        successCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${rowNum}: ${message}`);
        errorCount++;
      }
    }

    // Invalidate caches
    if (successCount > 0) {
      await invalidateCachePattern('products:catalog:*');
      await invalidateCachePattern('categories:list:*');
      await invalidateCachePattern('brands:list:*');
    }

    return json({
      success: true,
      message: `Imported ${successCount} products successfully.`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Return top 10 errors max
    });
  } catch (error) {
    console.error('Import error:', error);
    return badRequest('Failed to process the import file');
  }
}
