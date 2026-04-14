'use client';

import { useEffect, useState } from 'react';
import { ModalFrame } from '@/components/ui/ModalFrame';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

type TransactionRow = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
};

type CustomerData = {
  name: string;
  phone: string | null;
  totalDebt: number;
};

export function ReceivableDetailModal({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setCustomer(data.customer);
          setTransactions(data.transactions);
        }
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <ModalFrame
      title={t.reports.receivableDetails}
      onClose={onClose}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          {t.common.loading}
        </div>
      ) : customer ? (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-zinc-500 dark:text-zinc-400">
                  {t.customers.name}
                </span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-zinc-400">
                  {t.customers.phone}
                </span>
                <span>{customer.phone || '-'}</span>
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-zinc-400">
                  {t.reports.totalDebt}
                </span>
                <span className="text-red-600 font-semibold tabular-nums">
                  {formatIdr(customer.totalDebt)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">
                {t.reports.transactionHistory}
              </h3>
              <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-100">
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                      <th className="px-3 py-2">{t.reports.date}</th>
                      <th className="px-3 py-2">{t.reports.id}</th>
                      <th className="px-3 py-2 text-right">
                        {t.reports.totalAmount}
                      </th>
                      <th className="px-3 py-2 text-center">
                        {t.pos.paymentMethod}
                      </th>
                      <th className="px-3 py-2 text-center">
                        {t.reports.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {tx.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatIdr(tx.totalAmount)}
                        </td>
                        <td className="px-3 py-2 text-center capitalize">
                          {tx.paymentMethod}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              tx.status === 'lunas' || tx.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {transactions?.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          {t.reports.noTransactions}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500">
            {t.reports.failedToLoadCustomer}
          </div>
        )}
    </ModalFrame>
  );
}
