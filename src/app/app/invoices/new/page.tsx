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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DocumentPreview } from '@/components/domain/document/document-preview';
import { calculateDocumentTotals } from '@/lib/calculations';
import { LoadingState } from '@/components/ui/loading-state';
import { Plus, Trash2, ArrowLeft, Save, Send, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteIdParam = searchParams.get('quoteId') || '';
  const customerIdParam = searchParams.get('customerId') || '';
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [quoteId, setQuoteId] = React.useState<string | undefined>(quoteIdParam || undefined);
  const [quoteNumber, setQuoteNumber] = React.useState<string | undefined>(undefined);
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = React.useState('Net 15 Days');
  const [notes, setNotes] = React.useState('Thank you for your business!');
  const [terms, setTerms] = React.useState('1. Payment due within 15 days of invoice date.\n2. Overdue payments subject to interest charges.\n3. Bank details listed below.');
  const [applyRoundOff, setApplyRoundOff] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

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

  // Handle pre-filling from Quote
  React.useEffect(() => {
    async function loadQuoteData() {
      if (quoteIdParam) {
        const q = await quoteService.getQuoteById(quoteIdParam);
        if (q) {
          setQuoteId(q.id);
          setQuoteNumber(q.quoteNumber);
          setItems(q.items);
          if (q.notes) setNotes(q.notes);
          if (q.terms) setTerms(q.terms);
          if (q.paymentTerms) setPaymentTerms(q.paymentTerms);

          const cust = await customerService.getCustomerById(q.customerId);
          if (cust) setSelectedCustomer(cust);
        }
      } else if (customerIdParam) {
        const cust = await customerService.getCustomerById(customerIdParam);
        if (cust) setSelectedCustomer(cust);
      }
    }
    loadQuoteData();
  }, [quoteIdParam, customerIdParam]);

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

  const totals = calculateDocumentTotals(items, 0, applyRoundOff);

  const buildInvoiceObject = (status: 'draft' | 'sent'): InvoiceCreateInput => {
    return {
      invoiceNumber: 'INV-PREVIEW',
      quoteId,
      quoteNumber,
      customerId: selectedCustomer?.id || '',
      customerName: selectedCustomer?.displayName || 'Select Customer',
      customerEmail: selectedCustomer?.email || '',
      customerPhone: selectedCustomer?.phone,
      customerGstin: selectedCustomer?.gstin,
      billingAddress: selectedCustomer?.billingAddress,
      shippingAddress: selectedCustomer?.shippingAddress,
      date: invoiceDate,
      dueDate,
      paymentTerms,
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      roundOff: totals.roundOff,
      total: totals.grandTotal,
      notes,
      terms,
      status,
    };
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!selectedCustomer) {
      toast({ title: 'Customer Required', description: 'Please select a customer for this invoice.', variant: 'destructive' });
      return;
    }

    if (items.some((i) => !i.name.trim())) {
      toast({ title: 'Line Item Required', description: 'Please specify title/description for all line items.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const input = buildInvoiceObject(status);
      const created = await invoiceService.createInvoice(input);
      toast({
        title: status === 'draft' ? 'Invoice Saved as Draft' : 'Invoice Created & Sent',
        description: `Invoice ${created.invoiceNumber} saved successfully.`,
        variant: 'success',
      });
      router.push(`/app/invoices/${created.id}`);
    } catch {
      toast({ title: 'Error', description: 'Could not create invoice.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        subtitle={quoteNumber ? `Generated from Quote ${quoteNumber}` : 'Build a commercial invoice for customer billing'}
        breadcrumbs={[
          { label: 'Invoices', href: '/app/invoices' },
          { label: 'Create Invoice' },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-1 text-slate-600" /> Preview
            </Button>
            <Button variant="outline" size="sm" disabled={submitting} onClick={() => handleSave('draft')}>
              <Save className="h-4 w-4 mr-1 text-slate-600" /> Save Draft
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => handleSave('sent')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Send className="h-4 w-4 mr-1" /> Save & Send
            </Button>
          </div>
        }
      />

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Customer Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Customer *</label>
                <CustomerSelector
                  value={selectedCustomer?.id}
                  onChange={(c) => setSelectedCustomer(c)}
                />
              </div>

              {selectedCustomer && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{selectedCustomer.displayName}</p>
                  <p className="text-slate-600">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                  {selectedCustomer.gstin && <p className="font-mono text-indigo-700 font-semibold">GSTIN: {selectedCustomer.gstin}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Dates & Terms */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Invoice Date *</label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Due Date *</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Terms</label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 15 Days" className="h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* Editable Line Items */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Items</h3>
              <span className="text-xs text-slate-400 font-mono">Currency: INR (₹)</span>
            </div>

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
                          placeholder="Item or Service Title"
                          className="h-8 text-xs font-semibold"
                        />
                        <Input
                          value={row.description || ''}
                          onChange={(e) => updateItemRow(index, { description: e.target.value })}
                          placeholder="Line item description..."
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

          {/* Notes, Terms & Totals */}
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

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="roundOff"
                  checked={applyRoundOff}
                  onChange={(e) => setApplyRoundOff(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="roundOff" className="text-xs font-semibold text-slate-700">
                  Round Off Grand Total
                </label>
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
              {applyRoundOff && (
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans text-slate-500">Round Off:</span>
                  <CurrencyDisplay amount={totals.roundOff} />
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 pt-2 text-slate-900">
                <span className="font-sans">Grand Total:</span>
                <CurrencyDisplay amount={totals.grandTotal} className="text-base text-indigo-700" />
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 font-sans">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 text-xs">
                  <span>Balance Due:</span>
                  <CurrencyDisplay amount={totals.grandTotal} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <DocumentPreview
              documentType="Invoice"
              documentData={buildInvoiceObject('draft') as any}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
