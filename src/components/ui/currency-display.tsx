'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  negativeIsRed?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = 'INR',
  className,
  negativeIsRed = true,
}: CurrencyDisplayProps) {
  const isNegative = amount < 0;

  return (
    <span
      className={cn(
        'font-mono text-sm font-medium tracking-tight',
        negativeIsRed && isNegative && 'text-red-600 font-semibold',
        className
      )}
    >
      {formatCurrency(amount, currency)}
    </span>
  );
}
