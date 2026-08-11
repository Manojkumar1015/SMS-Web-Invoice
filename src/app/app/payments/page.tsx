'use client';

import * as React from 'react';
import { paymentService } from '@/services';
import { Payment } from '@/types/payment';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, Column } from '@/components/ui/data-table';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const fetchPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments({ search });
      setPayments(res.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns: Column<Payment>[] = [
    {
      header: 'Payment #',
      cell: (p) => <span className="font-semibold font-mono text-accent">{p.paymentNumber}</span>,
    },
    { header: 'Customer', accessorKey: 'customerName' },
    {
      header: 'Invoice #',
      cell: (p) => (
        <Link href={`/app/invoices/${p.invoiceId}`} className="font-mono text-slate-700 hover:underline">
          {p.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (p) => <DateDisplay date={p.date} /> },
    {
      header: 'Method',
      cell: (p) => (
        <span className="capitalize text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {p.paymentMethod.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Reference / UTR',
      cell: (p) => <span className="font-mono text-xs text-slate-500">{p.referenceNumber || '-'}</span>,
    },
    {
      header: 'Amount Received',
      cell: (p) => <CurrencyDisplay amount={p.amount} className="font-bold text-emerald-600 text-sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Received"
        subtitle="Log of cleared customer bank transfers, credit cards, and UPI receipts."
      />

      <div className="flex items-center justify-between">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search payments by number, customer, invoice..." />
      </div>

      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        emptyMessage="No payments received yet."
      />
    </div>
  );
}
