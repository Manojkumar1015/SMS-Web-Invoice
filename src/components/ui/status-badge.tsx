'use client';

import * as React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export type GeneralStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: GeneralStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(' ', '_');

  const statusMap: Record<
    string,
    { label: string; variant: 'slate' | 'info' | 'warning' | 'success' | 'destructive' | 'outline' }
  > = {
    draft: { label: 'Draft', variant: 'slate' },
    sent: { label: 'Sent', variant: 'info' },
    viewed: { label: 'Viewed', variant: 'info' },
    partially_paid: { label: 'Partially Paid', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'slate' },
    accepted: { label: 'Accepted', variant: 'success' },
    declined: { label: 'Declined', variant: 'destructive' },
    expired: { label: 'Expired', variant: 'slate' },
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'slate' },
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
