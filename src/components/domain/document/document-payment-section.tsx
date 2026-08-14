'use client';

import * as React from 'react';

interface DocumentPaymentSectionProps {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
}

export function DocumentPaymentSection({
  bankName,
  accountName,
  accountNumber,
  ifscCode,
  branch,
  upiId,
}: DocumentPaymentSectionProps) {
  const hasDetails = bankName || accountNumber || ifscCode;

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        Payment & Banking Details:
      </span>
      {hasDetails ? (
        <>
          {bankName && <p className="font-bold text-slate-900 text-sm">{bankName}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
            {accountName && (
              <div>
                <span>A/C Name: </span>
                <strong className="text-slate-800">{accountName}</strong>
              </div>
            )}
            {accountNumber && (
              <div>
                <span>A/C No: </span>
                <strong className="text-slate-800">{accountNumber}</strong>
              </div>
            )}
            {ifscCode && (
              <div>
                <span>IFSC Code: </span>
                <strong className="text-slate-800">{ifscCode}</strong>
              </div>
            )}
            {branch && (
              <div>
                <span>Branch: </span>
                <strong className="text-slate-800">{branch}</strong>
              </div>
            )}
            {upiId && (
              <div>
                <span>UPI ID: </span>
                <strong className="text-indigo-600">{upiId}</strong>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">Payment details not configured</p>
      )}
    </div>
  );
}
