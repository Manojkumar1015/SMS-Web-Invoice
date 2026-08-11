'use client';

import * as React from 'react';
import { ToastMessage } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((t) => {
        const icons = {
          default: <Info className="h-4 w-4 text-slate-500 shrink-0" />,
          success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
          destructive: <XCircle className="h-4 w-4 text-red-600 shrink-0" />,
          info: <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />,
        };

        const bgColors = {
          default: 'bg-surface border-border',
          success: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
          destructive: 'bg-red-50/90 border-red-200 text-red-900',
          info: 'bg-blue-50/90 border-blue-200 text-blue-900',
        };

        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start justify-between rounded-lg border p-3 shadow-md animate-in slide-in-from-bottom-5 duration-200',
              bgColors[t.variant || 'default']
            )}
          >
            <div className="flex items-start space-x-2.5">
              {icons[t.variant || 'default']}
              <div className="text-xs">
                <div className="font-semibold">{t.title}</div>
                {t.description && <div className="mt-0.5 text-muted-foreground">{t.description}</div>}
              </div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
