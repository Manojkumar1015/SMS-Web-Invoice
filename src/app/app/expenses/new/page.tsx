'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { expenseService, customerService } from '@/services';
import { ExpenseType, ExpenseCategory } from '@/types/expense';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CustomerSelector } from '@/components/domain/customer/customer-selector';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { FileUploadMock } from '@/components/ui/file-upload-mock';
import { ArrowLeft, Save, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [expenseType, setExpenseType] = React.useState<ExpenseType>('business');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [category, setCategory] = React.useState<ExpenseCategory>('Software');
  const [vendorName, setVendorName] = React.useState('');
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState<number>(0);
  const [taxAmount, setTaxAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState('credit_card');
  const [billable, setBillable] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ name: string; size: string; url?: string } | null>(null);
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // If customer expense type selected, default billable to true
  const handleTypeChange = (type: ExpenseType) => {
    setExpenseType(type);
    if (type === 'customer') {
      setBillable(true);
    } else {
      setSelectedCustomer(null);
      setBillable(false);
    }
  };

  const totalAmount = amount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (expenseType === 'customer' && !selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Customer Expense requires selecting a customer.', variant: 'destructive' });
      return;
    }

    if (!vendorName.trim()) {
      toast({ title: 'Vendor Required', description: 'Please enter vendor/payee name.', variant: 'destructive' });
      return;
    }

    if (amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Expense amount must be greater than zero.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.createExpense({
        expenseType,
        category,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.displayName,
        date: expenseDate,
        amount,
        taxAmount,
        vendorName,
        description,
        billable,
        paymentMethod,
        receiptName: receipt?.name,
        receiptSize: receipt?.size,
        receiptUrl: receipt?.url,
        notes,
      });

      toast({
        title: 'Expense Recorded',
        description: `Expense of ₹${totalAmount.toLocaleString('en-IN')} logged successfully.`,
        variant: 'success',
      });

      router.push('/app/expenses');
    } catch {
      toast({ title: 'Error', description: 'Could not log expense entry.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Add Expense"
        subtitle="Log operational overheads or client billable vendor purchases."
        breadcrumbs={[
          { label: 'Expenses', href: '/app/expenses' },
          { label: 'Add Expense' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/app/expenses')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-6">
            {/* Step 1: Expense Type Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                1. Expense Categorization & Scope
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange('business')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    expenseType === 'business'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-900 block text-sm">Business Expense</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Operational overheads (Rent, Software, Salaries, Utilities)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('customer')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    expenseType === 'customer'
                      ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-purple-900 block text-sm">Customer Expense</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Project travel, hosting, materials billable to client
                  </span>
                </button>
              </div>

              {/* Customer Selector (Required for Customer Expense) */}
              {expenseType === 'customer' && (
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Target Customer *</label>
                  <CustomerSelector
                    value={selectedCustomer?.id}
                    onChange={(c) => setSelectedCustomer(c)}
                  />
                </div>
              )}
            </div>

            {/* Step 2: Vendor, Category & Dates */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                2. Vendor & Expense Particulars
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Category *</label>
                  <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Software">Software & Subscriptions</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Salary">Salary & Wages</SelectItem>
                      <SelectItem value="Electricity">Electricity & Power</SelectItem>
                      <SelectItem value="Fuel">Fuel & Gas</SelectItem>
                      <SelectItem value="Travel">Travel & Lodging</SelectItem>
                      <SelectItem value="Transport">Transport & Freight</SelectItem>
                      <SelectItem value="Materials">Materials & Hardware</SelectItem>
                      <SelectItem value="Marketing">Marketing & Ads</SelectItem>
                      <SelectItem value="Office">Office Supplies</SelectItem>
                      <SelectItem value="Maintenance">Maintenance & Repairs</SelectItem>
                      <SelectItem value="Utilities">Utilities & Internet</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                      <SelectItem value="Other">Other Operational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Vendor / Payee Name *</label>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. AWS Cloud / IndiGo Airlines"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Expense Date *</label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Description / Purpose *</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Server hosting for client portal environment"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Step 3: Financial Amounts & Billable Setting */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                3. Amount & Billable Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Base Amount (₹) *</label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">GST / Tax Amount (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit / Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                      <SelectItem value="upi">UPI / GPay</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Total Calculation Callout */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Total Expense Amount (Including GST):</span>
                <CurrencyDisplay amount={totalAmount} className="text-base font-black text-indigo-700 font-mono" />
              </div>

              {/* Billable Toggle Callout */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block text-xs">Billable Expense</span>
                  <span className="text-[11px] text-slate-500">
                    {billable ? 'Can be added directly onto a customer invoice later' : 'Internal business operational expense'}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Receipt Upload Mock */}
              <FileUploadMock
                label="Receipt Voucher / Invoice Upload"
                value={receipt}
                onChange={setReceipt}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push('/app/expenses')}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs"
          >
            <Save className="h-4 w-4 mr-1.5" /> Save Expense
          </Button>
        </div>
      </form>
    </div>
  );
}
