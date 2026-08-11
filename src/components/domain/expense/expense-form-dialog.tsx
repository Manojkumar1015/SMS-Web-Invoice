'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseFormSchema } from '@/lib/validations';
import { ExpenseCreateInput } from '@/types/expense';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CustomerSelector } from '@/components/domain/customer/customer-selector';
import { expenseService } from '@/services';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExpenseFormDialog({ open, onOpenChange, onSuccess }: ExpenseFormDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<ExpenseCreateInput>(
    () => ({
      category: 'Software & Subscriptions',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      taxAmount: 0,
      vendorName: '',
      type: 'Non-Billable',
      paymentMethod: 'Corporate Credit Card',
      notes: '',
    }),
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseCreateInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit = async (data: ExpenseCreateInput) => {
    setSubmitting(true);
    try {
      await expenseService.createExpense(data);
      onSuccess();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>Add Business Expense</DrawerTitle>
          <DrawerDescription>Record vendor purchases, hosting bills, or operational costs.</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DrawerBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Expense Category</label>
                <Select
                  value={watch('category')}
                  onValueChange={(val) => setValue('category', val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Travel & Lodging">Travel & Lodging</SelectItem>
                    <SelectItem value="Utilities & Internet">Utilities & Internet</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Marketing & Ads">Marketing & Ads</SelectItem>
                    <SelectItem value="Hardware & Maintenance">Hardware & Maintenance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Expense Date</label>
                <Input type="date" {...register('date')} error={errors.date?.message} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Vendor / Payee Name</label>
              <Input {...register('vendorName')} error={errors.vendorName?.message} placeholder="e.g. Amazon Web Services (AWS)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Total Amount (₹)</label>
                <Input type="number" step="any" {...register('amount')} error={errors.amount?.message} />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Included Tax Amount (₹)</label>
                <Input type="number" step="any" {...register('taxAmount')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Expense Type</label>
                <Select
                  value={watch('type')}
                  onValueChange={(val) => setValue('type', val as 'Billable' | 'Non-Billable')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non-Billable">Non-Billable (Internal)</SelectItem>
                    <SelectItem value="Billable">Billable (Pass to Customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Payment Method</label>
                <Input {...register('paymentMethod')} placeholder="e.g. HDFC Credit Card" />
              </div>
            </div>

            {watch('type') === 'Billable' && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Link to Customer</label>
                <CustomerSelector
                  value={watch('customerId')}
                  onChange={(c) => {
                    setValue('customerId', c?.id);
                    setValue('customerName', c?.displayName);
                  }}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Description</label>
              <Textarea {...register('notes')} placeholder="Receipt reference..." rows={3} />
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Expense'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
