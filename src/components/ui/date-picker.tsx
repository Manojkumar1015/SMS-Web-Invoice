'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Input } from './input';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  error,
  min,
  max,
  className,
}: DatePickerProps) {
  return (
    <div className="relative w-full">
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        min={min}
        max={max}
        className={className}
      />
    </div>
  );
}
