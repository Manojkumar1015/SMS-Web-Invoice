'use client';

import * as React from 'react';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DocumentPaymentSection } from './document-payment-section';

interface DocumentTotalsProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff?: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  showPaymentDetails?: boolean;
}

export function DocumentTotals({
  subtotal,
  discountTotal,
  taxTotal,
  roundOff = 0,
  total,
  amountPaid,
  amountDue,
  showPaymentDetails = true,
}: DocumentTotalsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-200 pt-6 text-xs">
      <div className="flex-1">
        {showPaymentDetails && <DocumentPaymentSection />}
      </div>

      <div className="w-full sm:w-80 space-y-2.5 text-right font-mono">
        <div className="flex justify-between text-slate-600">
          <span className="font-sans text-slate-500">Subtotal:</span>
          <CurrencyDisplay amount={subtotal} className="font-semibold text-slate-800" />
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span className="font-sans text-emerald-700">Discount Total:</span>
            <span>- <CurrencyDisplay amount={discountTotal} /></span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span className="font-sans text-slate-500">Tax Total (GST):</span>
          <CurrencyDisplay amount={taxTotal} className="font-semibold text-slate-800" />
        </div>

        {roundOff !== 0 && (
          <div className="flex justify-between text-slate-500">
            <span className="font-sans text-slate-500">Round Off:</span>
            <CurrencyDisplay amount={roundOff} />
          </div>
        )}

        <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 pt-2.5 text-slate-900">
          <span className="font-sans">Grand Total:</span>
          <CurrencyDisplay amount={total} className="text-base text-indigo-700" />
        </div>

        {amountPaid !== undefined && (
          <div className="flex justify-between text-emerald-600 font-bold pt-1">
            <span className="font-sans text-emerald-700">Amount Paid:</span>
            <CurrencyDisplay amount={amountPaid} />
          </div>
        )}

        {amountDue !== undefined && (
          <div className="flex justify-between text-red-600 font-black text-sm border-t border-dashed border-slate-200 pt-2 bg-red-50/50 p-2 rounded-lg">
            <span className="font-sans text-red-700">Balance Due:</span>
            <CurrencyDisplay amount={amountDue} />
          </div>
        )}
      </div>
    </div>
  );
}
