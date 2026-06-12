'use client';

import { useState } from 'react';
import { CheckCircle2, ScanLine, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';
import { formatIdr } from '@/utils/money';
import { BarcodeScannerModal } from '@/components/pages/pos/BarcodeScannerModal';

type Tier = { minQty: number; price: number };

type CheckResult =
  | { found: false }
  | {
      found: true;
      product: {
        sku: string;
        name: string;
        basePrice: number;
        buyPrice?: number;
        stock: number;
        isActive: boolean;
        tiers: Tier[];
      };
    };

type T = ReturnType<typeof useTranslation>['t'];

export function SkuCheckerClient() {
  const { t } = useTranslation();
  const [sku, setSku] = useState('');
  const [queried, setQueried] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function check(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setQueried(trimmed);
    try {
      const res = await fetch(`/api/products/sku-check?sku=${encodeURIComponent(trimmed)}`);
      const body = (await res.json()) as CheckResult;
      setResult(body);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  }

  function handleScan(scanned: string) {
    setScannerOpen(false);
    setSku(scanned);
    void check(scanned);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t.skuChecker.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.skuChecker.subtitle}</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void check(sku);
            }}
          >
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={t.skuChecker.placeholder}
              className="flex-1"
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setScannerOpen(true)}
              title={t.pos.scannerTitle}
            >
              <ScanLine className="h-4 w-4" />
            </Button>
            <Button type="submit" size="sm" disabled={!sku.trim() || loading}>
              {loading ? '...' : t.skuChecker.check}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result !== null && (
        result.found ? (
          <FoundCard product={result.product} t={t} />
        ) : (
          <NotFoundCard sku={queried} t={t} />
        )
      )}

      <BarcodeScannerModal
        open={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

function NotFoundCard({ sku, t }: { sku: string; t: T }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t.skuChecker.notFound}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              SKU: <span className="font-mono font-medium">{sku}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FoundCard({
  product,
  t,
}: {
  product: Extract<CheckResult, { found: true }>['product'];
  t: T;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {product.name}
              </div>
              <div className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {product.sku}
              </div>
            </div>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              product.isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
            )}
          >
            {product.isActive ? t.skuChecker.active : t.skuChecker.inactive}
          </span>
        </div>

        <div className={cn('grid gap-3', product.buyPrice !== undefined ? 'grid-cols-3' : 'grid-cols-2')}>
          <StatBox label={t.skuChecker.stock} value={String(product.stock)} />
          <StatBox label={t.skuChecker.basePrice} value={formatIdr(product.basePrice)} highlight />
          {product.buyPrice !== undefined && (
            <StatBox label={t.skuChecker.buyPrice} value={formatIdr(product.buyPrice)} />
          )}
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {t.skuChecker.tierPricing}
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {t.skuChecker.minQty}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {t.skuChecker.pricePerUnit}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">1+</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatIdr(product.basePrice)}
                    <span className="ml-1 text-[10px] text-zinc-400">(base)</span>
                  </td>
                </tr>
                {product.tiers.map((tier) => (
                  <tr
                    key={tier.minQty}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{tier.minQty}+</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatIdr(tier.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-semibold tabular-nums',
          highlight
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-700 dark:text-zinc-300',
        )}
      >
        {value}
      </div>
    </div>
  );
}
