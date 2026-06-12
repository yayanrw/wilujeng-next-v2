import type { Metadata } from 'next';
import { ReportsClient } from "@/components/pages/ReportsClient";
import { requireAdmin } from "@/lib/server-session";

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage() {
  await requireAdmin();
  return <ReportsClient />;
}

