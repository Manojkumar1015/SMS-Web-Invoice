'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quoteService } from '@/services';
import { Quote } from '@/types/quote';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { FilePlus, Eye, ArrowRight, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [deletingQuote, setDeletingQuote] = React.useState<Quote | null>(null);

  const fetchQuotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await quoteService.getQuotes({
        search,
        status: statusFilter,
      });
      setQuotes(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleDelete = async () => {
    if (!deletingQuote) return;
    await quoteService.deleteQuote(deletingQuote.id);
    setDeletingQuote(null);
    fetchQuotes();
  };

  const columns: Column<Quote>[] = [
    {
      header: 'Quote #',
      cell: (q) => (
        <Link href={`/app/quotes/${q.id}`} className="font-semibold text-accent hover:underline">
          {q.quoteNumber}
        </Link>
      ),
    },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Date', cell: (q) => <DateDisplay date={q.date} /> },
    { header: 'Expiry Date', cell: (q) => <DateDisplay date={q.expiryDate} /> },
    { header: 'Total', cell: (q) => <CurrencyDisplay amount={q.total} className="font-bold text-foreground" /> },
    { header: 'Status', cell: (q) => <StatusBadge status={q.status} /> },
    {
      header: 'Actions',
      cell: (q) => (
        <div className="flex items-center space-x-1">
          <Link href={`/app/quotes/${q.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Eye className="h-3.5 w-3.5 text-slate-600" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            onClick={() => setDeletingQuote(q)}
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
        title="Quotes & Price Estimates"
        subtitle="Create formal price estimates and convert accepted quotes to invoices."
        actions={
          <Button size="sm" onClick={() => router.push('/app/quotes/new')}>
            <FilePlus className="h-4 w-4 mr-1.5" />
            New Quote
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search quotes by number, customer..." />
        <FilterBar
          options={[
            { value: 'all', label: 'All Quotes', count: quotes.length },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'accepted', label: 'Accepted' },
          ]}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={quotes}
        keyExtractor={(q) => q.id}
        isLoading={loading}
        emptyMessage="No quotes found. Click 'New Quote' to generate a proposal."
      />

      {deletingQuote && (
        <ConfirmDialog
          open={!!deletingQuote}
          onOpenChange={(open) => !open && setDeletingQuote(null)}
          title="Delete Quote?"
          description={`Are you sure you want to remove quote ${deletingQuote.quoteNumber}?`}
          confirmLabel="Delete Quote"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
