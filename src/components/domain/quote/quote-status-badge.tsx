'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { QuoteStatus } from '@/types/quote';
import { cn } from '@/lib/utils';

interface QuoteStatusBadgeProps {
  status: QuoteStatus | string;
  className?: string;
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const normalized = (status || '').toLowerCase() as QuoteStatus;

  const statusMap: Record<
    string,
    { label: string; variant: 'slate' | 'info' | 'warning' | 'success' | 'destructive' | 'purple' }
  > = {
    draft: { label: 'Draft', variant: 'slate' },
    sent: { label: 'Sent', variant: 'info' },
    viewed: { label: 'Viewed', variant: 'info' },
    accepted: { label: 'Accepted', variant: 'success' },
    declined: { label: 'Declined', variant: 'destructive' },
    expired: { label: 'Expired', variant: 'warning' },
    converted: { label: 'Converted', variant: 'purple' },
  };

  const config = statusMap[normalized] || {
    label: status,
    variant: 'slate',
  };

  return (
    <Badge variant={config.variant as any} className={cn('capitalize text-[10px] font-semibold px-2 py-0.5', className)}>
      {config.label}
    </Badge>
  );
}
