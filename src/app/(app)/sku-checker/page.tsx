import type { Metadata } from 'next';

import { SkuCheckerClient } from '@/components/pages/SkuCheckerClient';

export const metadata: Metadata = { title: 'SKU Check' };

export default function SkuCheckerPage() {
  return <SkuCheckerClient />;
}
