'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  negativeIsRed?: boolean;
  style?: React.CSSProperties;
}

export function CurrencyDisplay({
  amount,
  currency = 'INR',
  className,
  negativeIsRed = true,
  style,
}: CurrencyDisplayProps) {
  const isNegative = amount < 0;

  return (
    <span
      style={style}
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
