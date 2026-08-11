'use client';

import * as React from 'react';
import { CurrencyDisplay } from '@/components/ui/currency-display';

interface DocumentTotalsProps {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
}

export function DocumentTotals({
  subtotal,
  discountTotal,
  taxTotal,
  total,
  amountPaid,
  amountDue,
}: DocumentTotalsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-border pt-4 text-xs">
      <div className="flex-1 space-y-2">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Payment & Bank Details:
        </div>
        <div className="p-3 rounded-lg bg-surface-hover/50 border border-border text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">HDFC Bank Corporate Account</p>
          <p>A/C No: 50200019283746 • IFSC: HDFC0000123</p>
          <p>Branch: BKC Branch, Mumbai</p>
          <p>UPI ID: acmesoftware@hdfcbank</p>
        </div>
      </div>

      <div className="w-full sm:w-80 space-y-2 text-right">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal:</span>
          <CurrencyDisplay amount={subtotal} className="font-medium text-foreground" />
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount:</span>
            <span>- <CurrencyDisplay amount={discountTotal} /></span>
          </div>
        )}

        <div className="flex justify-between text-muted-foreground">
          <span>GST / Tax Total:</span>
          <CurrencyDisplay amount={taxTotal} className="font-medium text-foreground" />
        </div>

        <div className="flex justify-between text-sm font-bold border-t border-border pt-2 text-foreground">
          <span>Total Amount:</span>
          <CurrencyDisplay amount={total} className="text-base text-accent" />
        </div>

        {amountPaid !== undefined && (
          <div className="flex justify-between text-emerald-600 font-semibold pt-1">
            <span>Amount Paid:</span>
            <CurrencyDisplay amount={amountPaid} />
          </div>
        )}

        {amountDue !== undefined && (
          <div className="flex justify-between text-red-600 font-extrabold text-sm border-t border-dashed border-border pt-2">
            <span>Balance Due:</span>
            <CurrencyDisplay amount={amountDue} />
          </div>
        )}
      </div>
    </div>
  );
}
