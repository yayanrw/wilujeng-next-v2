export async function register() {
  // Only run in the Node.js runtime — skip Edge workers
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Fire-and-forget: warm the cache in the background without blocking startup
  void warmupPosCatalog().catch((err) =>
    console.error('[warmup] POS catalog warm-up failed:', err),
  );
}

async function warmupPosCatalog() {
  const { getCachedData, setCachedData } = await import('@/lib/redis');

  const cacheKey = 'pos:catalog:all';

  const existing = await getCachedData(cacheKey);
  if (existing) {
    console.log('[warmup] pos:catalog:all already cached — skipping.');
    return;
  }

  const { db } = await import('@/db');
  const { products, productTiers } = await import('@/db/schema');
  const { and, asc, eq, inArray } = await import('drizzle-orm');

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(eq(products.isDeleted, false), eq(products.isActive, true)))
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

  await setCachedData(cacheKey, result, 3600);
  console.log(`[warmup] pos:catalog:all populated (${result.length} products).`);
}
