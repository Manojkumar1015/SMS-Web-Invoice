'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/services';
import { Payment } from '@/types/payment';
import { PaymentSummaryMetrics } from '@/services/interfaces/PaymentService';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, Column } from '@/components/ui/data-table';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { PaymentStatusBadge } from '@/components/domain/payment/payment-status-badge';
import { PaymentMethodBadge } from '@/components/domain/payment/payment-method-badge';
import { PaymentReceiptModal } from '@/components/domain/payment/payment-receipt-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, CreditCard, Calendar, Clock, AlertTriangle, CheckCircle2, Eye, Edit, Trash2, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [metrics, setMetrics] = React.useState<PaymentSummaryMetrics | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [methodFilter, setMethodFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [receiptPayment, setReceiptPayment] = React.useState<Payment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = React.useState<string | null>(null);

  const fetchPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const [res, summary] = await Promise.all([
        paymentService.getPayments({
          search,
          status: statusFilter,
          paymentMethod: methodFilter,
        }),
        paymentService.getPaymentSummary(),
      ]);
      setPayments(res.data);
      setMetrics(summary);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDelete = async () => {
    if (!deletingPaymentId) return;
    try {
      await paymentService.deletePayment(deletingPaymentId);
      toast({ title: 'Payment Deleted', description: 'Payment record removed.', variant: 'info' });
      setDeletingPaymentId(null);
      fetchPayments();
    } catch {
      toast({ title: 'Error', description: 'Could not delete payment.', variant: 'destructive' });
      setDeletingPaymentId(null);
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Payment ID',
      cell: (p) => (
        <Link href={`/app/payments/${p.id}`} className="font-semibold font-mono text-indigo-600 hover:underline">
          {p.paymentNumber}
        </Link>
      ),
    },
    { header: 'Customer', accessorKey: 'customerName' },
    {
      header: 'Invoice #',
      cell: (p) => (
        <Link href={`/app/invoices/${p.invoiceId}`} className="font-mono text-slate-700 hover:underline font-medium">
          {p.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Payment Date', cell: (p) => <DateDisplay date={p.date} /> },
    {
      header: 'Method',
      cell: (p) => <PaymentMethodBadge method={p.paymentMethod} />,
    },
    {
      header: 'Reference / UTR',
      cell: (p) => <span className="font-mono text-xs text-slate-500">{p.referenceNumber || '-'}</span>,
    },
    {
      header: 'Amount',
      cell: (p) => <CurrencyDisplay amount={p.amount} className="font-black text-emerald-600 text-sm font-mono" />,
    },
    {
      header: 'Status',
      cell: (p) => <PaymentStatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push(`/app/payments/${p.id}`)}>
              <Eye className="h-4 w-4 mr-2 text-slate-600" /> View Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReceiptPayment(p)}>
              <Download className="h-4 w-4 mr-2 text-slate-600" /> Download Receipt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeletingPaymentId(p.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Received"
        subtitle="Track customer payments, payment methods and outstanding balances."
        actions={
          <Button size="sm" onClick={() => router.push('/app/payments/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            + Record Payment
          </Button>
        }
      />

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Received</span>
            <CurrencyDisplay amount={metrics?.totalReceived || 0} className="text-lg font-extrabold text-slate-900 font-mono block" />
            <span className="text-[11px] text-slate-500">Lifetime collected</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">This Month</span>
            <CurrencyDisplay amount={metrics?.thisMonth || 0} className="text-lg font-extrabold text-emerald-600 font-mono block" />
            <span className="text-[11px] text-slate-500">February collections</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today</span>
            <CurrencyDisplay amount={metrics?.today || 0} className="text-lg font-extrabold text-slate-900 font-mono block" />
            <span className="text-[11px] text-slate-500">Today&apos;s receipts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending Allocation</span>
            <CurrencyDisplay amount={metrics?.pendingAllocation || 0} className="text-lg font-extrabold text-amber-600 font-mono block" />
            <span className="text-[11px] text-slate-500 font-medium">Unallocated credits</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Partially Paid</span>
            <span className="text-lg font-extrabold text-indigo-600 font-mono block">{metrics?.partiallyPaidInvoicesCount || 0}</span>
            <span className="text-[11px] text-slate-500">Invoices with partial payments</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <SearchInput value={search} onSearchChange={setSearch} placeholder="Search payments by number, customer, invoice..." />

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Payment Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="upi">UPI / QR</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
            </SelectContent>
          </Select>

          <FilterBar
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'received', label: 'Cleared' },
              { value: 'partially_allocated', label: 'Partially Allocated' },
            ]}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        emptyMessage="No payment records found."
      />

      {/* Printable Receipt Modal */}
      <PaymentReceiptModal
        open={!!receiptPayment}
        onOpenChange={(open) => !open && setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Delete Confirmation */}
      {deletingPaymentId && (
        <ConfirmDialog
          open={!!deletingPaymentId}
          onOpenChange={(open) => !open && setDeletingPaymentId(null)}
          title="Delete Payment Record?"
          description="Are you sure you want to delete this payment record? This action cannot be undone."
          confirmLabel="Delete Payment"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
