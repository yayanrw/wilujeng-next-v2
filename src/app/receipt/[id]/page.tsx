import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { products, transactionItems } from "@/db/schema";
import { getBranding } from "@/lib/branding";
import { requireSession } from "@/lib/server-session";
import { formatIdr } from "@/utils/money";

import { ReceiptClient } from "../ReceiptClient";

export default async function ReceiptPage(ctx: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await ctx.params;
  const tx = await db.query.transactions.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });
  if (!tx) notFound();
  const branding = await getBranding();

  const items = await db
    .select({
      name: products.name,
      qty: transactionItems.qty,
      unitPrice: transactionItems.priceAtTransaction,
      subtotal: transactionItems.subtotal,
    })
    .from(transactionItems)
    .leftJoin(products, eq(products.id, transactionItems.productId))
    .where(eq(transactionItems.transactionId, id));

  return (
    <div className="mx-auto w-full max-w-sm bg-white px-4 py-6 text-zinc-900">
      <style>{`
        @media print {
          body { background: #fff; }
          .print\:hidden { display: none !important; }
        }
      `}</style>

      <div className="text-center">
        <div className="text-base font-semibold">{branding.storeName}</div>
        {branding.storeAddress ? <div className="text-xs">{branding.storeAddress}</div> : null}
        {branding.storePhone ? <div className="text-xs">{branding.storePhone}</div> : null}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Transaction</span>
          <span className="font-mono">{tx.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Date</span>
          <span>{new Date(tx.createdAt).toLocaleString("id-ID")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Status</span>
          <span>{tx.status}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3">
        <div className="grid gap-2">
          {items.map((i, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate">{i.name ?? "(Unknown)"}</div>
                  <div className="text-zinc-600">{i.qty} x {formatIdr(i.unitPrice)}</div>
                </div>
                <div className="shrink-0 tabular-nums">{formatIdr(i.subtotal)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Total</span>
          <span className="tabular-nums">{formatIdr(tx.totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Paid</span>
          <span className="tabular-nums">{formatIdr(tx.amountReceived)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Change</span>
          <span className="tabular-nums">{formatIdr(tx.change)}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-center text-xs text-zinc-600">
        {branding.receiptFooter}
      </div>

      <ReceiptClient />
    </div>
  );
}
