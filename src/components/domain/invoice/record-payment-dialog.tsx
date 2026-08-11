'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentFormSchema } from '@/lib/validations';
import { PaymentCreateInput } from '@/types/payment';
import { Invoice } from '@/types/invoice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { paymentService, invoiceService } from '@/services';
import { formatCurrency } from '@/lib/formatters';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSuccess: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<PaymentCreateInput>(
    () => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      date: new Date().toISOString().split('T')[0],
      amount: invoice.amountDue > 0 ? invoice.amountDue : invoice.total,
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      notes: '',
    }),
    [invoice]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentCreateInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit = async (data: PaymentCreateInput) => {
    setSubmitting(true);
    try {
      await paymentService.createPayment(data);
      // Update invoice paid amount
      const newPaid = invoice.amountPaid + data.amount;
      await invoiceService.updateInvoice(invoice.id, {
        amountPaid: newPaid,
      } as any);
      onSuccess();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a customer payment received for <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span> ({invoice.customerName}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-surface-hover/60 border border-border text-xs flex justify-between">
            <div>
              <span className="text-muted-foreground block">Invoice Balance Due:</span>
              <span className="font-bold text-red-600 text-sm">{formatCurrency(invoice.amountDue)}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block">Invoice Total:</span>
              <span className="font-semibold text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Payment Date</label>
            <Input type="date" {...register('date')} error={errors.date?.message} />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Payment Amount (₹)</label>
            <Input type="number" step="any" {...register('amount')} error={errors.amount?.message} />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Payment Method</label>
            <Select
              value={watch('paymentMethod')}
              onValueChange={(val) => setValue('paymentMethod', val as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                <SelectItem value="upi">UPI / GPay / PhonePe</SelectItem>
                <SelectItem value="credit_card">Credit / Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Reference / UTR Number</label>
            <Input {...register('referenceNumber')} placeholder="e.g. NEFT-88392019" />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Notes</label>
            <Textarea {...register('notes')} placeholder="Optional receipt notes..." rows={2} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Recording...' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
