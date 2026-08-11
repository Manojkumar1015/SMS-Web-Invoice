'use client';

import * as React from 'react';
import { Payment } from '@/types/payment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { PaymentStatusBadge } from './payment-status-badge';
import { PaymentMethodBadge } from './payment-method-badge';
import { Printer, Download, CheckCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function PaymentReceiptModal({ open, onOpenChange, payment }: PaymentReceiptModalProps) {
  const { toast } = useToast();

  if (!payment) return null;

  const handlePrint = () => {
    toast({ title: 'Print Receipt', description: 'Opening system print dialog...', variant: 'info' });
    window.print();
  };

  const handleDownload = () => {
    toast({ title: 'Download PDF', description: `Receipt ${payment.paymentNumber} downloaded.`, variant: 'success' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Payment Receipt Preview
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Printable Receipt Canvas */}
        <div className="py-4 bg-white border border-slate-200 rounded-xl p-8 space-y-6 text-slate-900 shadow-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  SMS
                </div>
                <h3 className="font-bold text-base text-slate-900">Acme Software Solutions Pvt Ltd</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">GSTIN: 27AAAAA0000A1Z5 • BKC, Mumbai 400051</p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 block">
                PAYMENT RECEIPT
              </span>
              <p className="font-mono text-xs font-bold text-slate-800">{payment.paymentNumber}</p>
              <p className="text-xs text-slate-500">
                Date: <DateDisplay date={payment.date} className="text-slate-800 font-semibold" />
              </p>
            </div>
          </div>

          {/* Amount Callout Box */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Amount Received
              </span>
              <span className="text-xs text-emerald-700">Cleared in full</span>
            </div>
            <CurrencyDisplay amount={payment.amount} className="text-2xl font-black text-emerald-700 font-mono" />
          </div>

          {/* Customer & Invoice Details */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Received From:
              </span>
              <h4 className="font-bold text-sm text-slate-900">{payment.customerName}</h4>
              {payment.customerEmail && <p className="text-slate-600">{payment.customerEmail}</p>}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Applied To Invoice:
              </span>
              <p className="font-bold text-slate-900 font-mono text-sm">{payment.invoiceNumber}</p>
              <div className="flex items-center space-x-2 pt-1">
                <PaymentMethodBadge method={payment.paymentMethod} />
                <PaymentStatusBadge status={payment.status} />
              </div>
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-slate-800 text-xs">Transaction Details</h5>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-4 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block font-sans text-[10px] uppercase">Payment Method:</span>
                <span className="font-semibold text-slate-800 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[10px] uppercase">Reference / UTR / Cheque #:</span>
                <span className="font-semibold text-slate-800">{payment.referenceNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="text-xs text-slate-600 pt-2">
              <span className="font-bold text-slate-700 block mb-1">Notes:</span>
              <p className="p-2.5 bg-slate-50 rounded border border-slate-200 italic">{payment.notes}</p>
            </div>
          )}

          {/* Footer Signature */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400">
            <p>Computer generated payment receipt.</p>
            <div className="text-right">
              <div className="h-10 border-b border-slate-300 w-36 mb-1" />
              <p className="font-bold text-slate-700">Accounts Department</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </div>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
