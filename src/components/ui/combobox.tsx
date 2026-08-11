'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  error,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          'w-full justify-between font-normal text-left h-9 px-3',
          !value && 'text-muted-foreground',
          error && 'border-red-500',
          className
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface p-1 shadow-md">
            <input
              type="text"
              className="w-full border-b border-border bg-transparent px-3 py-1.5 text-xs focus:outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 text-xs rounded-sm cursor-pointer hover:bg-surface-hover',
                      value === opt.value && 'bg-surface-hover font-semibold'
                    )}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <div>
                      <div>{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-muted-foreground">{opt.sublabel}</div>
                      )}
                    </div>
                    {value === opt.value && <Check className="h-3.5 w-3.5 text-accent" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
