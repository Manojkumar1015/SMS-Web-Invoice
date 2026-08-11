'use client';

import * as React from 'react';

interface DocumentTermsProps {
  terms?: string;
}

export function DocumentTerms({ terms }: DocumentTermsProps) {
  if (!terms) return null;

  return (
    <div className="pt-4 border-t border-slate-200 text-xs text-slate-600">
      <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
        Terms & Conditions:
      </span>
      <p className="leading-relaxed whitespace-pre-line text-slate-600 italic">
        {terms}
      </p>
    </div>
  );
}
