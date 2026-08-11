'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentService, customerService, invoiceService } from '@/services';
import { PaymentMethod } from '@/types/payment';
import { Customer } from '@/types/customer';
import { Invoice } from '@/types/invoice';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CustomerSelector } from '@/components/domain/customer/customer-selector';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { FileUploadMock } from '@/components/ui/file-upload-mock';
import { LoadingState } from '@/components/ui/loading-state';
import { ArrowLeft, Save, AlertCircle, CheckCircle, CreditCard, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('customerId') || '';
  const invoiceIdParam = searchParams.get('invoiceId') || '';
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = React.useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);

  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [attachment, setAttachment] = React.useState<{ name: string; size: string; url?: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Pre-load customer & invoice if query params provided
  React.useEffect(() => {
    if (customerIdParam) {
      customerService.getCustomerById(customerIdParam).then((c) => setSelectedCustomer(c));
    }
  }, [customerIdParam]);

  React.useEffect(() => {
    if (selectedCustomer) {
      invoiceService.getInvoices({ customerId: selectedCustomer.id }).then((res) => {
        const unpaid = res.data.filter((i) => i.amountDue > 0);
        setCustomerInvoices(unpaid);

        if (invoiceIdParam) {
          const match = res.data.find((i) => i.id === invoiceIdParam);
          if (match) {
            setSelectedInvoice(match);
            setAmount(match.amountDue);
          }
        } else if (unpaid.length > 0) {
          setSelectedInvoice((prev) => prev || unpaid[0]);
          setAmount((prev) => (prev === 0 ? unpaid[0].amountDue : prev));
        }
      });
    } else {
      setCustomerInvoices([]);
      setSelectedInvoice(null);
    }
  }, [selectedCustomer, invoiceIdParam]);

  const handleInvoiceChange = (invId: string) => {
    const match = customerInvoices.find((i) => i.id === invId);
    if (match) {
      setSelectedInvoice(match);
      setAmount(match.amountDue);
    }
  };

  const isOverpayment = selectedInvoice ? amount > selectedInvoice.amountDue : false;
  const remainingAfterPayment = selectedInvoice ? Math.max(0, selectedInvoice.amountDue - amount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Please select a customer.', variant: 'destructive' });
      return;
    }

    if (!selectedInvoice) {
      toast({ title: 'Invoice Required', description: 'Please select an invoice to apply payment.', variant: 'destructive' });
      return;
    }

    if (amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Payment amount must be greater than zero.', variant: 'destructive' });
      return;
    }

    if (isOverpayment) {
      toast({ title: 'Overpayment Warning', description: 'Payment amount exceeds remaining invoice balance due.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.createPayment({
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.displayName,
        customerEmail: selectedCustomer.email,
        date: paymentDate,
        amount,
        paymentMethod,
        referenceNumber,
        notes,
        attachmentName: attachment?.name,
        attachmentSize: attachment?.size,
        attachmentUrl: attachment?.url,
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment of ₹${amount.toLocaleString('en-IN')} logged for ${selectedInvoice.invoiceNumber}.`,
        variant: 'success',
      });

      router.push('/app/payments');
    } catch {
      toast({ title: 'Error', description: 'Could not record payment.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Record Payment"
        subtitle="Log a cleared payment against an outstanding customer invoice."
        breadcrumbs={[
          { label: 'Payments', href: '/app/payments' },
          { label: 'Record Payment' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/app/payments')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-6">
            {/* Step 1: Customer & Invoice Selection */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                1. Customer & Invoice Reference
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Customer *</label>
                  <CustomerSelector
                    value={selectedCustomer?.id}
                    onChange={(c) => setSelectedCustomer(c)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Invoice *</label>
                  {customerInvoices.length > 0 ? (
                    <Select value={selectedInvoice?.id || ''} onValueChange={handleInvoiceChange}>
                      <SelectTrigger className="h-9 text-xs bg-white"><SelectValue placeholder="Select Invoice" /></SelectTrigger>
                      <SelectContent>
                        {customerInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.invoiceNumber} — Due: <CurrencyDisplay amount={inv.amountDue} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      disabled
                      value={selectedCustomer ? 'No outstanding invoices for customer' : 'Select a customer first'}
                      className="h-9 text-xs bg-slate-50 text-slate-500"
                    />
                  )}
                </div>
              </div>

              {/* Outstanding Balance Callout */}
              {selectedInvoice && (
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                  <div>
                    <span className="font-bold text-indigo-900 text-sm">{selectedInvoice.invoiceNumber}</span>
                    <p className="text-slate-600 mt-0.5">Billed to {selectedCustomer?.displayName}</p>
                  </div>

                  <div className="flex items-center space-x-6 font-mono text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Total</span>
                      <CurrencyDisplay amount={selectedInvoice.total} className="font-semibold text-slate-800" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase block">Paid</span>
                      <CurrencyDisplay amount={selectedInvoice.amountPaid} className="font-semibold text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-red-600 uppercase block font-bold">Balance Due</span>
                      <CurrencyDisplay amount={selectedInvoice.amountDue} className="font-extrabold text-red-600 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                2. Payment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Date *</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Amount (₹) *</label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-9 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Method *</label>
                  <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                      <SelectItem value="upi">UPI / GPay / QR</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit_card">Credit / Debit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Reference / UTR / Cheque Number
                </label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR-HDFC-9918237461 or Cheque #400192"
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Dynamic Financial Calculation Callout */}
              {selectedInvoice && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    isOverpayment ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span>Payment Allocation Summary:</span>
                    {isOverpayment && (
                      <span className="text-red-600 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5" /> Warning: Overpayment Amount
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500 font-sans block">Invoice Total:</span>
                      <CurrencyDisplay amount={selectedInvoice.total} />
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block">Previously Paid:</span>
                      <CurrencyDisplay amount={selectedInvoice.amountPaid} />
                    </div>
                    <div>
                      <span className="text-indigo-600 font-sans font-bold block">Current Payment:</span>
                      <CurrencyDisplay amount={amount} className="font-extrabold text-indigo-700" />
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block">Remaining Balance:</span>
                      <CurrencyDisplay amount={remainingAfterPayment} className="font-bold text-slate-900" />
                    </div>
                  </div>
                </div>
              )}

              {/* Attachment Mock Upload */}
              <FileUploadMock
                label="Payment Receipt / Advice Attachment"
                value={attachment}
                onChange={setAttachment}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Notes / Remarks</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal payment notes..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push('/app/payments')}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || isOverpayment}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs"
          >
            <Save className="h-4 w-4 mr-1.5" /> Record Payment
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <React.Suspense fallback={<LoadingState message="Loading payment form..." />}>
      <RecordPaymentForm />
    </React.Suspense>
  );
}
