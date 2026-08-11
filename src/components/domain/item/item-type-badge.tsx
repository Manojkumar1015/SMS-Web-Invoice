'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ItemType } from '@/types/item';
import { Package, Wrench } from 'lucide-react';

interface ItemTypeBadgeProps {
  type: ItemType;
}

export function ItemTypeBadge({ type }: ItemTypeBadgeProps) {
  if (type === 'service') {
    return (
      <Badge variant="info" className="text-[10px] font-medium inline-flex items-center gap-1">
        <Wrench className="h-3 w-3" />
        <span>Service</span>
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="text-[10px] font-medium inline-flex items-center gap-1">
      <Package className="h-3 w-3" />
      <span>Product</span>
    </Badge>
  );
}
