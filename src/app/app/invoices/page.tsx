'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { invoiceService } from '@/services';
import { Invoice } from '@/types/invoice';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { Receipt, Eye, CreditCard, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = React.useState<Invoice | null>(null);

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices({
        search,
        status: statusFilter,
      });
      setInvoices(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deletingInvoice) return;
    await invoiceService.deleteInvoice(deletingInvoice.id);
    setDeletingInvoice(null);
    fetchInvoices();
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => (
        <Link href={`/app/invoices/${inv.id}`} className="font-semibold text-accent hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Date', cell: (inv) => <DateDisplay date={inv.date} /> },
    { header: 'Due Date', cell: (inv) => <DateDisplay date={inv.dueDate} /> },
    { header: 'Amount', cell: (inv) => <CurrencyDisplay amount={inv.total} className="font-bold text-foreground" /> },
    {
      header: 'Balance Due',
      cell: (inv) => (
        <CurrencyDisplay
          amount={inv.amountDue}
          className={`font-semibold ${inv.amountDue > 0 ? 'text-red-600' : 'text-slate-500'}`}
        />
      ),
    },
    { header: 'Status', cell: (inv) => <StatusBadge status={inv.status} /> },
    {
      header: 'Actions',
      cell: (inv) => (
        <div className="flex items-center space-x-1">
          {inv.amountDue > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => setPaymentInvoice(inv)}
            >
              <CreditCard className="h-3 w-3 mr-1" /> Pay
            </Button>
          )}
          <Link href={`/app/invoices/${inv.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Eye className="h-3.5 w-3.5 text-slate-600" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            onClick={() => setDeletingInvoice(inv)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices, track overdue payments, and record receipts."
        actions={
          <Button size="sm" onClick={() => router.push('/app/invoices/new')}>
            <Receipt className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search invoices by number, customer..." />
        <FilterBar
          options={[
            { value: 'all', label: 'All Invoices', count: invoices.length },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'paid', label: 'Paid' },
          ]}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        keyExtractor={(inv) => inv.id}
        isLoading={loading}
        emptyMessage="No invoices found. Click 'New Invoice' to bill a customer."
      />

      {paymentInvoice && (
        <RecordPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSuccess={() => fetchInvoices()}
        />
      )}

      {deletingInvoice && (
        <ConfirmDialog
          open={!!deletingInvoice}
          onOpenChange={(open) => !open && setDeletingInvoice(null)}
          title="Delete Invoice?"
          description={`Are you sure you want to remove invoice ${deletingInvoice.invoiceNumber}?`}
          confirmLabel="Delete Invoice"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
