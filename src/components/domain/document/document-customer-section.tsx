'use client';

import * as React from 'react';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface DocumentCustomerSectionProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerGstin?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export function DocumentCustomerSection({
  customerName,
  customerEmail,
  customerPhone,
  customerGstin,
  billingAddress,
  shippingAddress,
}: DocumentCustomerSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Billed To:
        </span>
        <h4 className="font-bold text-sm text-slate-900">{customerName}</h4>
        <p className="text-slate-600 mt-0.5">{customerEmail}</p>
        {customerPhone && <p className="text-slate-600">{customerPhone}</p>}
        {customerGstin && (
          <p className="font-mono text-indigo-700 mt-1 font-semibold">GSTIN: {customerGstin}</p>
        )}

        {billingAddress && (
          <div className="mt-2 text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-700">Billing Address:</span>
            <br />
            {billingAddress.street && <>{billingAddress.street}<br /></>}
            {billingAddress.city}{billingAddress.city && ','} {billingAddress.state} {billingAddress.postalCode}
            {billingAddress.country && <><br />{billingAddress.country}</>}
          </div>
        )}
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Shipping Address:
        </span>
        {shippingAddress ? (
          <p className="text-slate-600 leading-relaxed">
            <strong className="font-semibold text-slate-700 block">{customerName}</strong>
            {shippingAddress.street && <>{shippingAddress.street}<br /></>}
            {shippingAddress.city}{shippingAddress.city && ','} {shippingAddress.state} {shippingAddress.postalCode}
            {shippingAddress.country && <><br />{shippingAddress.country}</>}
          </p>
        ) : billingAddress ? (
          <p className="text-slate-500 italic leading-relaxed">
            Same as billing address
          </p>
        ) : (
          <p className="text-slate-400 italic">No address provided</p>
        )}
      </div>
    </div>
  );
}
