import type { Metadata } from 'next';
import { StockClient } from "@/components/pages/StockClient";

export const metadata: Metadata = { title: 'Stock' };

export default function StockPage() {
  return <StockClient />;
}

