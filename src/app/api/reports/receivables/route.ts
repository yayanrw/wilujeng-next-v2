import { desc, gt } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { json, requireApiRole } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      totalDebt: customers.totalDebt,
    })
    .from(customers)
    .where(gt(customers.totalDebt, 0))
    .orderBy(desc(customers.totalDebt))
    .limit(500);

  return json(rows);
}
