'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { invoiceService, customerService } from '@/services';
import { Invoice } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { InvoiceStatusBadge } from '@/components/domain/invoice/invoice-status-badge';
import { DocumentNumber } from '@/components/ui/document-number';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { Plus, Eye, Edit, Copy, Download, Send, CreditCard, Trash2, Ban, MoreHorizontal, Filter, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SendDocumentDialog } from '@/components/domain/document/send-document-dialog';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [customerFilter, setCustomerFilter] = React.useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState('all');
  const [dateStart, setDateStart] = React.useState('');
  const [dateEnd, setDateEnd] = React.useState('');
  const [minAmount, setMinAmount] = React.useState('');
  const [maxAmount, setMaxAmount] = React.useState('');
  const [sortBy, setSortBy] = React.useState('date_desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Dialog state
  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = React.useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = React.useState<Invoice | null>(null);
  const [sendingInvoice, setSendingInvoice] = React.useState<Invoice | null>(null);

  React.useEffect(() => {
    customerService.getCustomers().then((res) => setCustomers(res.data));
  }, []);

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceService.getInvoices({
        search,
        status: statusFilter,
        customerId: customerFilter !== 'all' ? customerFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        sortBy,
      });
      setInvoices(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, customerFilter, paymentStatusFilter, dateStart, dateEnd, minAmount, maxAmount, sortBy]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deletingInvoice) return;
    try {
      await invoiceService.deleteInvoice(deletingInvoice.id);
      toast({ title: 'Invoice Deleted', description: `Removed invoice ${deletingInvoice.invoiceNumber}.`, variant: 'info' });
      setDeletingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      console.error('[handleDelete error]:', err);
      toast({ title: 'Error Deleting Invoice', description: err.message || 'Could not delete invoice.', variant: 'destructive' });
      setDeletingInvoice(null);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancellingInvoice) return;
    await invoiceService.cancelInvoice(cancellingInvoice.id);
    toast({ title: 'Invoice Cancelled', description: `Invoice ${cancellingInvoice.invoiceNumber} marked as cancelled.`, variant: 'info' });
    setCancellingInvoice(null);
    fetchInvoices();
  };

  const handleDuplicate = async (inv: Invoice) => {
    try {
      const dup = await invoiceService.duplicateInvoice(inv.id);
      toast({ title: 'Invoice Duplicated', description: `Created draft ${dup.invoiceNumber}.`, variant: 'success' });
      fetchInvoices();
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate invoice.', variant: 'destructive' });
    }
  };

  const handleSend = (inv: Invoice) => {
    setSendingInvoice(inv);
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/v1/invoices/${inv.id}/pdf?download=true`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to download PDF (HTTP ${res.status})`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Server returned an invalid content type.');
      }
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber || 'Invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF Downloaded', description: `Invoice ${inv.invoiceNumber}.pdf downloaded.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Failed to download PDF', variant: 'destructive' });
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice Number',
      cell: (inv) => (
        <Link href={`/app/invoices/${inv.id}`} className="hover:underline">
          <DocumentNumber number={inv.invoiceNumber} type="invoice" />
        </Link>
      ),
    },
    {
      header: 'Customer',
      cell: (inv) => (
        <div>
          <Link href={`/app/invoices/${inv.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block">
            {inv.customerName}
          </Link>
          <span className="text-[11px] text-slate-500 block">{inv.customerEmail}</span>
        </div>
      ),
    },
    { header: 'Invoice Date', cell: (inv) => <DateDisplay date={inv.date} className="text-slate-700" /> },
    { header: 'Due Date', cell: (inv) => <DateDisplay date={inv.dueDate} className="text-slate-700" /> },
    {
      header: 'Amount',
      cell: (inv) => <CurrencyDisplay amount={inv.total} className="font-extrabold text-slate-900 text-sm" />,
    },
    {
      header: 'Balance',
      cell: (inv) => (
        <CurrencyDisplay
          amount={inv.amountDue}
          className={`font-bold ${inv.amountDue > 0 ? 'text-red-600' : 'text-slate-500'}`}
        />
      ),
    },
    { header: 'Status', cell: (inv) => <InvoiceStatusBadge status={inv.status} /> },
    {
      header: 'Actions',
      cell: (inv) => (
        <div className="flex items-center space-x-1">
          {inv.amountDue > 0 && inv.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold"
              onClick={() => setPaymentInvoice(inv)}
            >
              <CreditCard className="h-3 w-3 mr-1 text-indigo-600" /> Pay
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/app/invoices/${inv.id}`)}>
                <Eye className="h-4 w-4 mr-2 text-slate-600" /> View Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/app/invoices/${inv.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2 text-slate-600" /> Edit Invoice
              </DropdownMenuItem>
              {inv.amountDue > 0 && inv.status !== 'cancelled' && (
                <DropdownMenuItem onClick={() => setPaymentInvoice(inv)} className="text-indigo-600 font-semibold">
                  <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDuplicate(inv)}>
                <Copy className="h-4 w-4 mr-2 text-slate-600" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSend(inv)}>
                <Send className="h-4 w-4 mr-2 text-slate-600" /> Send to Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPdf(inv)}>
                <Download className="h-4 w-4 mr-2 text-slate-600" /> Download PDF
              </DropdownMenuItem>
              {inv.amountPaid > 0 ? (
                <>
                  {inv.status !== 'cancelled' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCancellingInvoice(inv)} className="text-amber-700 focus:text-amber-800 font-medium">
                        <Ban className="h-4 w-4 mr-2" /> Cancel Invoice
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled
                    title="Invoices with recorded payments cannot be deleted to protect financial history"
                    className="opacity-50 cursor-not-allowed text-slate-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete (Has Payments)
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {inv.status !== 'cancelled' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCancellingInvoice(inv)} className="text-amber-700 focus:text-amber-800">
                        <Ban className="h-4 w-4 mr-2" /> Cancel Invoice
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeletingInvoice(inv)} className="text-red-600 focus:text-red-700 font-medium">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Invoice
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Create, manage and track customer invoices."
        actions={
          <Button size="sm" onClick={() => router.push('/app/invoices/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            + New Invoice
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
          { value: 'partially_paid', label: 'Partially Paid' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Primary Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <SearchInput value={search} onSearchChange={setSearch} placeholder="Search invoices by number, customer, quote #..." />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Filter */}
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-40 h-9 text-xs">
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

          {/* Payment Status Filter */}
          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid Only</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Menu */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest Date</SelectItem>
              <SelectItem value="date_asc">Oldest Date</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="due_desc">Highest Balance</SelectItem>
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
        data={invoices}
        keyExtractor={(inv) => inv.id}
        isLoading={loading}
        emptyMessage="No invoices found matching your filters. Click '+ New Invoice' to generate a bill."
      />

      {/* Record Payment Dialog */}
      {paymentInvoice && (
        <RecordPaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSuccess={() => fetchInvoices()}
        />
      )}

      {/* Confirm Cancel Invoice */}
      {cancellingInvoice && (
        <ConfirmDialog
          open={!!cancellingInvoice}
          onOpenChange={(open) => !open && setCancellingInvoice(null)}
          title="Cancel Invoice?"
          description={`Are you sure you want to cancel invoice ${cancellingInvoice.invoiceNumber}? This will mark it as cancelled.`}
          confirmLabel="Cancel Invoice"
          variant="destructive"
          onConfirm={handleCancelInvoice}
        />
      )}

      {/* Confirm Delete Invoice */}
      {deletingInvoice && (
        <ConfirmDialog
          open={!!deletingInvoice}
          onOpenChange={(open) => !open && setDeletingInvoice(null)}
          title="Delete Invoice?"
          description={`Are you sure you want to permanently remove invoice ${deletingInvoice.invoiceNumber}?`}
          confirmLabel="Delete Invoice"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}

      {/* Send Document Dialog */}
      {sendingInvoice && (
        <SendDocumentDialog
          open={!!sendingInvoice}
          onOpenChange={(open) => !open && setSendingInvoice(null)}
          document={{
            id: sendingInvoice.id,
            type: 'Invoice',
            number: sendingInvoice.invoiceNumber,
            customerName: sendingInvoice.customerName,
            customerEmail: sendingInvoice.customerEmail,
            customerPhone: sendingInvoice.customerPhone,
            date: sendingInvoice.date,
            dueDate: sendingInvoice.dueDate,
            total: sendingInvoice.total,
            amountPaid: sendingInvoice.amountPaid,
            amountDue: sendingInvoice.amountDue,
          }}
        />
      )}
    </div>
  );
}
