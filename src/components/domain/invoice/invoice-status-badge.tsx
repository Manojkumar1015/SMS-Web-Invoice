'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types/invoice';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const normalized = (status || '').toLowerCase() as InvoiceStatus;

  const statusMap: Record<
    string,
    { label: string; variant: 'slate' | 'info' | 'warning' | 'success' | 'destructive' }
  > = {
    draft: { label: 'Draft', variant: 'slate' },
    sent: { label: 'Sent', variant: 'info' },
    viewed: { label: 'Viewed', variant: 'info' },
    partially_paid: { label: 'Partially Paid', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'slate' },
  };

  const config = statusMap[normalized] || {
    label: status,
    variant: 'slate',
  };

  return (
    <Badge variant={config.variant} className={cn('capitalize text-[10px] font-semibold px-2 py-0.5', className)}>
      {config.label}
    </Badge>
  );
}
