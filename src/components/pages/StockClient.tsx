'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TabNav } from '@/components/ui/TabNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from '@/hooks/useToast';
import { useStockSubmit } from '@/hooks/useStockSubmit';
import { useStockLogs } from '@/hooks/useStockLogs';

import { StockLogDetailModal } from './stock/StockLogDetailModal';
import { StockInForm } from './stock/StockInForm';
import { StockOutForm } from './stock/StockOutForm';
import { StockOpnameForm } from './stock/StockOpnameForm';
import { StockLogs } from './stock/StockLogs';

type Tab = 'in' | 'out' | 'opname' | 'logs';
type FormTab = Exclude<Tab, 'logs'>;

const TABS: Tab[] = ['in', 'out', 'opname', 'logs'];

export function StockClient() {
  const { t } = useTranslation();
  const { showToast, Toast } = useToast();

  const [tab, setTab] = useState<Tab>('in');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { submit, pending } = useStockSubmit(showToast);
  const logs = useStockLogs(tab === 'logs');

  const formDesc: Record<FormTab, string> = {
    in: t.stock.inDesc,
    out: t.stock.outDesc,
    opname: t.stock.opnameDesc,
  };

  const selectedLog = logs.logs.find((l) => l.id === selectedLogId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.stock.title} subtitle={t.stock.subtitle} />

      <TabNav
        tabs={TABS.map((value) => ({
          value,
          label: t.stock[value as keyof typeof t.stock],
        }))}
        value={tab}
        onChange={(value) => setTab(value as Tab)}
      />

      {tab === 'logs' ? (
        <Card>
          <CardContent className="pt-6">
            <StockLogs
              logs={logs.logs}
              loadingLogs={logs.loading}
              hasMore={logs.hasMore}
              dateFrom={logs.dateFrom}
              onDateFromChange={logs.setDateFrom}
              dateTo={logs.dateTo}
              onDateToChange={logs.setDateTo}
              filterProductId={logs.filterProductId}
              onFilterProductIdChange={logs.setFilterProductId}
              type={logs.type}
              onTypeChange={logs.setType}
              onLoadMore={logs.loadMore}
              onViewDetail={setSelectedLogId}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-3xl overflow-visible">
          <CardHeader className="rounded-t-xl border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {t.stock[tab as keyof typeof t.stock]}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {formDesc[tab]}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {tab === 'in' && <StockInForm submit={submit} pending={pending} />}
            {tab === 'out' && <StockOutForm submit={submit} pending={pending} />}
            {tab === 'opname' && (
              <StockOpnameForm submit={submit} pending={pending} />
            )}
          </CardContent>
        </Card>
      )}

      {selectedLog && (
        <StockLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLogId(null)}
        />
      )}
      <Toast />
    </div>
  );
}
