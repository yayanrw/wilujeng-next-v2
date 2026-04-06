import { and, asc, eq, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { brands, categories, productTiers, products } from '@/db/schema';
import {
  badRequest,
  json,
  readJson,
  requireApiRole,
  requireApiSession,
} from '@/server/api-helpers';
import {
  getCachedData,
  setCachedData,
  invalidateCachePattern,
} from '@/lib/redis';

function nonEmpty(s: string | null | undefined) {
  const v = (s ?? '').trim();
  return v.length ? v : null;
}

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const search = nonEmpty(searchParams.get('search'));
  const categoryId = nonEmpty(searchParams.get('categoryId'));
  const brandId = nonEmpty(searchParams.get('brandId'));

  // Pagination
  const limitParam = parseInt(searchParams.get('limit') || '50', 10);
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit =
    isNaN(limitParam) || limitParam <= 0 ? 50 : Math.min(limitParam, 200);
  const offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  // Create a unique cache key based on query parameters
  const cacheKey = `products:catalog:${search || 'all'}:${categoryId || 'all'}:${brandId || 'all'}:${limit}:${offset}`;

  // Try to get data from Redis cache first
  const cachedProducts = await getCachedData(cacheKey);
  if (cachedProducts) {
    return json(cachedProducts);
  }

  const where = and(
    search ? ilike(products.name, `%${search}%`) : undefined,
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    brandId ? eq(products.brandId, brandId) : undefined,
  );

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      buyPrice: products.buyPrice,
      stock: products.stock,
      minStockThreshold: products.minStockThreshold,
      category: { id: categories.id, name: categories.name },
      brand: { id: brands.id, name: brands.name },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(where)
    .orderBy(asc(products.name))
    .limit(limit)
    .offset(offset);

  const ids = rows.map((r) => r.id);
  const tiers = ids.length
    ? await db
        .select({
          id: productTiers.id,
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

  // Calculate if there are more items to load
  // We can do a quick check by fetching one extra item, or returning a count.
  // For simplicity, we just return the items. The client will know there's more if items.length === limit.

  const mappedRows = rows.map((r) => ({
    ...r,
    category: r.category?.id ? r.category : null,
    brand: r.brand?.id ? r.brand : null,
    tiers: tiersByProduct.get(r.id) ?? [],
  }));

  // Return a standardized pagination object or just the array for backwards compatibility
  // We will wrap it in an object if the client asks for it, but to avoid breaking other parts of the app
  // we'll just return the array. The client can use the array length to determine if it should show 'load more'

  // Store the fetched data in Redis cache with explicit invalidation strategy
  await setCachedData(cacheKey, mappedRows);

  return json(mappedRows);
}

const TierSchema = z.object({
  minQty: z.number().int().min(1),
  price: z.number().int().min(1),
});

const CreateSchema = z.object({
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string().min(1).max(80).optional(),
  brandId: z.string().uuid().optional(),
  brandName: z.string().min(1).max(80).optional(),
  basePrice: z.number().int().min(0),
  buyPrice: z.number().int().min(0),
  stock: z.number().int().min(0).optional().default(0),
  minStockThreshold: z.number().int().min(0).optional().default(0),
  tiers: z.array(TierSchema).optional().default([]),
});

async function ensureCategoryId(input: {
  categoryId?: string;
  categoryName?: string;
}) {
  if (input.categoryId) return input.categoryId;
  const name = input.categoryName?.trim();
  if (!name) return null;
  const [created] = await db
    .insert(categories)
    .values({ name })
    .onConflictDoNothing()
    .returning();
  if (created) return created.id;
  const existing = await db.query.categories.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

async function ensureBrandId(input: { brandId?: string; brandName?: string }) {
  if (input.brandId) return input.brandId;
  const name = input.brandName?.trim();
  if (!name) return null;
  const [created] = await db
    .insert(brands)
    .values({ name })
    .onConflictDoNothing()
    .returning();
  if (created) return created.id;
  const existing = await db.query.brands.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const categoryId = await ensureCategoryId(parsed.data);
  const brandId = await ensureBrandId(parsed.data);

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        sku: parsed.data.sku,
        name: parsed.data.name,
        categoryId,
        brandId,
        basePrice: parsed.data.basePrice,
        buyPrice: parsed.data.buyPrice,
        stock: parsed.data.stock,
        minStockThreshold: parsed.data.minStockThreshold,
      })
      .returning();

    if (!product) throw new Error('Failed to create product');

    if (parsed.data.tiers.length) {
      await tx.insert(productTiers).values(
        parsed.data.tiers.map((t) => ({
          productId: product.id,
          minQty: t.minQty,
          price: t.price,
        })),
      );
    }

    return product;
  });

  // Invalidate product catalog cache
  await invalidateCachePattern('products:catalog:*');

  return json({ id: result.id }, { status: 201 });
}
