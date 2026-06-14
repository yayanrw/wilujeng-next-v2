import { and, asc, desc, eq, gt, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import {
  customers,
  debtPayments,
  pointsLog,
  productBxgyPromos,
  productTiers,
  products,
  stockLogs,
  transactionItems,
  transactions,
} from '@/db/schema';
import { badRequest, json, requireApiSession } from '@/server/api-helpers';
import { computePayment, type PaymentMethod } from '@/utils/checkout';
import { getTierPrice } from '@/utils/tier-pricing';
import { invalidateCache, invalidateCachePattern } from '@/lib/redis';

const ItemSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1),
});

const Schema = z.object({
  items: z.array(ItemSchema).min(1),
  paymentMethod: z.enum(['cash', 'qris', 'transfer', 'debt']),
  amountReceived: z.number().int().min(0).optional().default(0),
  customerId: z.string().uuid().optional(),
  debtPaymentAmount: z.number().int().min(0).optional(),
  debtPaymentNote: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  // #1 Early fail: pure debt with no customer — reject before any DB call
  if (
    parsed.data.paymentMethod === 'debt' &&
    parsed.data.amountReceived === 0 &&
    !parsed.data.customerId
  ) {
    return badRequest('Customer is required for debt or partial payment');
  }

  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
  const { customerId } = parsed.data;
  const now = new Date();

  try {
    // #2 + #3: Pre-transaction parallel reads — tiers, promos, and customer
    // don't need a lock and can run concurrently before entering the transaction.
    const [customerRow, tiers, promoRows] = await Promise.all([
      customerId
        ? db.query.customers.findFirst({ where: (t, { eq: eq2 }) => eq2(t.id, customerId) })
        : Promise.resolve(null),
      db
        .select({
          productId: productTiers.productId,
          minQty: productTiers.minQty,
          price: productTiers.price,
        })
        .from(productTiers)
        .where(inArray(productTiers.productId, productIds))
        .orderBy(asc(productTiers.minQty)),
      db
        .select({
          productId: productBxgyPromos.productId,
          buyQty: productBxgyPromos.buyQty,
          freeQty: productBxgyPromos.freeQty,
          maxMultiplierPerTx: productBxgyPromos.maxMultiplierPerTx,
        })
        .from(productBxgyPromos)
        .where(
          and(
            inArray(productBxgyPromos.productId, productIds),
            eq(productBxgyPromos.active, true),
            gt(productBxgyPromos.freeQty, 0),
            or(isNull(productBxgyPromos.validFrom), lte(productBxgyPromos.validFrom, now)),
            or(isNull(productBxgyPromos.validTo), gte(productBxgyPromos.validTo, now)),
          ),
        ),
    ]);

    if (customerId && !customerRow) throw new Error('customer_not_found');

    const tiersByProduct = new Map<string, { minQty: number; price: number }[]>();
    for (const tier of tiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minQty: tier.minQty, price: tier.price });
      tiersByProduct.set(tier.productId, list);
    }

    const promoByProduct = new Map(promoRows.map((p) => [p.productId, p]));

    const txResult = await db.transaction(async (tx) => {
      // Transaction lock window: products FOR UPDATE + all writes only
      const productRows = await tx
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          basePrice: products.basePrice,
          buyPrice: products.buyPrice,
          averageCost: products.averageCost,
          stock: products.stock,
        })
        .from(products)
        .where(inArray(products.id, productIds))
        .for('update');

      if (productRows.length !== productIds.length) {
        throw new Error('missing_products');
      }

      const qtyById = new Map(
        parsed.data.items.map((i) => [i.productId, i.qty] as const),
      );

      const freeQtyById = new Map<string, number>();
      for (const p of productRows) {
        const qtyPaid = qtyById.get(p.id) ?? 0;
        const promo = promoByProduct.get(p.id);
        if (promo && qtyPaid >= promo.buyQty) {
          let multiplier = Math.floor(qtyPaid / promo.buyQty);
          if (promo.maxMultiplierPerTx != null) {
            multiplier = Math.min(multiplier, promo.maxMultiplierPerTx);
          }
          freeQtyById.set(p.id, multiplier * promo.freeQty);
        }
      }

      for (const p of productRows) {
        const qty = qtyById.get(p.id) ?? 0;
        const freeQty = freeQtyById.get(p.id) ?? 0;
        if (p.stock < qty + freeQty) {
          throw new Error(`stock_insufficient:${p.name}:${p.stock}`);
        }
      }

      const lineItems: {
        productId: string;
        sku: string;
        name: string;
        qty: number;
        unitPrice: number;
        subtotal: number;
        buyPrice: number;
        stock: number;
        isFree: boolean;
      }[] = [];

      for (const p of productRows) {
        const qty = qtyById.get(p.id) ?? 0;
        const unitPrice = getTierPrice({
          basePrice: p.basePrice,
          qty,
          tiers: tiersByProduct.get(p.id) ?? [],
        });
        const costSnapshot = p.averageCost > 0 ? p.averageCost : p.buyPrice;
        lineItems.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          qty,
          unitPrice,
          subtotal: unitPrice * qty,
          buyPrice: costSnapshot,
          stock: p.stock,
          isFree: false,
        });

        const freeQty = freeQtyById.get(p.id) ?? 0;
        if (freeQty > 0) {
          lineItems.push({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            qty: freeQty,
            unitPrice: 0,
            subtotal: 0,
            buyPrice: costSnapshot,
            stock: p.stock,
            isFree: true,
          });
        }
      }

      const totalAmount = lineItems.reduce((acc, i) => acc + i.subtotal, 0);
      const payment = computePayment({
        totalAmount,
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        amountReceived: parsed.data.amountReceived,
      });

      // Partial-payment debt requires totalAmount, so this check stays here
      if (payment.status === 'debt' && !customerId) {
        throw new Error('customer_required');
      }

      let debtPay = 0;
      if (customerId && customerRow) {
        if (parsed.data.debtPaymentAmount && parsed.data.debtPaymentAmount > 0) {
          if (parsed.data.debtPaymentAmount > customerRow.totalDebt) {
            throw new Error('debt_exceeds_total');
          }
          debtPay = parsed.data.debtPaymentAmount;

          await tx.insert(debtPayments).values({
            customerId: customerRow.id,
            amount: debtPay,
            method:
              parsed.data.paymentMethod !== 'debt'
                ? parsed.data.paymentMethod
                : 'cash',
            userId: session.user.id,
            note: parsed.data.debtPaymentNote,
          });

          const debtPointsAdd = Math.floor(debtPay / 1000);
          if (debtPointsAdd > 0) {
            await tx.insert(pointsLog).values({
              customerId: customerRow.id,
              delta: debtPointsAdd,
              reason: 'debt_paid',
            });
          }
        }
      }

      const [createdTx] = await tx
        .insert(transactions)
        .values({
          customerId: customerId ?? null,
          userId: session.user.id,
          totalAmount,
          paymentMethod: parsed.data.paymentMethod,
          amountReceived: parsed.data.amountReceived,
          change: payment.change,
          status: payment.status,
        })
        .returning();

      if (!createdTx) throw new Error('transaction_fail');

      await tx.insert(transactionItems).values(
        lineItems.map((i) => ({
          transactionId: createdTx.id,
          productId: i.productId,
          qty: i.qty,
          priceAtTransaction: i.unitPrice,
          subtotal: i.subtotal,
          unitBuyPrice: i.buyPrice,
        })),
      );

      // Group by productId and sum total delivered (paid + free)
      const deliveredByProduct = new Map<string, { stock: number; total: number }>();
      for (const i of lineItems) {
        const entry = deliveredByProduct.get(i.productId);
        if (entry) {
          entry.total += i.qty;
        } else {
          deliveredByProduct.set(i.productId, { stock: i.stock, total: i.qty });
        }
      }

      const deliveredEntries = [...deliveredByProduct.entries()];

      // #4 Batch stock UPDATE: single CASE WHEN instead of N individual updates
      await tx.execute(
        sql`UPDATE products SET stock = CASE id ${sql.join(
          deliveredEntries.map(([id, { stock, total }]) =>
            sql`WHEN ${id}::uuid THEN ${stock - total}`,
          ),
          sql` `,
        )} END, updated_at = NOW() WHERE id = ANY(ARRAY[${sql.join(
          deliveredEntries.map(([id]) => sql`${id}::uuid`),
          sql`, `,
        )}])`,
      );

      // #5 Batch stockLogs INSERT: single statement instead of N inserts
      await tx.insert(stockLogs).values(
        deliveredEntries.map(([productId, { stock, total }]) => ({
          productId,
          type: 'out' as const,
          qty: total,
          prevStock: stock,
          nextStock: stock - total,
          note: `sale:${createdTx.id}`,
          transactionId: createdTx.id,
        })),
      );

      if (customerId) {
        let pointsAdd = 0;
        if (payment.status === 'paid') {
          pointsAdd = Math.floor(totalAmount / 1000);
        }
        const debtPointsAdd = Math.floor(debtPay / 1000);

        if (pointsAdd > 0) {
          await tx.insert(pointsLog).values({
            customerId,
            transactionId: createdTx.id,
            delta: pointsAdd,
            reason: 'transaction',
          });
        }

        const totalPointsAdd = pointsAdd + debtPointsAdd;
        const debtAdd = payment.outstandingDebt;

        await tx
          .update(customers)
          .set({
            points: sql`${customers.points} + ${totalPointsAdd}`,
            totalDebt: sql`${customers.totalDebt} + ${debtAdd} - ${debtPay}`,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      }

      return { id: createdTx.id, lineItems, totalAmount, payment };
    });

    // #6 Parallel post-transaction: branding fetch + all cache invalidations
    const [branding] = await Promise.all([
      db.query.settings.findFirst({ orderBy: (t) => [desc(t.updatedAt)] }),
      invalidateCachePattern('products:catalog:*'),
      invalidateCache('pos:catalog:all'),
      invalidateCache('pos:stocks:all'),
    ]);

    return json({
      transactionId: txResult.id,
      totalAmount: txResult.totalAmount,
      amountReceived: parsed.data.amountReceived,
      change: txResult.payment.change,
      status: txResult.payment.status,
      outstandingDebt: txResult.payment.outstandingDebt,
      printable: {
        storeName: branding?.storeName ?? 'SimplePOS Pro',
        storeIconName: branding?.storeIconName ?? 'Store',
        storeAddress: branding?.storeAddress ?? '',
        storePhone: branding?.storePhone ?? '',
        receiptFooter:
          branding?.receiptFooter ?? 'Terima kasih telah berbelanja',
        items: txResult.lineItems.map((i) => ({
          sku: i.sku,
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
          isFree: i.isFree,
        })),
        totals: {
          totalAmount: txResult.totalAmount,
          amountReceived: parsed.data.amountReceived,
          change: txResult.payment.change,
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Transaction failed';
    if (msg.startsWith('stock_insufficient')) {
      const parts = msg.split(':');
      return json(
        {
          error: 'stock_insufficient',
          message: `Stok tidak mencukupi untuk ${parts[1]}. Tersedia: ${parts[2]}`,
        },
        { status: 409 },
      );
    }
    if (msg === 'missing_products')
      return badRequest('One or more products are missing');
    if (msg === 'customer_required')
      return badRequest('Customer is required for debt or partial payment');
    if (msg === 'customer_not_found') return badRequest('Customer not found');
    if (msg === 'debt_exceeds_total')
      return badRequest('Debt payment amount exceeds total debt');

    return json({ error: msg }, { status: 500 });
  }
}
