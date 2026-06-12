import type { Metadata } from 'next';
import { CustomersClient } from "@/components/pages/CustomersClient";

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return <CustomersClient />;
}

