'use client';

import * as React from 'react';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  date: string;
  formatStr?: string;
  className?: string;
}

export function DateDisplay({ date, formatStr = 'dd MMM yyyy', className }: DateDisplayProps) {
  return <span className={cn('text-xs text-muted-foreground', className)}>{formatDate(date, formatStr)}</span>;
}
