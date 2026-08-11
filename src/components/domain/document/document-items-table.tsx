'use client';

import * as React from 'react';
import { DocumentItem } from '@/types/quote';
import { CurrencyDisplay } from '@/components/ui/currency-display';

interface DocumentItemsTableProps {
  items: DocumentItem[];
}

export function DocumentItemsTable({ items }: DocumentItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-6">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-10 text-center">#</th>
            <th className="px-4 py-3">Item / Service Description</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Rate</th>
            <th className="px-4 py-3 text-right">Discount</th>
            <th className="px-4 py-3 text-right">Tax (%)</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 text-center font-mono text-slate-400">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="font-bold text-slate-900">{item.name}</div>
                {item.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</div>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                {item.quantity} {item.unit}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                <CurrencyDisplay amount={item.rate} />
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 font-mono whitespace-nowrap">
                {item.discount > 0 ? `- ₹${item.discount.toLocaleString('en-IN')}` : '-'}
              </td>
              <td className="px-4 py-3 text-right text-slate-500 font-mono whitespace-nowrap">{item.taxRate}%</td>
              <td className="px-4 py-3 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">
                <CurrencyDisplay amount={item.amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
