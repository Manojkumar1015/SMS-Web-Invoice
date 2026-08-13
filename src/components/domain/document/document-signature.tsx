'use client';

import * as React from 'react';

interface DocumentSignatureProps {
  companyName?: string;
}

export function DocumentSignature({ companyName = 'Authorized Signatory' }: DocumentSignatureProps) {
  return (
    <div className="flex justify-end pt-8">
      <div className="text-center w-56 space-y-2">
        <div className="h-16 border-b border-slate-300 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-75">
            <span className="font-serif italic text-indigo-700 text-lg font-bold rotate-[-6deg] border-2 border-indigo-400 px-3 py-1 rounded">
              Digitally Signed
            </span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-800">Authorized Signatory</p>
        <p className="text-[11px] text-slate-500">{companyName}</p>
      </div>
    </div>
  );
}
