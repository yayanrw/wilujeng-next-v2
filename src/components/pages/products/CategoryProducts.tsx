'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { CategoryProductsFilters } from './CategoryProductsFilters';
import { CategoryProductsTable } from './CategoryProductsTable';
import { useCategoryProducts } from './useCategoryProducts';

export function CategoryProducts() {
  const {
    categories,
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
  } = useCategoryProducts();

  return (
    <Card className="h-fit min-w-0">
      <CardHeader className="flex flex-col gap-4 pb-6">
        <div className="space-y-1.5">
          <div className="text-xl font-bold tracking-tight">
            {t.products.categoriesTitle}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {!loading && categories.length > 0
              ? `${categories.length}${hasMore ? '+' : ''} ${t.products.categoriesLoaded}`
              : t.products.categoriesSubtitle}
          </div>
        </div>
        <CategoryProductsFilters search={search} onSearchChange={setSearch} />
      </CardHeader>

      <CardContent className="p-0 min-w-0">
        <CategoryProductsTable
          categories={categories}
          loading={loading}
          hasMore={hasMore}
          onDelete={openDeleteDialog}
          onLoadMore={loadMore}
          loadMoreLabel={t.common.loadMore}
          loadingMessage={t.products.categoriesLoading}
          noDataMessage={t.products.noCategories}
          actionLabel={t.common.action}
          nameLabel={t.common.name}
          deleteLabel={t.common.delete}
        />
      </CardContent>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t.products.deleteConfirmTitle}
        description={t.products.deleteCategoryConfirmDesc}
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
