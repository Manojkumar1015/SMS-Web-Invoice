'use client';

import * as React from 'react';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  date: string;
  formatStr?: string;
  showTime?: boolean;
  className?: string;
}

export function DateDisplay({ date, formatStr, showTime = false, className }: DateDisplayProps) {
  const defaultFormat = showTime ? 'dd MMM yyyy, HH:mm' : 'dd MMM yyyy';
  const effectiveFormat = formatStr || defaultFormat;
  return <span className={cn('text-xs text-slate-600', className)}>{formatDate(date, effectiveFormat)}</span>;
}
