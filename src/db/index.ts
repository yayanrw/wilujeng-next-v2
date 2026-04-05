import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const queryClient = postgres(databaseUrl, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema });

