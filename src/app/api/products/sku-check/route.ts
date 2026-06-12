import { asc, and, ilike, eq } from 'drizzle-orm';

import { db } from '@/db';
import { productTiers, products } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';
import { getRoleFromSession } from '@/lib/authz';

export async function GET(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const sku = (searchParams.get('sku') ?? '').trim();

  if (!sku) {
    return json({ found: false });
  }

  const [product] = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      buyPrice: products.buyPrice,
      stock: products.stock,
      isActive: products.isActive,
    })
    .from(products)
    .where(and(ilike(products.sku, sku), eq(products.isDeleted, false)))
    .limit(1);

  if (!product) {
    return json({ found: false });
  }

  const tiers = await db
    .select({ minQty: productTiers.minQty, price: productTiers.price })
    .from(productTiers)
    .where(eq(productTiers.productId, product.id))
    .orderBy(asc(productTiers.minQty));

  const isAdmin = getRoleFromSession(session) === 'admin';

  return json({
    found: true,
    product: {
      sku: product.sku,
      name: product.name,
      basePrice: product.basePrice,
      ...(isAdmin ? { buyPrice: product.buyPrice } : {}),
      stock: product.stock,
      isActive: product.isActive,
      tiers,
    },
  });
}
