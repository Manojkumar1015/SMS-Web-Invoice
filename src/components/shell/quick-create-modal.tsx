'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Receipt, FilePlus, UserPlus, PackagePlus, CreditCard, Plus, ArrowRight } from 'lucide-react';

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (type: 'invoice' | 'quote' | 'customer' | 'item' | 'payment' | 'expense') => void;
}

export function QuickCreateModal({ open, onOpenChange, onSelectAction }: QuickCreateModalProps) {
  const router = useRouter();

  const actions = [
    {
      type: 'invoice' as const,
      title: 'New Invoice',
      description: 'Create a new invoice and bill a customer',
      icon: Receipt,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      action: () => {
        onOpenChange(false);
        router.push('/app/invoices/new');
      },
    },
    {
      type: 'quote' as const,
      title: 'New Quote / Estimate',
      description: 'Send a formal price quotation to a lead',
      icon: FilePlus,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      action: () => {
        onOpenChange(false);
        router.push('/app/quotes/new');
      },
    },
    {
      type: 'customer' as const,
      title: 'New Customer',
      description: 'Add a new client profile with billing info',
      icon: UserPlus,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: () => {
        onOpenChange(false);
        onSelectAction('customer');
      },
    },
    {
      type: 'item' as const,
      title: 'New Item / Service',
      description: 'Catalog a product or service with HSN & tax rate',
      icon: PackagePlus,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: () => {
        onOpenChange(false);
        onSelectAction('item');
      },
    },
    {
      type: 'payment' as const,
      title: 'Record Payment Received',
      description: 'Log bank transfer, card or UPI payment for an invoice',
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => {
        onOpenChange(false);
        onSelectAction('payment');
      },
    },
    {
      type: 'expense' as const,
      title: 'Add Business Expense',
      description: 'Record an operational bill or vendor payment',
      icon: Plus,
      color: 'text-red-600 bg-red-50 border-red-200',
      action: () => {
        onOpenChange(false);
        onSelectAction('expense');
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Create Menu</DialogTitle>
          <DialogDescription>Select what you would like to create right now.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2.5 mt-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.type}
                onClick={act.action}
                className="group flex items-center justify-between rounded-lg border border-border bg-surface p-3.5 hover:bg-surface-hover cursor-pointer transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${act.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{act.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
