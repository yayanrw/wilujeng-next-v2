import { and, asc, eq, ilike, inArray, or } from 'drizzle-orm';

import { db } from '@/db';
import { categories, productTiers, products } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

function nonEmpty(s: string | null | undefined) {
  const v = (s ?? '').trim();
  return v.length ? v : null;
}

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const query = nonEmpty(searchParams.get('query'));
  const categoryId = nonEmpty(searchParams.get('categoryId'));

  // Pagination
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit =
    isNaN(limitParam) || limitParam <= 0 ? 20 : Math.min(limitParam, 100);
  const offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  const where = and(
    query
      ? or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`),
        )
      : undefined,
    categoryId && categoryId !== 'all'
      ? eq(products.categoryId, categoryId)
      : undefined,
  );

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      stock: products.stock,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(asc(products.name))
    .limit(limit)
    .offset(offset);

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

  return json(
    rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      basePrice: r.basePrice,
      stock: r.stock,
      category: r.categoryId
        ? { id: r.categoryId, name: r.categoryName ?? '' }
        : null,
      tiers: tiersByProduct.get(r.id) ?? [],
    })),
  );
}
