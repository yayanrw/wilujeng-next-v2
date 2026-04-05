import { requireAdmin } from "@/lib/server-session";
import { ProductsClient } from "@/components/pages/ProductsClient";

export default async function ProductsPage() {
  await requireAdmin();
  return <ProductsClient />;
}

