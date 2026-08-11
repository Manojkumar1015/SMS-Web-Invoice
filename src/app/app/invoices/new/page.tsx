'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { invoiceService, quoteService, customerService } from '@/services';
import { InvoiceCreateInput } from '@/types/invoice';
import { DocumentItem } from '@/types/quote';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSelector } from '@/components/domain/customer/customer-selector';
import { ItemSelector } from '@/components/domain/item/item-selector';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Plus, Trash2, ArrowLeft, Save, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialQuoteId = searchParams.get('quoteId') || '';
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = React.useState('Thank you for your business!');
  const [terms, setTerms] = React.useState('Payment due within agreed credit terms.');
  const [submitting, setSubmitting] = React.useState(false);

  const [items, setItems] = React.useState<DocumentItem[]>([
    {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'hrs',
      rate: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    },
  ]);

  // Prefill quote data if converted
  React.useEffect(() => {
    async function prefill() {
      if (initialCustomerId) {
        const c = await customerService.getCustomerById(initialCustomerId);
        if (c) setSelectedCustomer(c);
      }
      if (initialQuoteId) {
        const q = await quoteService.getQuoteById(initialQuoteId);
        if (q) {
          setItems(q.items);
          setNotes(q.notes || '');
          setTerms(q.terms || '');
        }
      }
    }
    prefill();
  }, [initialCustomerId, initialQuoteId]);

  const updateItemRow = (index: number, fields: Partial<DocumentItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], ...fields };
      const sub = current.quantity * current.rate - current.discount;
      const tax = (sub * current.taxRate) / 100;
      current.amount = Math.max(0, sub + tax);
      next[index] = current;
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: '',
        description: '',
        quantity: 1,
        unit: 'hrs',
        rate: 0,
        discount: 0,
        taxRate: 18,
        amount: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Computations
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.rate, 0);
  const discountTotal = items.reduce((acc, i) => acc + (i.discount || 0), 0);
  const taxTotal = items.reduce((acc, i) => {
    const lineSub = i.quantity * i.rate - i.discount;
    return acc + (lineSub * i.taxRate) / 100;
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Please select a customer to bill.', variant: 'destructive' });
      return;
    }

    if (items.some((i) => !i.name.trim())) {
      toast({ title: 'Line Item Required', description: 'Please specify names for all line items.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const input: InvoiceCreateInput = {
        invoiceNumber: '',
        quoteId: initialQuoteId || undefined,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.displayName,
        customerEmail: selectedCustomer.email,
        customerGstin: selectedCustomer.gstin,
        date: invoiceDate,
        dueDate,
        items,
        subtotal,
        discountTotal,
        taxTotal,
        total: grandTotal,
        notes,
        terms,
        status,
      };

      const created = await invoiceService.createInvoice(input);
      toast({ title: 'Invoice Created', description: `Invoice ${created.invoiceNumber} generated successfully.`, variant: 'success' });
      router.push(`/app/invoices/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Invoice"
        subtitle="Generate an itemized tax invoice for your customer."
        breadcrumbs={[
          { label: 'Invoices', href: '/app/invoices' },
          { label: 'New Invoice' },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="outline" size="sm" disabled={submitting} onClick={() => handleSave('draft')}>
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => handleSave('sent')}>
              <Send className="h-4 w-4 mr-1" /> Save & Send
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Customer *</label>
              <CustomerSelector
                value={selectedCustomer?.id}
                onChange={(c) => setSelectedCustomer(c)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Invoice Date *</label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Payment Due Date *</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Invoice Line Items</h3>
              <span className="text-xs text-muted-foreground">Currency: INR (₹)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-hover text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="px-3 py-2.5 w-1/3">Item Details</th>
                    <th className="px-3 py-2.5 w-20 text-center">Qty</th>
                    <th className="px-3 py-2.5 w-24 text-right">Rate (₹)</th>
                    <th className="px-3 py-2.5 w-20 text-right">Discount</th>
                    <th className="px-3 py-2.5 w-24 text-right">Tax (% GST)</th>
                    <th className="px-3 py-2.5 w-28 text-right">Amount</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row, index) => (
                    <tr key={row.id}>
                      <td className="p-3 space-y-1.5 align-top">
                        <ItemSelector
                          value={row.itemId}
                          onChange={(catalogItem) => {
                            if (catalogItem) {
                              updateItemRow(index, {
                                itemId: catalogItem.id,
                                name: catalogItem.name,
                                description: catalogItem.description || '',
                                unit: catalogItem.unit,
                                rate: catalogItem.sellingPrice,
                                taxRate: catalogItem.taxRate,
                              });
                            }
                          }}
                        />
                        <Input
                          value={row.name}
                          onChange={(e) => updateItemRow(index, { name: e.target.value })}
                          placeholder="Item title"
                          className="h-8 text-xs font-medium"
                        />
                        <Input
                          value={row.description || ''}
                          onChange={(e) => updateItemRow(index, { description: e.target.value })}
                          placeholder="Description..."
                          className="h-7 text-[11px] text-muted-foreground"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateItemRow(index, { quantity: Number(e.target.value) })}
                          className="h-8 text-center text-xs"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="any"
                          value={row.rate}
                          onChange={(e) => updateItemRow(index, { rate: Number(e.target.value) })}
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="any"
                          value={row.discount}
                          onChange={(e) => updateItemRow(index, { discount: Number(e.target.value) })}
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          value={row.taxRate}
                          onChange={(e) => updateItemRow(index, { taxRate: Number(e.target.value) })}
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="p-3 align-top text-right font-bold text-foreground pt-4">
                        <CurrencyDisplay amount={row.amount} />
                      </td>
                      <td className="p-3 align-top text-center pt-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          onClick={() => removeItemRow(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" size="sm" onClick={addItemRow} className="mt-2 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Line Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Customer Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Terms & Conditions</label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} />
              </div>
            </div>

            <div className="space-y-2 text-xs text-right bg-surface-hover/50 p-4 rounded-lg border border-border h-fit">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <CurrencyDisplay amount={subtotal} className="font-semibold text-foreground" />
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount Total:</span>
                <span>- <CurrencyDisplay amount={discountTotal} /></span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST Tax Total:</span>
                <CurrencyDisplay amount={taxTotal} className="font-semibold text-foreground" />
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-2 text-foreground">
                <span>Total Invoice Amount:</span>
                <CurrencyDisplay amount={grandTotal} className="text-base text-accent" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <React.Suspense fallback={<LoadingState message="Loading invoice builder..." />}>
      <NewInvoiceForm />
    </React.Suspense>
  );
}
