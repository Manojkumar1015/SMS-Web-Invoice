'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { paymentService, invoiceService } from '@/services';
import { Payment } from '@/types/payment';
import { Invoice } from '@/types/invoice';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { PaymentStatusBadge } from '@/components/domain/payment/payment-status-badge';
import { PaymentMethodBadge } from '@/components/domain/payment/payment-method-badge';
import { PaymentReceiptModal } from '@/components/domain/payment/payment-receipt-modal';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, Edit, Trash2, Download, Printer, FileText, CheckCircle2, History, CreditCard, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();

  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const fetchPayment = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await paymentService.getPaymentById(id);
      setPayment(data);
      if (data?.invoiceId) {
        const inv = await invoiceService.getInvoiceById(data.invoiceId);
        setInvoice(inv);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleDelete = async () => {
    if (!payment) return;
    try {
      await paymentService.deletePayment(payment.id);
      toast({ title: 'Payment Record Deleted', description: 'Payment removed successfully.', variant: 'info' });
      router.push('/app/payments');
    } catch {
      toast({ title: 'Error', description: 'Could not delete payment.', variant: 'destructive' });
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading payment details..." />;
  }

  if (!payment) {
    return (
      <ErrorState
        title="Payment Record Not Found"
        description="The requested payment receipt does not exist."
        action={
          <Button onClick={() => router.push('/app/payments')} className="mt-4">
            Back to Payments
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={payment.paymentNumber}
        subtitle={`Payment received from ${payment.customerName}`}
        breadcrumbs={[
          { label: 'Payments', href: '/app/payments' },
          { label: payment.paymentNumber },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/payments')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReceiptOpen(true)}>
              <Printer className="h-4 w-4 mr-1.5 text-slate-600" /> Receipt Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleting(true)} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </div>
        }
      />

      {/* Metric Callout Card */}
      <Card className="border-slate-200 shadow-xs bg-slate-50/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Amount Received</span>
              <CurrencyDisplay amount={payment.amount} className="text-2xl font-black text-emerald-600 font-mono" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Method</span>
              <PaymentMethodBadge method={payment.paymentMethod} />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Date</span>
              <DateDisplay date={payment.date} className="font-bold text-slate-900 text-sm" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <PaymentStatusBadge status={payment.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Breakdown */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
            Payment Allocation Summary
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Total Payment Amount:</span>
              <CurrencyDisplay amount={payment.amount} className="font-bold text-slate-900 font-mono" />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-700">Allocated to Invoice:</span>
              <CurrencyDisplay amount={payment.allocatedAmount} className="font-bold text-emerald-600 font-mono" />
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 font-bold">
              <span className="text-slate-700">Unallocated Balance:</span>
              <CurrencyDisplay amount={payment.unallocatedAmount} className="font-mono text-slate-900" />
            </div>
          </div>

          {/* Applied Invoice Row */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 p-2.5 font-bold text-slate-700 grid grid-cols-4 uppercase text-[10px]">
              <span>Applied Invoice</span>
              <span>Invoice Date</span>
              <span>Invoice Total</span>
              <span className="text-right">Allocated Amount</span>
            </div>
            <div className="p-3 grid grid-cols-4 items-center bg-white">
              <Link href={`/app/invoices/${payment.invoiceId}`} className="font-mono font-bold text-indigo-600 hover:underline">
                {payment.invoiceNumber}
              </Link>
              <DateDisplay date={invoice?.date || payment.date} />
              <CurrencyDisplay amount={invoice?.total || payment.amount} className="font-mono" />
              <CurrencyDisplay amount={payment.allocatedAmount} className="text-right font-extrabold text-emerald-600 font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info & Attachment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
              Transaction References
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Reference / UTR Number:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{payment.referenceNumber || 'N/A'}</span>
              </div>
              {payment.notes && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Notes:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 italic mt-0.5">{payment.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
              Attachment Voucher
            </h3>
            {payment.attachmentName ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-6 w-6 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{payment.attachmentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{payment.attachmentSize || 'Uploaded File'}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Download Attachment', description: `Downloading ${payment.attachmentName}`, variant: 'info' })}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-slate-400 italic py-4 text-center">No attachment upload provided for this payment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      {payment.activities && payment.activities.length > 0 && (
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" /> Audit Log & Activity History
            </h3>
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {payment.activities.map((act) => (
                <div key={act.id} className="pt-2 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800 block">{act.title}</span>
                    <p className="text-slate-500 text-[11px]">{act.details}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <span>{act.user}</span>
                    <DateDisplay date={act.timestamp} showTime className="block text-slate-500 font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Modal */}
      <PaymentReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        payment={payment}
      />

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title="Delete Payment Record?"
          description="Are you sure you want to delete this payment record? This action cannot be undone."
          confirmLabel="Delete Payment"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
