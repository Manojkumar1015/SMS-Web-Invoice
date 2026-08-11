'use client';

import * as React from 'react';
import { ExpenseCategory } from '@/types/expense';
import { Badge } from '@/components/ui/badge';
import { Laptop, Home, Zap, Car, Plane, Package, Megaphone, Wrench, Briefcase, Tag } from 'lucide-react';

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory | string;
  className?: string;
}

export function ExpenseCategoryBadge({ category, className }: ExpenseCategoryBadgeProps) {
  const norm = (category || '').toLowerCase();

  let Icon = Tag;
  if (norm.includes('software')) Icon = Laptop;
  else if (norm.includes('rent')) Icon = Home;
  else if (norm.includes('electricity') || norm.includes('utilities')) Icon = Zap;
  else if (norm.includes('fuel') || norm.includes('transport')) Icon = Car;
  else if (norm.includes('travel')) Icon = Plane;
  else if (norm.includes('material') || norm.includes('office')) Icon = Package;
  else if (norm.includes('marketing')) Icon = Megaphone;
  else if (norm.includes('maintenance')) Icon = Wrench;
  else if (norm.includes('professional') || norm.includes('salary')) Icon = Briefcase;

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${className || ''}`}>
      <Icon className="h-3 w-3 mr-1 text-slate-500 shrink-0" />
      {category}
    </span>
  );
}
