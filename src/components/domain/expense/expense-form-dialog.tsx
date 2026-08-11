'use client';

import * as React from 'react';
import { ExpenseCreateInput, ExpenseCategory, ExpenseType } from '@/types/expense';
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
import { Customer } from '@/types/customer';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExpenseFormDialog({ open, onOpenChange, onSuccess }: ExpenseFormDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [expenseType, setExpenseType] = React.useState<ExpenseType>('business');
  const [category, setCategory] = React.useState<ExpenseCategory>('Software');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [vendorName, setVendorName] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState<number>(0);
  const [taxAmount, setTaxAmount] = React.useState<number>(0);
  const [billable, setBillable] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState('credit_card');
  const [notes, setNotes] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expenseService.createExpense({
        expenseType,
        category,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.displayName,
        date,
        amount,
        taxAmount,
        vendorName,
        description: description || `${category} expense`,
        billable,
        paymentMethod,
        notes,
      });
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DrawerBody className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground mb-1 block">Expense Type</label>
                <Select value={expenseType} onValueChange={(val) => setExpenseType(val as ExpenseType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business Overhead</SelectItem>
                    <SelectItem value="customer">Customer Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {expenseType === 'customer' && (
              <div>
                <label className="font-semibold text-foreground mb-1 block">Link to Customer *</label>
                <CustomerSelector
                  value={selectedCustomer?.id}
                  onChange={(c) => setSelectedCustomer(c)}
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-foreground mb-1 block">Vendor / Payee Name *</label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required placeholder="e.g. AWS Cloud / IndiGo Airlines" className="h-8 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground mb-1 block">Expense Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs font-mono" />
              </div>
              <div>
                <label className="font-semibold text-foreground mb-1 block">Base Amount (₹)</label>
                <Input type="number" step="any" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required className="h-8 text-xs font-mono" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." className="h-8 text-xs" />
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
