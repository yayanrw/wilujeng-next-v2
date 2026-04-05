import 'server-only';

import { desc } from 'drizzle-orm';

import { db } from '@/db';

export type Branding = {
  storeName: string;
  storeIconName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
};

export async function getBranding(): Promise<Branding> {
  const row = await db.query.settings.findFirst({
    orderBy: (t) => [desc(t.updatedAt)],
  });

  return {
    storeName: row?.storeName ?? 'SimplePOS Pro',
    storeIconName: row?.storeIconName ?? 'Store',
    storeAddress: row?.storeAddress ?? '',
    storePhone: row?.storePhone ?? '',
    receiptFooter: row?.receiptFooter ?? 'Terima kasih telah berbelanja',
  };
}
