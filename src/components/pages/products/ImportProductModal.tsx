'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import * as xlsx from 'xlsx';

import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';

export function ImportProductModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  if (!open) return null;

  const handleDownloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      {
        SKU: 'PROD-001',
        Name: 'Example Product',
        Category: 'Beverages',
        Brand: 'Brand A',
        'Base Price': 15000,
        'Buy Price': 10000,
        Stock: 100,
        'Min Stock': 10,
      },
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Products');
    xlsx.writeFile(wb, 'product_import_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || t.products.importFailed || 'Import failed');
      }

      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
      }

      if (data.successCount > 0) {
        onSuccess(t.products.importSuccess || 'Import successful');
        if (!data.errors || data.errors.length === 0) {
          onClose();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during import';
      setErrors([message]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t.products.importProducts || 'Import Products'}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 hover:text-zinc-600 dark:text-zinc-400"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {t.products.selectExcelFile || 'Select an Excel (.xlsx) file to import products.'}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadTemplate}
              className="shrink-0 ml-4 bg-white dark:bg-zinc-900"
            >
              <Download className="mr-2 h-4 w-4" />
              {t.products.downloadTemplate || 'Template'}
            </Button>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="block w-full text-sm text-zinc-500 dark:text-zinc-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/30 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                cursor-pointer"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Import Errors</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 pl-4 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t.products.uploading || 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t.products.importProducts || 'Import'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
