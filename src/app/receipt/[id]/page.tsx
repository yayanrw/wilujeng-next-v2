import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { products, transactionItems } from "@/db/schema";
import { getBranding } from "@/lib/branding";
import { requireSession } from "@/lib/server-session";
import { formatIdr } from "@/utils/money";

import { ReceiptClient } from "../ReceiptClient";
import { ReceiptContent } from "../ReceiptContent";

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
      
      <ReceiptContent tx={tx} items={items} branding={branding} />
      <ReceiptClient />
    </div>
  );
}
