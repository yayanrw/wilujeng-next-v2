'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { formatIdr } from '@/utils/money';
import { StatCard } from '@/components/shared/StatCard';
import { Products } from './products/Products';
import { BrandProducts } from './products/BrandProducts';
import { CategoryProducts } from './products/CategoryProducts';
import { SupplierProducts } from './products/SupplierProducts';

type StatFilter = 'active' | 'inactive' | 'out_of_stock' | 'low_stock' | 'bxgy';

type ProductStats = {
  totalActive: number;
  outOfStock: number;
  lowStock: number;
  inventoryValue: number;
  inactive: number;
  activeBxgy: number;
};

export function ProductsClient() {
  const [tab, setTab] = useState<
    'products' | 'brands' | 'categories' | 'suppliers'
  >('products');
  const [statFilter, setStatFilter] = useState<StatFilter | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { t } = useTranslation();

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/products/stats');
      if (res.ok) setStats((await res.json()) as ProductStats);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  function toggleFilter(f: StatFilter) {
    setStatFilter((prev) => (prev === f ? null : f));
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {t.nav.products}
      </div>

      {/* Stats cards — shown only on the products tab */}
      {tab === 'products' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mx-1">
          <StatCard
            label={t.products.statActive}
            value={stats?.totalActive ?? 0}
            tone="neutral"
            active={statFilter === 'active'}
            loading={statsLoading}
            onClick={() => toggleFilter('active')}
          />
          <StatCard
            label={t.products.statOutOfStock}
            value={stats?.outOfStock ?? 0}
            tone="danger"
            active={statFilter === 'out_of_stock'}
            loading={statsLoading}
            onClick={() => toggleFilter('out_of_stock')}
          />
          <StatCard
            label={t.products.statLowStock}
            value={stats?.lowStock ?? 0}
            tone="warning"
            active={statFilter === 'low_stock'}
            loading={statsLoading}
            onClick={() => toggleFilter('low_stock')}
          />
          <StatCard
            label={t.products.statInventoryValue}
            value={stats ? formatIdr(stats.inventoryValue) : '—'}
            tone="info"
            clickable={false}
            loading={statsLoading}
          />
          <StatCard
            label={t.products.statInactive}
            value={stats?.inactive ?? 0}
            tone="neutral"
            active={statFilter === 'inactive'}
            loading={statsLoading}
            onClick={() => toggleFilter('inactive')}
          />
          <StatCard
            label={t.products.statBxgy}
            value={stats?.activeBxgy ?? 0}
            tone="success"
            active={statFilter === 'bxgy'}
            loading={statsLoading}
            onClick={() => toggleFilter('bxgy')}
          />
        </div>
      )}

      <div className="flex gap-2 min-w-0">
        {(['products', 'brands', 'categories', 'suppliers'] as const).map(
          (tTab) => (
            <button
              key={tTab}
              type="button"
              className={
                tTab === tab
                  ? 'rounded-full bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }
              onClick={() => {
                setTab(tTab);
                if (tTab !== 'products') setStatFilter(null);
              }}
            >
              {t.products?.[tTab]}
            </button>
          ),
        )}
      </div>

      {tab === 'products' && (
        <Products
          statFilter={statFilter ?? undefined}
          onProductChanged={fetchStats}
        />
      )}
      {tab === 'brands' && <BrandProducts />}
      {tab === 'categories' && <CategoryProducts />}
      {tab === 'suppliers' && <SupplierProducts />}
    </div>
  );
}
