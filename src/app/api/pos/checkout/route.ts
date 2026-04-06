import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import {
  customers,
  productTiers,
  products,
  stockLogs,
  transactionItems,
  transactions,
} from '@/db/schema';
import { badRequest, json, requireApiSession } from '@/server/api-helpers';
import { computePayment, type PaymentMethod } from '@/utils/checkout';
import { getTierPrice } from '@/utils/tier-pricing';
import { invalidateCachePattern } from '@/lib/redis';

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
});

export async function POST(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      basePrice: products.basePrice,
      buyPrice: products.buyPrice,
      stock: products.stock,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  if (productRows.length !== productIds.length) {
    return badRequest('One or more products are missing');
  }

  const tiers = await db
    .select({
      productId: productTiers.productId,
      minQty: productTiers.minQty,
      price: productTiers.price,
    })
    .from(productTiers)
    .where(inArray(productTiers.productId, productIds))
    .orderBy(asc(productTiers.minQty));

  const tiersByProduct = new Map<string, { minQty: number; price: number }[]>();
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
      return json(
        { error: { message: `Insufficient stock for ${p.name}` } },
        { status: 409 },
      );
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
    return badRequest('Customer is required for debt or partial payment');
  }

  const branding = await db.query.settings.findFirst({
    orderBy: (t) => [desc(t.updatedAt)],
  });

  const txResult = await db.transaction(async (tx) => {
    if (parsed.data.customerId) {
      const customer = await tx.query.customers.findFirst({
        where: (t, { eq: eq2 }) => eq2(t.id, parsed.data.customerId!),
      });
      if (!customer) throw new Error('Customer not found');

      if (parsed.data.debtPaymentAmount && parsed.data.debtPaymentAmount > 0) {
        if (parsed.data.debtPaymentAmount > customer.totalDebt) {
          throw new Error('Debt payment amount exceeds total debt');
        }

        await tx.insert(transactions).values({
          customerId: customer.id,
          userId: session.user.id,
          totalAmount: 0,
          paymentMethod: parsed.data.paymentMethod, // Assuming same payment method as checkout
          amountReceived: parsed.data.debtPaymentAmount,
          change: 0,
          status: 'paid_debt',
          createdAt: new Date(),
        });

        // We will subtract this amount from totalDebt in the update below
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

    if (!createdTx) throw new Error('Failed to create transaction');

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
      });
    }

    if (parsed.data.customerId) {
      const pointsAdd = Math.floor(totalAmount / 1000);
      const debtAdd = payment.outstandingDebt;
      const debtPay = parsed.data.debtPaymentAmount ?? 0;

      await tx
        .update(customers)
        .set({
          points: sql`${customers.points} + ${pointsAdd}`,
          totalDebt: sql`${customers.totalDebt} + ${debtAdd} - ${debtPay}`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, parsed.data.customerId));
    }

    return { id: createdTx.id };
  });

  await invalidateCachePattern('products:catalog:*');

  return json({
    transactionId: txResult.id,
    totalAmount,
    amountReceived: parsed.data.amountReceived,
    change: payment.change,
    status: payment.status,
    outstandingDebt: payment.outstandingDebt,
    printable: {
      storeName: branding?.storeName ?? 'SimplePOS Pro',
      storeIconName: branding?.storeIconName ?? 'Store',
      storeAddress: branding?.storeAddress ?? '',
      storePhone: branding?.storePhone ?? '',
      receiptFooter: branding?.receiptFooter ?? 'Terima kasih telah berbelanja',
      items: lineItems.map((i) => ({
        sku: i.sku,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      totals: {
        totalAmount,
        amountReceived: parsed.data.amountReceived,
        change: payment.change,
      },
    },
  });
}
