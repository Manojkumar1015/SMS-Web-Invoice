'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { expenseService } from '@/services';
import { Expense } from '@/types/expense';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { ExpenseStatusBadge } from '@/components/domain/expense/expense-status-badge';
import { ExpenseCategoryBadge } from '@/components/domain/expense/expense-category-badge';
import { ConvertExpenseDialog } from '@/components/domain/expense/convert-expense-dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, Copy, Trash2, FilePlus, Download, FileText, CheckCircle2, History, Tag, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const [expense, setExpense] = React.useState<Expense | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const fetchExpense = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await expenseService.getExpenseById(id);
      setExpense(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleDuplicate = async () => {
    if (!expense) return;
    try {
      const dup = await expenseService.duplicateExpense(expense.id);
      toast({ title: 'Expense Duplicated', description: `Created entry ${dup.expenseNumber}.`, variant: 'success' });
      router.push('/app/expenses');
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate expense.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    try {
      await expenseService.deleteExpense(expense.id);
      toast({ title: 'Expense Deleted', description: 'Expense entry removed.', variant: 'info' });
      router.push('/app/expenses');
    } catch {
      toast({ title: 'Error', description: 'Could not delete expense.', variant: 'destructive' });
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading expense entry..." />;
  }

  if (!expense) {
    return (
      <ErrorState
        title="Expense Entry Not Found"
        description="The requested expense entry does not exist."
        action={
          <Button onClick={() => router.push('/app/expenses')} className="mt-4">
            Back to Expenses
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={expense.expenseNumber}
        subtitle={`${expense.category} expense from ${expense.vendorName}`}
        breadcrumbs={[
          { label: 'Expenses', href: '/app/expenses' },
          { label: expense.expenseNumber },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/expenses')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1.5" /> Duplicate
            </Button>
            {expense.billable && expense.status !== 'added_to_invoice' && (
              <Button size="sm" onClick={() => setConvertOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <FilePlus className="h-4 w-4 mr-1.5" /> Add to Invoice
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDeleting(true)} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </div>
        }
      />

      {/* Metric Callout Card */}
      <Card className="border-slate-200 shadow-xs bg-slate-50/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Expense Amount</span>
              <CurrencyDisplay amount={expense.totalAmount} className="text-2xl font-black text-slate-900 font-mono" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expense Type</span>
              <span className="font-bold text-slate-900 uppercase text-xs tracking-wider block">{expense.expenseType} Expense</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expense Date</span>
              <DateDisplay date={expense.date} className="font-bold text-slate-900 text-sm" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <ExpenseStatusBadge status={expense.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Breakdown */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
            Expense Particulars
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Category:</span>
                <div className="mt-0.5"><ExpenseCategoryBadge category={expense.category} /></div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Vendor / Payee:</span>
                <span className="font-bold text-slate-900 text-sm">{expense.vendorName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Description:</span>
                <p className="text-slate-800 font-medium leading-relaxed">{expense.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Associated Customer:</span>
                <span className="font-bold text-slate-900">{expense.customerName || 'N/A (Business Overhead)'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Billable Status:</span>
                <span className={`font-bold ${expense.billable ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {expense.billable ? 'Billable to Customer' : 'Internal Non-billable Expense'}
                </span>
              </div>
              {expense.billedInvoiceNumber && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Billed Invoice:</span>
                  <Link href={`/app/invoices/${expense.billedInvoiceId}`} className="font-mono font-bold text-indigo-600 hover:underline">
                    {expense.billedInvoiceNumber}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Amount Breakdown Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Base Expense Amount:</span>
              <CurrencyDisplay amount={expense.amount} className="font-semibold text-slate-800" />
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">GST Tax Amount:</span>
              <CurrencyDisplay amount={expense.taxAmount} className="font-semibold text-slate-800" />
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t border-slate-200 pt-2 font-sans">
              <span>Total Amount:</span>
              <CurrencyDisplay amount={expense.totalAmount} className="text-indigo-700 font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachment Preview & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
              Receipt Voucher Attachment
            </h3>
            {expense.receiptName ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-6 w-6 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{expense.receiptName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{expense.receiptSize || 'Verified Voucher'}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Download Receipt', description: `Downloading ${expense.receiptName}`, variant: 'info' })}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-slate-400 italic py-4 text-center">No receipt voucher attached to this expense entry.</p>
            )}
          </CardContent>
        </Card>

        {expense.notes && (
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-6 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Internal Remarks & Notes
              </h3>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 italic leading-relaxed">
                {expense.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Timeline */}
      {expense.activities && expense.activities.length > 0 && (
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" /> Audit Log & History
            </h3>
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {expense.activities.map((act) => (
                <div key={act.id} className="pt-2 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 block">{act.title}</span>
                    <p className="text-slate-500 text-[11px]">{act.details}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <span>{act.user}</span>
                    <DateDisplay date={act.timestamp} showTime className="block text-slate-500 font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Convert to Invoice Modal */}
      <ConvertExpenseDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        expense={expense}
        onSuccess={() => fetchExpense()}
      />

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title="Delete Expense Record?"
          description="Are you sure you want to delete this expense entry? This action cannot be undone."
          confirmLabel="Delete Expense"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
