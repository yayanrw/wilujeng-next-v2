import { inArray } from 'drizzle-orm';
import { db } from './src/db/index';
import { products } from './src/db/schema';
async function test() {
  await db.transaction(async (tx) => {
    const p = await tx.select().from(products).where(inArray(products.id, ['1'])).for('update');
  });
}
