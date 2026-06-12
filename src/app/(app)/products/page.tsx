import type { Metadata } from 'next';
import { requireAdmin } from "@/lib/server-session";
import { ProductsClient } from "@/components/pages/ProductsClient";

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  await requireAdmin();
  return <ProductsClient />;
}

