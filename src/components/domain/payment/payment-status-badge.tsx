'use client';

import * as React from 'react';
import { PaymentStatus } from '@/types/payment';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const normalized = (status || 'received').toLowerCase();

  switch (normalized) {
    case 'received':
    case 'fully_allocated':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="h-3 w-3 mr-1" /> Cleared / Fully Allocated
        </Badge>
      );
    case 'partially_allocated':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="h-3 w-3 mr-1" /> Partially Allocated
        </Badge>
      );
    case 'unallocated':
      return (
        <Badge variant="info" className={className}>
          <AlertCircle className="h-3 w-3 mr-1" /> Unallocated Payment
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="h-3 w-3 mr-1" /> Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="slate" className={className}>
          {status}
        </Badge>
      );
  }
}
