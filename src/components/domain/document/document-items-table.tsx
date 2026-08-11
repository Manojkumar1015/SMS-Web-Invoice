'use client';

import * as React from 'react';
import { DocumentItem } from '@/types/quote';
import { CurrencyDisplay } from '@/components/ui/currency-display';

interface DocumentItemsTableProps {
  items: DocumentItem[];
}

export function DocumentItemsTable({ items }: DocumentItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface mb-6">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-hover text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Item / Service Description</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Rate</th>
            <th className="px-4 py-3 text-right">Tax</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-surface-hover/30">
              <td className="px-4 py-3 font-mono text-muted-foreground">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-foreground">{item.name}</div>
                {item.description && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.description}</div>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {item.quantity} {item.unit}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                <CurrencyDisplay amount={item.rate} />
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{item.taxRate}%</td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                <CurrencyDisplay amount={item.amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
