import { db } from '@/db';
import { products } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';
import { getCachedData, setCachedData } from '@/lib/redis';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const cacheKey = 'pos:stocks:all';

  // Try to get from Redis (short TTL)
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return json(cached);
  }

  // Fetch only IDs and Stock levels
  const stocks = await db
    .select({
      id: products.id,
      stock: products.stock,
    })
    .from(products)
    .where(and(eq(products.isDeleted, false), eq(products.isActive, true)));

  // Cache for 10 seconds as per plan
  await setCachedData(cacheKey, stocks, 10);

  return json(stocks);
}
