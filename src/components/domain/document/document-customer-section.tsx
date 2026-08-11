'use client';

import * as React from 'react';
import { Customer } from '@/types/customer';

interface DocumentCustomerSectionProps {
  customerName: string;
  customerEmail: string;
  customerGstin?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export function DocumentCustomerSection({
  customerName,
  customerEmail,
  customerGstin,
  customerAddress,
}: DocumentCustomerSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-surface-hover/50 border border-border mb-6 text-xs">
      <div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
          Billed To:
        </span>
        <h4 className="font-bold text-sm text-foreground">{customerName}</h4>
        <p className="text-muted-foreground mt-0.5">{customerEmail}</p>
        {customerGstin && (
          <p className="font-mono text-slate-600 mt-1 font-medium">GSTIN: {customerGstin}</p>
        )}
      </div>

      {customerAddress && (
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Billing Address:
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {customerAddress.street}
            {customerAddress.street && <br />}
            {customerAddress.city}, {customerAddress.state} {customerAddress.postalCode}
            <br />
            {customerAddress.country}
          </p>
        </div>
      )}
    </div>
  );
}
