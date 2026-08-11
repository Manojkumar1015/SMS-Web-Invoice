'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CustomerAvatarProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CustomerAvatar({ name, className, size = 'md' }: CustomerAvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm font-bold',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-800 border border-indigo-200 shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {initials || 'C'}
    </div>
  );
}
