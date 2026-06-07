'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { ProductForm } from './ProductForm';
import { ProductFilters } from './ProductFilters';
import { ImportProductModal } from './ImportProductModal';
import { QuickStockInModal } from './QuickStockInModal';
import { ProductsTable } from './ProductsTable';
import { useProducts } from './useProducts';

export function Products({
  statFilter,
  onProductChanged,
}: {
  statFilter?: string;
  onProductChanged?: () => void;
}) {
  const {
    products, loading, hasMore, search, setSearch, loadMore,
    categoryId, setCategoryId, brandId, setBrandId,
    sortField, sortDir, handleSort,
    editId, setEditId, selected,
    isDeleteDialogOpen, openDeleteDialog, closeDeleteDialog, confirmDelete, deleting,
    handleStatusChange,
    quickStockInProduct, setQuickStockInProduct, handleQuickStockInSuccess,
    isImportModalOpen, setIsImportModalOpen, handleImportSuccess,
    handleSaved,
    t, Toast,
  } = useProducts({ statFilter, onProductChanged });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] min-w-0 overflow-x-hidden">
      <Card className="h-fit min-w-0">
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="text-xl font-bold tracking-tight">
              {t.products.title}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {!loading && products.length > 0
                ? `${products.length}${hasMore ? '+' : ''} ${t.products.productsLoaded}`
                : t.products.subtitle}
            </div>
          </div>
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            brandId={brandId}
            onBrandChange={setBrandId}
            onImport={() => setIsImportModalOpen(true)}
          />
        </CardHeader>
        <CardContent className="p-0 min-w-0">
          <ProductsTable
            products={products}
            loading={loading}
            hasMore={hasMore}
            sortField={sortField}
            sortDir={sortDir}
            editId={editId}
            statFilter={statFilter}
            onSort={handleSort}
            onEdit={setEditId}
            onDelete={openDeleteDialog}
            onStatusChange={handleStatusChange}
            onQuickStockIn={setQuickStockInProduct}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {editId ? t.products.editProduct : t.products.newProduct}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.common.adminOnly}
              </div>
            </div>
            {editId && (
              <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>
                <Plus className="h-3 w-3 mr-1" />
                {t.products.newProduct}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode={editId ? 'edit' : 'create'}
            initial={editId ? (selected ?? undefined) : undefined}
            onSaved={handleSaved}
          />
        </CardContent>
      </Card>

      {quickStockInProduct && (
        <QuickStockInModal
          open
          productId={quickStockInProduct.id}
          productName={quickStockInProduct.name}
          currentStock={quickStockInProduct.stock}
          currentBuyPrice={quickStockInProduct.buyPrice}
          onSuccess={handleQuickStockInSuccess}
          onClose={() => setQuickStockInProduct(null)}
        />
      )}

      <ImportProductModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t.products.deleteConfirmTitle}
        description={t.products.deleteConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      <Toast />
    </div>
  );
}
