'use client';

import * as React from 'react';

interface DocumentNotesProps {
  notes?: string;
}

export function DocumentNotes({ notes }: DocumentNotesProps) {
  if (!notes) return null;

  return (
    <div className="pt-4 border-t border-slate-200 text-xs text-slate-600">
      <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
        Customer Notes:
      </span>
      <p className="leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
        {notes}
      </p>
    </div>
  );
}
