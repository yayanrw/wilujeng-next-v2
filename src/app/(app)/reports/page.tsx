import { ReportsClient } from "@/components/pages/ReportsClient";
import { requireAdmin } from "@/lib/server-session";

export default async function ReportsPage() {
  await requireAdmin();
  return <ReportsClient />;
}

