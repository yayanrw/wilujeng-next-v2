import type { Metadata } from 'next';
import { PosClient } from "@/components/pages/PosClient";

export const metadata: Metadata = { title: 'POS' };

export default function PosPage() {
  return <PosClient />;
}

