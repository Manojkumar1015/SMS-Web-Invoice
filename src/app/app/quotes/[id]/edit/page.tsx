'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quoteService, customerService } from '@/services';
import { Quote, DocumentItem } from '@/types/quote';
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
import { calculateDocumentTotals } from '@/lib/calculations';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quoteId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [quoteDate, setQuoteDate] = React.useState('');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [paymentTerms, setPaymentTerms] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [items, setItems] = React.useState<DocumentItem[]>([]);
  const [status, setStatus] = React.useState<Quote['status']>('draft');

  React.useEffect(() => {
    async function loadQuoteData() {
      setLoading(true);
      try {
        const q = await quoteService.getQuoteById(quoteId);
        if (!q) return;
        setQuoteDate(q.date);
        setExpiryDate(q.expiryDate);
        setPaymentTerms(q.paymentTerms || 'Net 30 Days');
        setNotes(q.notes || '');
        setTerms(q.terms || '');
        setItems(q.items || []);
        setStatus(q.status);

        const cust = await customerService.getCustomerById(q.customerId).catch(() => null);
        if (cust) {
          setSelectedCustomer(cust);
        } else if (q.customerId || q.customerName) {
          setSelectedCustomer({
            id: q.customerId || 'cust-fallback',
            customerType: 'business',
            companyName: q.customerName || 'Customer',
            displayName: q.customerName || 'Customer',
            contactPerson: '',
            email: q.customerEmail || '',
            phone: '',
            paymentTerms: q.paymentTerms || 'Net 30 Days',
            billingAddress: {
              street: q.billingAddress?.street || '',
              city: q.billingAddress?.city || '',
              state: q.billingAddress?.state || '',
              postalCode: q.billingAddress?.postalCode || '',
              country: q.billingAddress?.country || 'India',
            },
            shippingAddress: {
              street: q.shippingAddress?.street || '',
              city: q.shippingAddress?.city || '',
              state: q.shippingAddress?.state || '',
              postalCode: q.shippingAddress?.postalCode || '',
              country: q.shippingAddress?.country || 'India',
            },
            sameAsBillingAddress: true,
            status: 'active',
            totalInvoiced: q.total || 0,
            paid: 0,
            outstanding: q.total || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadQuoteData();
  }, [quoteId]);

  const updateItemRow = (index: number, fields: Partial<DocumentItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], ...fields };
      const sub = current.quantity * current.rate;
      const disc = Math.min(sub, current.discount || 0);
      const taxable = Math.max(0, sub - disc);
      const tax = (taxable * (current.taxRate || 0)) / 100;
      current.amount = Math.max(0, taxable + tax);
      next[index] = current;
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
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

  const totals = calculateDocumentTotals(items);

  const handleUpdate = async () => {
    if (!selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Please select a customer.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await quoteService.updateQuote(quoteId, {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.displayName,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        customerGstin: selectedCustomer.gstin,
        billingAddress: selectedCustomer.billingAddress,
        shippingAddress: selectedCustomer.shippingAddress,
        date: quoteDate,
        expiryDate,
        paymentTerms,
        items,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.grandTotal,
        notes,
        terms,
        status,
      });

      toast({ title: 'Quote Updated', description: 'Changes saved successfully.', variant: 'success' });
      router.push(`/app/quotes/${quoteId}`);
    } catch {
      toast({ title: 'Error', description: 'Could not update quotation.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading quote editor..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Quote"
        subtitle={`Update quotation details`}
        breadcrumbs={[
          { label: 'Quotes', href: '/app/quotes' },
          { label: 'Edit Quote' },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/app/quotes/${quoteId}`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" disabled={submitting} onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Save className="h-4 w-4 mr-1" /> Update Quote
            </Button>
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Customer *</label>
              <CustomerSelector
                value={selectedCustomer?.id}
                onChange={(c) => setSelectedCustomer(c)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Terms</label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Quote Date *</label>
              <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Expiry Date *</label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          {/* Editable Line Items */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quote Items</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-2/5">Item Details</th>
                    <th className="px-3 py-2.5 w-20 text-center">Qty</th>
                    <th className="px-3 py-2.5 w-24 text-right">Rate (₹)</th>
                    <th className="px-3 py-2.5 w-20 text-right">Discount</th>
                    <th className="px-3 py-2.5 w-20 text-right">Tax (%)</th>
                    <th className="px-3 py-2.5 w-28 text-right">Amount</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                          placeholder="Item Name"
                          className="h-8 text-xs font-semibold"
                        />
                        <Input
                          value={row.description || ''}
                          onChange={(e) => updateItemRow(index, { description: e.target.value })}
                          placeholder="Description..."
                          className="h-7 text-[11px] text-slate-500"
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
                          className="h-8 text-right text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="any"
                          value={row.discount}
                          onChange={(e) => updateItemRow(index, { discount: Number(e.target.value) })}
                          className="h-8 text-right text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          value={row.taxRate}
                          onChange={(e) => updateItemRow(index, { taxRate: Number(e.target.value) })}
                          className="h-8 text-right text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 align-top text-right font-extrabold text-slate-900 font-mono pt-4">
                        <CurrencyDisplay amount={row.amount} />
                      </td>
                      <td className="p-3 align-top text-center pt-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Customer Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-xs" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Terms & Conditions</label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="text-xs" />
              </div>
            </div>

            <div className="space-y-2 text-xs text-right bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit font-mono">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans text-slate-500">Subtotal:</span>
                <CurrencyDisplay amount={totals.subtotal} className="font-semibold text-slate-900" />
              </div>
              <div className="flex justify-between text-emerald-600">
                <span className="font-sans text-emerald-700">Discount Total:</span>
                <span>- <CurrencyDisplay amount={totals.discountTotal} /></span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans text-slate-500">Tax Total (GST):</span>
                <CurrencyDisplay amount={totals.taxTotal} className="font-semibold text-slate-900" />
              </div>
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 pt-2 text-slate-900">
                <span className="font-sans">Grand Total:</span>
                <CurrencyDisplay amount={totals.grandTotal} className="text-base text-indigo-700" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
