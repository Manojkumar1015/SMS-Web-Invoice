'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { DateDisplay } from '@/components/ui/date-display';

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
  companyName = 'Acme Software Solutions Pvt Ltd',
}: DocumentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 mb-6">
      <div>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-xs text-lg">
            S
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{companyName}</h2>
            <p className="text-xs text-muted-foreground">GSTIN: 27AAAAA0000A1Z5 • PAN: AAAAA0000A</p>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 text-left sm:text-right">
        <div className="flex items-center sm:justify-end space-x-2">
          <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">{type}</span>
          <StatusBadge status={status} />
        </div>
        <div className="mt-1 text-xs font-mono font-semibold text-slate-700">{documentNumber}</div>
        <div className="mt-1 text-xs text-muted-foreground flex sm:justify-end gap-3">
          <span>
            Date: <DateDisplay date={date} className="font-medium text-foreground" />
          </span>
          <span>
            {type === 'Invoice' ? 'Due Date' : 'Valid Until'}:{' '}
            <DateDisplay date={dueDateOrExpiry} className="font-medium text-foreground" />
          </span>
        </div>
      </div>
    </div>
  );
}
