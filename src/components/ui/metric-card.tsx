'use client';

import * as React from 'react';
import { Card, CardContent } from './card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface MetricCardProps {
  label: string;
  amount: number;
  change?: number; // percentage change
  subtext?: string;
  currency?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  label,
  amount,
  change,
  subtext,
  currency = 'INR',
  icon,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="relative overflow-hidden transition-all hover:border-slate-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(amount, currency)}
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full',
                isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        {subtext && <p className="mt-1 text-[11px] text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
