'use client';

import * as React from 'react';
import { resolveInvoiceAddressDisplay } from '@/lib/formatters';

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
  sameAsBillingAddress?: boolean;
}

export function DocumentCustomerSection({
  customerName,
  customerEmail,
  customerPhone,
  customerGstin,
  billingAddress,
  shippingAddress,
  sameAsBillingAddress,
}: DocumentCustomerSectionProps) {
  const resolved = resolveInvoiceAddressDisplay({
    sameAsBillingAddress,
    billingAddress,
    shippingAddress,
  });

  const displayShipping = resolved.showShippingBlock && resolved.shippingAddress;

  return (
    <div className={`grid grid-cols-1 ${displayShipping ? 'md:grid-cols-2' : ''} gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs`}>
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

        {resolved.billingAddress && (
          <div className="mt-2 text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-700">Billing Address:</span>
            <br />
            {resolved.billingAddress.street && <>{resolved.billingAddress.street}<br /></>}
            {resolved.billingAddress.city}{resolved.billingAddress.city && ','} {resolved.billingAddress.state} {resolved.billingAddress.postalCode}
            {resolved.billingAddress.country && <><br />{resolved.billingAddress.country}</>}
          </div>
        )}
      </div>

      {displayShipping && resolved.shippingAddress && (
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Shipping Address:
          </span>
          <p className="text-slate-600 leading-relaxed">
            <strong className="font-semibold text-slate-700 block">{customerName}</strong>
            {resolved.shippingAddress.street && <>{resolved.shippingAddress.street}<br /></>}
            {resolved.shippingAddress.city}{resolved.shippingAddress.city && ','} {resolved.shippingAddress.state} {resolved.shippingAddress.postalCode}
            {resolved.shippingAddress.country && <><br />{resolved.shippingAddress.country}</>}
          </p>
        </div>
      )}
    </div>
  );
}
