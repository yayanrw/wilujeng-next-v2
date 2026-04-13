'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Products } from './products/Products';
import { BrandProducts } from './products/BrandProducts';
import { CategoryProducts } from './products/CategoryProducts';
import { SupplierProducts } from './products/SupplierProducts';

export function ProductsClient() {
  const [tab, setTab] = useState<
    'products' | 'brands' | 'categories' | 'suppliers'
  >('products');
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {t.nav.settings}
      </div>

      <div className="flex gap-2">
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
              onClick={() => setTab(tTab)}
            >
              {t.products?.[tTab]}
            </button>
          ),
        )}
      </div>

      {tab === 'products' && <Products />}
      {tab === 'brands' && <BrandProducts />}
      {tab === 'categories' && <CategoryProducts />}
      {tab === 'suppliers' && <SupplierProducts />}
    </div>
  );
}
