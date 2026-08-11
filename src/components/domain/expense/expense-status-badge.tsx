'use client';

import * as React from 'react';
import { ExpenseStatus } from '@/types/expense';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, FilePlus, XCircle, ArrowRightLeft } from 'lucide-react';

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus | string;
  className?: string;
}

export function ExpenseStatusBadge({ status, className }: ExpenseStatusBadgeProps) {
  const normalized = (status || 'recorded').toLowerCase();

  switch (normalized) {
    case 'recorded':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="h-3 w-3 mr-1" /> Recorded
        </Badge>
      );
    case 'billable':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="h-3 w-3 mr-1" /> Billable to Customer
        </Badge>
      );
    case 'added_to_invoice':
      return (
        <Badge variant="info" className={className}>
          <FilePlus className="h-3 w-3 mr-1" /> Added to Invoice
        </Badge>
      );
    case 'reimbursed':
      return (
        <Badge variant="purple" className={className}>
          <ArrowRightLeft className="h-3 w-3 mr-1" /> Reimbursed
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
