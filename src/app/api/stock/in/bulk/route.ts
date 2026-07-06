import { z } from 'zod';

import { db } from '@/db';
import {
  badRequest,
  json,
  readJson,
  requireApiSession,
} from '@/server/api-helpers';
import { applyStockIn, ensureSupplierId } from '@/server/stock-in';
import { invalidateCachePattern } from '@/lib/redis';

const Schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1),
        unitBuyPrice: z.number().int().min(0),
        expiryDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      }),
    )
    .min(1)
    .max(100),
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().min(1).max(80).optional(),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const supplierId = await ensureSupplierId(parsed.data);

  let results;
  try {
    results = await db.transaction(async (tx) => {
      const out = [];
      for (const item of parsed.data.items) {
        out.push(
          await applyStockIn(tx, {
            ...item,
            note: parsed.data.note,
            supplierId,
          }),
        );
      }
      return out;
    });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Stock in failed');
  }

  await invalidateCachePattern('products:catalog:*');
  await invalidateCachePattern('pos:catalog:all');
  await invalidateCachePattern('suppliers:list:*');

  const totalQty = parsed.data.items.reduce((sum, i) => sum + i.qty, 0);

  return json({ items: results, count: results.length, totalQty, supplierId });
}
