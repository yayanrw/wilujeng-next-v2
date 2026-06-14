'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { BrandProductsFilters } from './BrandProductsFilters';
import { BrandProductsTable } from './BrandProductsTable';
import { useBrandProducts } from './useBrandProducts';

export function BrandProducts() {
  const {
    brands,
    loading,
    hasMore,
    search,
    setSearch,
    loadMore,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    deleting,
    t,
    Toast,
  } = useBrandProducts();

  return (
    <Card className="h-fit min-w-0">
      <CardHeader className="flex flex-col gap-4 pb-6">
        <div className="space-y-1.5">
          <div className="text-xl font-bold tracking-tight">
            {t.products.brandsTitle}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {!loading && brands.length > 0
              ? `${brands.length}${hasMore ? '+' : ''} ${t.products.brandsLoaded}`
              : t.products.brandsSubtitle}
          </div>
        </div>
        <BrandProductsFilters search={search} onSearchChange={setSearch} />
      </CardHeader>

      <CardContent className="p-0 min-w-0">
        <BrandProductsTable
          brands={brands}
          loading={loading}
          hasMore={hasMore}
          onDelete={openDeleteDialog}
          onLoadMore={loadMore}
          loadMoreLabel={t.common.loadMore}
          loadingMessage={t.products.brandsLoading}
          noDataMessage={t.products.noBrands}
          actionLabel={t.common.action}
          nameLabel={t.common.name}
          deleteLabel={t.common.delete}
        />
      </CardContent>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t.products.deleteConfirmTitle}
        description={t.products.deleteBrandConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      <Toast />
    </Card>
  );
}
