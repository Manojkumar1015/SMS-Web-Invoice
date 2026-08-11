'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quoteService, customerService } from '@/services';
import { Quote } from '@/types/quote';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { QuoteStatusBadge } from '@/components/domain/quote/quote-status-badge';
import { DocumentNumber } from '@/components/ui/document-number';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { ConvertQuoteDialog } from '@/components/domain/quote/convert-quote-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { Plus, Eye, Edit, Copy, Download, Send, ArrowRight, Trash2, MoreHorizontal, Filter, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export default function QuotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [customerFilter, setCustomerFilter] = React.useState('all');
  const [dateStart, setDateStart] = React.useState('');
  const [dateEnd, setDateEnd] = React.useState('');
  const [minAmount, setMinAmount] = React.useState('');
  const [maxAmount, setMaxAmount] = React.useState('');
  const [sortBy, setSortBy] = React.useState('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [convertingQuote, setConvertingQuote] = React.useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = React.useState<Quote | null>(null);

  React.useEffect(() => {
    customerService.getCustomers().then((res) => setCustomers(res.data));
  }, []);

  const fetchQuotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await quoteService.getQuotes({
        search,
        status: statusFilter,
        customerId: customerFilter !== 'all' ? customerFilter : undefined,
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        sortBy,
      });
      setQuotes(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, customerFilter, dateStart, dateEnd, minAmount, maxAmount, sortBy]);

  React.useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleDelete = async () => {
    if (!deletingQuote) return;
    await quoteService.deleteQuote(deletingQuote.id);
    toast({ title: 'Quote Deleted', description: `Deleted quote ${deletingQuote.quoteNumber}.`, variant: 'info' });
    setDeletingQuote(null);
    fetchQuotes();
  };

  const handleDuplicate = async (q: Quote) => {
    try {
      const dup = await quoteService.duplicateQuote(q.id);
      toast({ title: 'Quote Duplicated', description: `Created new draft ${dup.quoteNumber}.`, variant: 'success' });
      fetchQuotes();
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate quote.', variant: 'destructive' });
    }
  };

  const handleSend = async (q: Quote) => {
    try {
      await quoteService.sendQuote(q.id);
      toast({ title: 'Quote Sent', description: `Marked quote ${q.quoteNumber} as sent.`, variant: 'info' });
      fetchQuotes();
    } catch {
      toast({ title: 'Error', description: 'Could not send quote.', variant: 'destructive' });
    }
  };

  const columns: Column<Quote>[] = [
    {
      header: 'Quote Number',
      cell: (q) => (
        <Link href={`/app/quotes/${q.id}`} className="hover:underline">
          <DocumentNumber number={q.quoteNumber} type="quote" />
        </Link>
      ),
    },
    {
      header: 'Customer',
      cell: (q) => (
        <div>
          <Link href={`/app/quotes/${q.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block">
            {q.customerName}
          </Link>
          <span className="text-[11px] text-slate-500 block">{q.customerEmail}</span>
        </div>
      ),
    },
    { header: 'Quote Date', cell: (q) => <DateDisplay date={q.date} className="text-slate-700" /> },
    { header: 'Expiry Date', cell: (q) => <DateDisplay date={q.expiryDate} className="text-slate-700" /> },
    {
      header: 'Amount',
      cell: (q) => <CurrencyDisplay amount={q.total} className="font-extrabold text-slate-900 text-sm" />,
    },
    { header: 'Status', cell: (q) => <QuoteStatusBadge status={q.status} /> },
    {
      header: 'Actions',
      cell: (q) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/app/quotes/${q.id}`)}>
              <Eye className="h-4 w-4 mr-2 text-slate-600" /> View Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/app/quotes/${q.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2 text-slate-600" /> Edit Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicate(q)}>
              <Copy className="h-4 w-4 mr-2 text-slate-600" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSend(q)}>
              <Send className="h-4 w-4 mr-2 text-slate-600" /> Send to Client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: 'Download PDF', description: `Downloaded PDF for ${q.quoteNumber}`, variant: 'info' })}>
              <Download className="h-4 w-4 mr-2 text-slate-600" /> Download PDF
            </DropdownMenuItem>
            {q.status !== 'converted' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConvertingQuote(q)} className="text-indigo-600 font-semibold focus:text-indigo-700">
                  <ArrowRight className="h-4 w-4 mr-2" /> Convert to Invoice
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeletingQuote(q)} className="text-red-600 focus:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        subtitle="Create, send and manage customer quotations."
        actions={
          <Button size="sm" onClick={() => router.push('/app/quotes/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            + New Quote
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <FilterBar
        options={[
          { value: 'all', label: 'All' },
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'viewed', label: 'Viewed' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'declined', label: 'Declined' },
          { value: 'expired', label: 'Expired' },
          { value: 'converted', label: 'Converted' },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Primary Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <SearchInput value={search} onSearchChange={setSearch} placeholder="Search quotes by number, customer, email..." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Filter */}
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Menu */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest Date</SelectItem>
              <SelectItem value="date_asc">Oldest Date</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="amount_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1 text-slate-500" />
            {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
          </Button>
        </div>
      </div>

      {/* Expanded Toolbar Filters */}
      {showAdvancedFilters && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-500 font-semibold mb-1 block">Start Date</label>
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-8 text-xs bg-white" />
          </div>
          <div>
            <label className="text-slate-500 font-semibold mb-1 block">End Date</label>
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-8 text-xs bg-white" />
          </div>
          <div>
            <label className="text-slate-500 font-semibold mb-1 block">Min Amount (₹)</label>
            <Input type="number" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="h-8 text-xs bg-white" />
          </div>
          <div>
            <label className="text-slate-500 font-semibold mb-1 block">Max Amount (₹)</label>
            <div className="flex items-center space-x-1">
              <Input type="number" placeholder="500000" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="h-8 text-xs bg-white" />
              {(dateStart || dateEnd || minAmount || maxAmount) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500"
                  onClick={() => {
                    setDateStart('');
                    setDateEnd('');
                    setMinAmount('');
                    setMaxAmount('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={quotes}
        keyExtractor={(q) => q.id}
        isLoading={loading}
        emptyMessage="No quotes found matching your filters. Click '+ New Quote' to create your first quotation."
      />

      {/* Convert to Invoice Confirmation Dialog */}
      {convertingQuote && (
        <ConvertQuoteDialog
          open={!!convertingQuote}
          onOpenChange={(open) => !open && setConvertingQuote(null)}
          quote={convertingQuote}
          onSuccess={() => fetchQuotes()}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingQuote && (
        <ConfirmDialog
          open={!!deletingQuote}
          onOpenChange={(open) => !open && setDeletingQuote(null)}
          title="Delete Quotation?"
          description={`Are you sure you want to remove quote ${deletingQuote.quoteNumber}? This action cannot be undone.`}
          confirmLabel="Delete Quote"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
