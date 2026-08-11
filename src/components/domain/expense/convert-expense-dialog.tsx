'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Expense } from '@/types/expense';
import { expenseService, invoiceService } from '@/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Invoice } from '@/types/invoice';
import { FilePlus, Plus, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConvertExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onSuccess?: () => void;
}

export function ConvertExpenseDialog({ open, onOpenChange, expense, onSuccess }: ConvertExpenseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && expense?.customerId) {
      invoiceService.getInvoices({ customerId: expense.customerId }).then((res) => {
        // Only allow draft or sent invoices
        const valid = res.data.filter((i) => i.status === 'draft' || i.status === 'sent');
        setInvoices(valid);
        if (valid.length > 0) setSelectedInvoiceId(valid[0].id);
      });
    }
  }, [open, expense]);

  if (!expense) return null;

  const handleAddToExisting = async () => {
    if (!selectedInvoiceId) {
      toast({ title: 'Select Invoice', description: 'Please select an invoice to attach this expense.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await expenseService.convertExpenseToInvoice(expense.id, selectedInvoiceId);
      toast({
        title: 'Expense Billed to Invoice',
        description: `Expense ${expense.expenseNumber} attached to ${res.invoiceNumber}.`,
        variant: 'success',
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch {
      toast({ title: 'Error', description: 'Could not attach expense to invoice.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewInvoice = () => {
    onOpenChange(false);
    router.push(`/app/invoices/new?customerId=${expense.customerId || ''}&expenseId=${expense.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <FilePlus className="h-5 w-5 text-indigo-600" />
            <DialogTitle>Add Expense to Invoice</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-4 text-xs">
          {/* Expense Summary Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">{expense.expenseNumber}</span>
              <span className="font-semibold text-slate-600">{expense.category}</span>
            </div>
            <p className="text-slate-600 text-[11px] line-clamp-1">{expense.description}</p>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-mono">
              <span className="text-slate-500 font-sans">Customer: <strong>{expense.customerName}</strong></span>
              <CurrencyDisplay amount={expense.totalAmount} className="font-bold text-indigo-700 text-sm" />
            </div>
          </div>

          {/* Target Invoice Selector */}
          {invoices.length > 0 ? (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Select Customer Invoice</label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose Invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — <CurrencyDisplay amount={inv.total} /> ({inv.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-slate-500 italic text-[11px]">
              No active draft or sent invoices found for this customer. You can create a new invoice.
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateNewInvoice} className="w-full sm:w-auto text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create New Invoice
          </Button>

          {invoices.length > 0 && (
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleAddToExisting}
              className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Add to Selected Invoice <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
