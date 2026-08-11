'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DocumentNumberProps {
  number: string;
  type?: 'quote' | 'invoice' | string;
  className?: string;
}

export function DocumentNumber({ number, type = 'invoice', className }: DocumentNumberProps) {
  const isQuote = type.toLowerCase().includes('quote') || number.startsWith('QUO');

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded border',
        isQuote
          ? 'bg-indigo-50/60 text-indigo-700 border-indigo-200/80'
          : 'bg-slate-100/80 text-slate-800 border-slate-200',
        className
      )}
    >
      {number}
    </span>
  );
}
