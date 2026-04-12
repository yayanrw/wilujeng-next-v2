import { asc, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { productTiers, products } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';
import { getCachedData, setCachedData } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const cacheKey = 'pos:catalog:all';

  // Try to get from Redis first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return json(cached);
  }

  // Fetch all products with base info (no stock)
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
    })
    .from(products)
    .orderBy(asc(products.name));

  const ids = rows.map((r) => r.id);
  const tiers = ids.length
    ? await db
        .select({
          productId: productTiers.productId,
          minQty: productTiers.minQty,
          price: productTiers.price,
        })
        .from(productTiers)
        .where(inArray(productTiers.productId, ids))
        .orderBy(asc(productTiers.minQty))
    : [];

  const tiersByProduct = new Map<string, { minQty: number; price: number }[]>();
  for (const tier of tiers) {
    const list = tiersByProduct.get(tier.productId) ?? [];
    list.push({ minQty: tier.minQty, price: tier.price });
    tiersByProduct.set(tier.productId, list);
  }

  const result = rows.map((r) => ({
    ...r,
    tiers: tiersByProduct.get(r.id) ?? [],
  }));

  // Cache aggressively (e.g., 1 hour or until invalidated by admin)
  await setCachedData(cacheKey, result, 3600);

  return json(result);
}
