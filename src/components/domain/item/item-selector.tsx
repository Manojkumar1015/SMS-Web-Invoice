'use client';

import * as React from 'react';
import { itemService } from '@/services';
import { Item } from '@/types/item';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { formatCurrency } from '@/lib/formatters';

interface ItemSelectorProps {
  value?: string;
  onChange: (item: Item | null) => void;
  error?: string;
}

export function ItemSelector({ value, onChange, error }: ItemSelectorProps) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadItems() {
      try {
        const res = await itemService.getItems();
        setItems(res.data.filter((i) => i.status === 'active'));
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  const options: ComboboxOption[] = items.map((i) => ({
    value: i.id,
    label: i.name,
    sublabel: `SKU: ${i.sku} • ${formatCurrency(i.sellingPrice)} / ${i.unit} (${i.taxRate}% GST)`,
  }));

  const handleSelect = (selectedId: string) => {
    const found = items.find((i) => i.id === selectedId) || null;
    onChange(found);
  };

  return (
    <Combobox
      options={options}
      value={value}
      onChange={handleSelect}
      placeholder={loading ? 'Loading catalog...' : 'Search item or service...'}
      error={error}
    />
  );
}
