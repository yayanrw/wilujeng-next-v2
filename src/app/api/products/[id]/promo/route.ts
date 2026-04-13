import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { productBxgyPromos } from '@/db/schema';
import { badRequest, json, requireApiRole } from '@/server/api-helpers';

const UpsertSchema = z.object({
  buyQty: z.number().int().min(1),
  freeQty: z.number().int().min(1),
  active: z.boolean().default(true),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  maxMultiplierPerTx: z.number().int().min(1).optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const promo = await db.query.productBxgyPromos.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.productId, id),
  });

  return json({ promo: promo ?? null });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { buyQty, freeQty, active, validFrom, validTo, maxMultiplierPerTx } =
    parsed.data;

  const existing = await db.query.productBxgyPromos.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.productId, id),
  });

  if (existing) {
    const [updated] = await db
      .update(productBxgyPromos)
      .set({
        buyQty,
        freeQty,
        active,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        maxMultiplierPerTx: maxMultiplierPerTx ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productBxgyPromos.productId, id),
          eq(productBxgyPromos.id, existing.id),
        ),
      )
      .returning();
    return json({ promo: updated });
  }

  const [created] = await db
    .insert(productBxgyPromos)
    .values({
      productId: id,
      buyQty,
      freeQty,
      active,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
      maxMultiplierPerTx: maxMultiplierPerTx ?? null,
    })
    .returning();

  return json({ promo: created }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { id } = await params;

  await db
    .delete(productBxgyPromos)
    .where(eq(productBxgyPromos.productId, id));

  return json({ ok: true });
}
