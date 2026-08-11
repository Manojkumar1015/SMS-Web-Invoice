'use client';

import * as React from 'react';
import { PaymentMethod } from '@/types/payment';
import { Badge } from '@/components/ui/badge';
import { Building2, Smartphone, CreditCard, Banknote, FileCheck, HelpCircle } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: PaymentMethod | string;
  className?: string;
}

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  const normalized = (method || '').toLowerCase();

  switch (normalized) {
    case 'bank_transfer':
    case 'neft':
    case 'rtgs':
    case 'imps':
      return (
        <Badge variant="purple" className={className}>
          <Building2 className="h-3 w-3 mr-1" /> Bank Transfer (NEFT/RTGS)
        </Badge>
      );
    case 'upi':
      return (
        <Badge variant="info" className={className}>
          <Smartphone className="h-3 w-3 mr-1" /> UPI / QR
        </Badge>
      );
    case 'credit_card':
    case 'card':
      return (
        <Badge variant="secondary" className={className}>
          <CreditCard className="h-3 w-3 mr-1" /> Credit / Debit Card
        </Badge>
      );
    case 'cash':
      return (
        <Badge variant="success" className={className}>
          <Banknote className="h-3 w-3 mr-1" /> Cash
        </Badge>
      );
    case 'cheque':
      return (
        <Badge variant="warning" className={className}>
          <FileCheck className="h-3 w-3 mr-1" /> Cheque
        </Badge>
      );
    default:
      return (
        <Badge variant="slate" className={className}>
          <HelpCircle className="h-3 w-3 mr-1" /> {method}
        </Badge>
      );
  }
}
