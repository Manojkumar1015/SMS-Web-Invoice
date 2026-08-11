'use client';

import * as React from 'react';

export function DocumentPaymentSection() {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        Payment & Banking Details:
      </span>
      <p className="font-bold text-slate-900 text-sm">HDFC Bank Corporate Account</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
        <div>
          <span>A/C No: </span>
          <strong className="text-slate-800">50200019283746</strong>
        </div>
        <div>
          <span>IFSC Code: </span>
          <strong className="text-slate-800">HDFC0000123</strong>
        </div>
        <div>
          <span>Branch: </span>
          <strong className="text-slate-800">BKC Branch, Mumbai</strong>
        </div>
        <div>
          <span>UPI ID: </span>
          <strong className="text-indigo-600">acmesoftware@hdfcbank</strong>
        </div>
      </div>
    </div>
  );
}
