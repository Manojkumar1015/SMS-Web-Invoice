'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoiceService, paymentService, templateService } from '@/services';
import { Invoice } from '@/types/invoice';
import { Payment } from '@/types/payment';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DocumentPreview } from '@/components/domain/document/document-preview';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { InvoiceStatusBadge } from '@/components/domain/invoice/invoice-status-badge';
import { DocumentNumber } from '@/components/ui/document-number';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Edit, Copy, Download, Printer, Send, CreditCard, Ban, ArrowLeft, History, Clock, Receipt, CheckCircle2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [cancellingInvoice, setCancellingInvoice] = React.useState(false);
  const [template, setTemplate] = React.useState<InvoiceTemplate | null>(null);

  const loadInvoiceData = React.useCallback(async () => {
    setLoading(true);
    try {
      const inv = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(inv);
      if (inv) {
        const pmts = await paymentService.getPayments({ search: inv.invoiceNumber });
        setPayments(pmts.data.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber));
      }
      const defTmpl = await templateService.getDefaultTemplate();
      setTemplate(defTmpl);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  React.useEffect(() => {
    loadInvoiceData();
  }, [loadInvoiceData]);

  const handleDuplicate = async () => {
    if (!invoice) return;
    try {
      const dup = await invoiceService.duplicateInvoice(invoice.id);
      toast({ title: 'Invoice Duplicated', description: `Created draft ${dup.invoiceNumber}.`, variant: 'success' });
      router.push(`/app/invoices/${dup.id}`);
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate invoice.', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!invoice) return;
    try {
      await invoiceService.sendInvoice(invoice.id);
      toast({ title: 'Invoice Sent', description: `Emailed invoice copy to ${invoice.customerEmail}`, variant: 'info' });
      loadInvoiceData();
    } catch {
      toast({ title: 'Error', description: 'Could not send invoice.', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    try {
      await invoiceService.cancelInvoice(invoice.id);
      toast({ title: 'Invoice Cancelled', description: `Invoice ${invoice.invoiceNumber} marked as cancelled.`, variant: 'info' });
      setCancellingInvoice(false);
      loadInvoiceData();
    } catch {
      toast({ title: 'Error', description: 'Could not cancel invoice.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingState message="Loading invoice details..." />;
  }

  if (!invoice) {
    return (
      <ErrorState
        title="Invoice Not Found"
        description="The requested invoice document could not be located."
        action={
          <Button variant="outline" size="sm" onClick={() => router.push('/app/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Invoices
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Billed to ${invoice.customerName}`}
        breadcrumbs={[
          { label: 'Invoices', href: '/app/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/app/invoices/${invoice.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSend}>
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>

            {invoice.amountDue > 0 && invoice.status !== 'cancelled' && (
              <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <CreditCard className="h-4 w-4 mr-1.5" /> Record Payment
              </Button>
            )}

            {invoice.status !== 'cancelled' && (
              <Button variant="outline" size="sm" onClick={() => setCancellingInvoice(true)} className="text-amber-700 border-amber-300 hover:bg-amber-50">
                <Ban className="h-4 w-4 mr-1" /> Cancel
              </Button>
            )}
          </div>
        }
      />

      {/* Top Banner Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Number</span>
          <div className="mt-1">
            <DocumentNumber number={invoice.invoiceNumber} type="invoice" />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
          <div className="mt-1">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Total</span>
          <div className="mt-1 text-sm font-extrabold text-slate-900">
            <CurrencyDisplay amount={invoice.total} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
          <div className="mt-1 text-sm font-extrabold text-emerald-600">
            <CurrencyDisplay amount={invoice.amountPaid} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Balance Due</span>
          <div className={`mt-1 text-base font-black ${invoice.amountDue > 0 ? 'text-red-600' : 'text-slate-500'}`}>
            <CurrencyDisplay amount={invoice.amountDue} />
          </div>
        </div>
      </div>

      {/* Payment Summary Box (If partially paid or has balance) */}
      {invoice.amountPaid > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Payment Breakdown</h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                ₹{invoice.amountPaid.toLocaleString('en-IN')} paid out of ₹{invoice.total.toLocaleString('en-IN')} total bill.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Total</span>
              <strong className="text-slate-900"><CurrencyDisplay amount={invoice.total} /></strong>
            </div>
            <div>
              <span className="text-slate-500 block">Paid</span>
              <strong className="text-emerald-600"><CurrencyDisplay amount={invoice.amountPaid} /></strong>
            </div>
            <div>
              <span className="text-slate-500 block">Balance</span>
              <strong className="text-red-600 font-bold"><CurrencyDisplay amount={invoice.amountDue} /></strong>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview" className="text-xs font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-semibold">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs font-semibold">Activity Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {template ? (
            <DocumentRenderer
              documentType="Invoice"
              documentData={invoice}
              templateConfig={template.config}
              sampleMode={false}
            />
          ) : (
            <DocumentPreview documentType="Invoice" documentData={invoice} />
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="max-w-4xl mx-auto border-slate-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-600" /> Recorded Payment Receipts
                </h3>
                {invoice.amountDue > 0 && invoice.status !== 'cancelled' && (
                  <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                    <CreditCard className="h-3.5 w-3.5 mr-1" /> Record Payment
                  </Button>
                )}
              </div>

              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No payment transactions recorded for this invoice yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 p-3 font-bold text-slate-600 grid grid-cols-5 uppercase text-[10px]">
                    <span>Receipt #</span>
                    <span>Date</span>
                    <span>Method</span>
                    <span>Reference / UTR</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {payments.map((pmt) => (
                    <div key={pmt.id} className="p-3 grid grid-cols-5 items-center hover:bg-slate-50">
                      <span className="font-mono font-bold text-indigo-600">{pmt.paymentNumber}</span>
                      <DateDisplay date={pmt.date} />
                      <span className="capitalize text-slate-700">{pmt.paymentMethod.replace('_', ' ')}</span>
                      <span className="font-mono text-slate-600">{pmt.referenceNumber || '-'}</span>
                      <CurrencyDisplay amount={pmt.amount} className="text-right font-extrabold text-emerald-600 font-mono" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="max-w-4xl mx-auto border-slate-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <History className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Activity History</h3>
              </div>

              <div className="space-y-4 pl-2">
                {(invoice.activities && invoice.activities.length > 0 ? invoice.activities : [
                  {
                    id: 'iact-def-1',
                    title: 'Invoice Generated',
                    description: `Invoice drafted for ${invoice.customerName}`,
                    timestamp: invoice.createdAt,
                    actor: 'System',
                    type: 'created',
                  },
                ]).map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 text-xs">
                    <div className="mt-0.5 rounded-full p-1 bg-indigo-50 text-indigo-600 border border-indigo-200">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.title}</span>
                        <DateDisplay date={act.timestamp} showTime className="text-[11px] text-slate-400" />
                      </div>
                      <p className="text-slate-600 mt-0.5">{act.description}</p>
                      {act.actor && <span className="text-[10px] text-slate-400 block mt-0.5">By {act.actor}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      {paymentDialogOpen && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={invoice}
          onSuccess={() => loadInvoiceData()}
        />
      )}

      {/* Confirm Cancel Dialog */}
      {cancellingInvoice && (
        <ConfirmDialog
          open={cancellingInvoice}
          onOpenChange={setCancellingInvoice}
          title="Cancel Invoice?"
          description={`Are you sure you want to cancel invoice ${invoice.invoiceNumber}?`}
          confirmLabel="Cancel Invoice"
          variant="destructive"
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}
