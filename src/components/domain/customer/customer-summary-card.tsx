'use client';

import * as React from 'react';
import { Customer } from '@/types/customer';
import { CustomerAvatar } from './customer-avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

interface CustomerSummaryCardProps {
  customer: Customer;
}

export function CustomerSummaryCard({ customer }: CustomerSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <CustomerAvatar name={customer.displayName} size="lg" />
            <div>
              <h3 className="font-bold text-sm text-foreground">{customer.displayName}</h3>
              {customer.companyName && (
                <p className="text-xs text-muted-foreground">{customer.companyName}</p>
              )}
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{customer.phone}</span>
          </div>
          {customer.gstin && (
            <div className="col-span-1 sm:col-span-2 text-[11px] font-mono text-slate-500">
              GSTIN: <span className="font-semibold text-foreground">{customer.gstin}</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 bg-surface-hover/60 p-2.5 rounded-lg border border-border text-center">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Total Invoiced</div>
            <CurrencyDisplay amount={customer.totalInvoiced} className="text-xs font-bold text-foreground" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Paid</div>
            <CurrencyDisplay amount={customer.paid} className="text-xs font-bold text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground font-semibold">Outstanding</div>
            <CurrencyDisplay amount={customer.outstanding} className="text-xs font-bold text-red-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
