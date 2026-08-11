'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

export function FilterBar({
  options,
  activeFilter,
  onFilterChange,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex items-center space-x-1 overflow-x-auto pb-1 text-xs', className)}>
      <div className="flex items-center text-muted-foreground mr-1 shrink-0">
        <Filter className="h-3.5 w-3.5 mr-1" />
      </div>
      {options.map((opt) => {
        const isActive = activeFilter === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={cn(
              'inline-flex items-center rounded-md px-2.5 py-1 font-medium transition-colors shrink-0',
              isActive
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-surface border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground'
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.2 text-[10px]',
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-hover text-muted-foreground'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
