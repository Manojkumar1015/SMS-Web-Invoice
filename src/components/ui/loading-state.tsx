'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading data...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-muted-foreground', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
      <span className="text-xs">{message}</span>
    </div>
  );
}
