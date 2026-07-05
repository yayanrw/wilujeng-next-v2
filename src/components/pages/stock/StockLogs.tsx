'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableLoading } from '@/components/ui/TableLoading';
import { TableEmpty } from '@/components/ui/TableEmpty';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

export type StockLog = {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  type: string;
  qty: number;
  prevStock: number;
  nextStock: number;
  note: string | null;
  supplierId: string | null;
  unitBuyPrice: number | null;
  createdAt: string;
};

interface StockLogsProps {
  logs: StockLog[];
  loadingLogs: boolean;
  hasMore: boolean;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  filterProductId: string | null;
  onFilterProductIdChange: (id: string | null) => void;
  type: string;
  onTypeChange: (type: string) => void;
  onLoadMore: () => void;
  onViewDetail: (logId: string) => void;
}

export function StockLogs({
  logs,
  loadingLogs,
  hasMore,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  filterProductId,
  onFilterProductIdChange,
  type,
  onTypeChange,
  onLoadMore,
  onViewDetail,
}: StockLogsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6">
        <div className="space-y-1.5">
          <div className="text-lg font-bold tracking-tight">
            {t.stock.logsTitle}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.stock.logsSubtitle}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.reports.from}
            </label>
            <Input
              type="date"
              className="h-9 w-40 text-sm"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.reports.to}
            </label>
            <Input
              type="date"
              className="h-9 w-40 text-sm"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.type}
            </label>
            <select
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="">{t.stock.allTypes}</option>
              <option value="in">{t.stock.in}</option>
              <option value="out">{t.stock.out}</option>
              <option value="opname">{t.stock.opname}</option>
            </select>
          </div>
          <div className="w-50">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.stock.filterProduct}
            </label>
            <ProductPicker
              value={filterProductId}
              onChange={onFilterProductIdChange}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {loadingLogs && logs.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] pt-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
              <th className="py-3 px-4 font-medium">
                {t.dashboard.product}
              </th>
              <th className="py-3 px-4 font-medium">{t.stock.type}</th>
              <th className="py-3 px-4 font-medium text-right">
                {t.stock.change}
              </th>
              <th className="py-3 px-4 font-medium text-right">
                {t.stock.balance}
              </th>
              <th className="hidden sm:table-cell py-3 px-4 font-medium">
                {t.stock.notes}
              </th>
              <th className="py-3 px-4 font-medium">{t.reports.date}</th>
              <th className="py-3 px-4 font-medium text-right">
                {t.common.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loadingLogs && logs.length === 0 ? (
              <TableLoading colSpan={7} message={t.stock.loadingLogs} />
            ) : logs.length === 0 ? (
              <TableEmpty colSpan={7} message={t.stock.noLogs} />
            ) : (
              logs.map((l) => (
                <tr
                  key={l.id}
                  className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="py-3 px-4 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {l.productName ?? '-'}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      {l.productSku ?? '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        l.type === 'in'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : l.type === 'out'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {t.stock[l.type as keyof typeof t.stock]}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                    <div
                      className={`tabular-nums font-bold ${
                        l.type === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : l.type === 'out'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {l.type === 'in' ? '+' : l.type === 'out' ? '-' : ''}
                      {l.qty}
                    </div>
                    {l.unitBuyPrice && l.type === 'in' ? (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        @ {formatIdr(l.unitBuyPrice)}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-2 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      <span>{l.prevStock}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">
                        →
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {l.nextStock}
                      </span>
                    </div>
                  </td>
                  <td
                    className="hidden sm:table-cell py-3 px-4 align-middle max-w-50 truncate text-zinc-600 dark:text-zinc-400"
                    title={l.note ?? ''}
                  >
                    {l.note ?? '-'}
                  </td>
                  <td className="py-3 px-4 align-middle whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    <div>{new Date(l.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs">
                      {new Date(l.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => onViewDetail(l.id)}
                      title={t.stock.viewDetail}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{t.stock.viewDetail}</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LoadMoreButton
        onClick={onLoadMore}
        hasMore={hasMore}
        label={t.stock.loadMore}
      />
    </div>
  );
}
