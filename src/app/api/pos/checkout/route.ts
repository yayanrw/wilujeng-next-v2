import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import {
  customers,
  debtPayments,
  pointsLog,
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

  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];

  try {
    const txResult = await db.transaction(async (tx) => {
      const productRows = await tx
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          basePrice: products.basePrice,
          buyPrice: products.buyPrice,
          stock: products.stock,
        })
        .from(products)
        .where(inArray(products.id, productIds))
        .for('update');

      if (productRows.length !== productIds.length) {
        throw new Error('missing_products');
      }

      const tiers = await tx
        .select({
          productId: productTiers.productId,
          minQty: productTiers.minQty,
          price: productTiers.price,
        })
        .from(productTiers)
        .where(inArray(productTiers.productId, productIds))
        .orderBy(asc(productTiers.minQty));

      const tiersByProduct = new Map<
        string,
        { minQty: number; price: number }[]
      >();
      for (const tier of tiers) {
        const list = tiersByProduct.get(tier.productId) ?? [];
        list.push({ minQty: tier.minQty, price: tier.price });
        tiersByProduct.set(tier.productId, list);
      }

      const qtyById = new Map(
        parsed.data.items.map((i) => [i.productId, i.qty] as const),
      );
      for (const p of productRows) {
        const qty = qtyById.get(p.id) ?? 0;
        if (p.stock < qty) {
          throw new Error(`stock_insufficient:${p.name}:${p.stock}`);
        }
      }

      const lineItems = productRows.map((p) => {
        const qty = qtyById.get(p.id) ?? 0;
        const unitPrice = getTierPrice({
          basePrice: p.basePrice,
          qty,
          tiers: tiersByProduct.get(p.id) ?? [],
        });
        const subtotal = unitPrice * qty;
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          qty,
          unitPrice,
          subtotal,
          buyPrice: p.buyPrice,
          stock: p.stock,
        };
      });

      const totalAmount = lineItems.reduce((acc, i) => acc + i.subtotal, 0);
      const payment = computePayment({
        totalAmount,
        paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        amountReceived: parsed.data.amountReceived,
      });

      if (payment.status === 'debt' && !parsed.data.customerId) {
        throw new Error('customer_required');
      }

      let debtPay = 0;
      if (parsed.data.customerId) {
        const customer = await tx.query.customers.findFirst({
          where: (t, { eq: eq2 }) => eq2(t.id, parsed.data.customerId!),
        });
        if (!customer) throw new Error('customer_not_found');

        if (
          parsed.data.debtPaymentAmount &&
          parsed.data.debtPaymentAmount > 0
        ) {
          if (parsed.data.debtPaymentAmount > customer.totalDebt) {
            throw new Error('debt_exceeds_total');
          }
          debtPay = parsed.data.debtPaymentAmount;

          await tx.insert(debtPayments).values({
            customerId: customer.id,
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
              customerId: customer.id,
              delta: debtPointsAdd,
              reason: 'debt_paid',
            });
          }
        }
      }

      const [createdTx] = await tx
        .insert(transactions)
        .values({
          customerId: parsed.data.customerId ?? null,
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
        })),
      );

      for (const i of lineItems) {
        const nextStock = i.stock - i.qty;
        await tx
          .update(products)
          .set({ stock: nextStock, updatedAt: new Date() })
          .where(eq(products.id, i.productId));

        await tx.insert(stockLogs).values({
          productId: i.productId,
          type: 'out',
          qty: i.qty,
          prevStock: i.stock,
          nextStock,
          note: `sale:${createdTx.id}`,
          transactionId: createdTx.id,
        });
      }

      if (parsed.data.customerId) {
        let pointsAdd = 0;
        if (payment.status === 'paid') {
          pointsAdd = Math.floor(totalAmount / 1000);
        }
        const debtPointsAdd = Math.floor(debtPay / 1000);

        if (pointsAdd > 0) {
          await tx.insert(pointsLog).values({
            customerId: parsed.data.customerId,
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
          .where(eq(customers.id, parsed.data.customerId));
      }

      return { id: createdTx.id, lineItems, totalAmount, payment };
    });

    const branding = await db.query.settings.findFirst({
      orderBy: (t) => [desc(t.updatedAt)],
    });

    await invalidateCachePattern('products:catalog:*');
    // Invalidate POS specific caches
    await invalidateCache('pos:catalog:all');
    await invalidateCache('pos:stocks:all');

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
