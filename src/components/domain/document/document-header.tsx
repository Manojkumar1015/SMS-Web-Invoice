'use client';

import * as React from 'react';
import { DateDisplay } from '@/components/ui/date-display';
import { QuoteStatusBadge } from '@/components/domain/quote/quote-status-badge';
import { InvoiceStatusBadge } from '@/components/domain/invoice/invoice-status-badge';
import { DocumentNumber } from '@/components/ui/document-number';

interface DocumentHeaderProps {
  type: 'Invoice' | 'Quote';
  documentNumber: string;
  date: string;
  dueDateOrExpiry: string;
  status: string;
  companyName?: string;
  logoUrl?: string;
}

export function DocumentHeader({
  type,
  documentNumber,
  date,
  dueDateOrExpiry,
  status,
  companyName = 'Commercial Organization',
}: DocumentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 mb-6">
      <div>
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 font-extrabold text-white shadow-sm text-xl tracking-wider">
            SMS
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{companyName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Commercial Invoice Document</p>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 text-left sm:text-right">
        <div className="flex items-center sm:justify-end space-x-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">{type}</span>
          {type === 'Quote' ? (
            <QuoteStatusBadge status={status} />
          ) : (
            <InvoiceStatusBadge status={status} />
          )}
        </div>
        <div className="mt-1.5">
          <DocumentNumber number={documentNumber} type={type} />
        </div>
        <div className="mt-2 text-xs text-slate-600 flex flex-wrap sm:justify-end gap-x-4 gap-y-1">
          <span>
            <strong className="text-slate-700">Date:</strong>{' '}
            <DateDisplay date={date} className="font-medium text-slate-900" />
          </span>
          <span>
            <strong className="text-slate-700">{type === 'Invoice' ? 'Due Date:' : 'Valid Until:'}</strong>{' '}
            <DateDisplay date={dueDateOrExpiry} className="font-medium text-slate-900" />
          </span>
        </div>
      </div>
    </div>
  );
}
