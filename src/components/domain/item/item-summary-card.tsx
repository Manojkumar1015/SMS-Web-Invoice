'use client';

import * as React from 'react';
import { Item } from '@/types/item';
import { Card, CardContent } from '@/components/ui/card';
import { ItemTypeBadge } from './item-type-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';

interface ItemSummaryCardProps {
  item: Item;
}

export function ItemSummaryCard({ item }: ItemSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-foreground">{item.name}</span>
              <ItemTypeBadge type={item.type} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {item.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <div>
            <span className="text-muted-foreground text-[10px] block">Selling Price</span>
            <CurrencyDisplay amount={item.sellingPrice} className="font-bold text-foreground" />
            <span className="text-[10px] text-slate-400 font-normal"> / {item.unit}</span>
          </div>
          {item.hsnSac && (
            <div className="text-right">
              <span className="text-muted-foreground text-[10px] block">HSN/SAC</span>
              <span className="font-mono text-xs font-semibold">{item.hsnSac}</span>
            </div>
          )}
          <div className="text-right">
            <span className="text-muted-foreground text-[10px] block">Tax Rate</span>
            <span className="font-semibold text-emerald-600">{item.taxRate}% GST</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
