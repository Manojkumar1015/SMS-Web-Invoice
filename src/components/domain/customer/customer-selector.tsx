'use client';

import * as React from 'react';
import { customerService } from '@/services';
import { Customer } from '@/types/customer';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

interface CustomerSelectorProps {
  value?: string;
  onChange: (customer: Customer | null) => void;
  error?: string;
}

export function CustomerSelector({ value, onChange, error }: CustomerSelectorProps) {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await customerService.getCustomers();
        setCustomers(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const options: ComboboxOption[] = customers.map((c) => ({
    value: c.id,
    label: c.displayName,
    sublabel: `${c.companyName || c.email} ${c.gstin ? '• GST: ' + c.gstin : ''}`,
  }));

  const handleSelect = (selectedId: string) => {
    const found = customers.find((c) => c.id === selectedId) || null;
    onChange(found);
  };

  return (
    <Combobox
      options={options}
      value={value}
      onChange={handleSelect}
      placeholder={loading ? 'Loading customers...' : 'Select or search customer...'}
      error={error}
    />
  );
}
