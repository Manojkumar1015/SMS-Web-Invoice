'use client';

import * as React from 'react';
import { Invoice } from '@/types/invoice';
import { Quote } from '@/types/quote';
import { TemplateConfiguration } from '@/types/template';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { InvoiceStatusBadge } from '@/components/domain/invoice/invoice-status-badge';
import { QuoteStatusBadge } from '@/components/domain/quote/quote-status-badge';
import { resolveInvoiceAddressDisplay } from '@/lib/formatters';

interface DocumentRendererProps {
  documentType: 'Invoice' | 'Quote';
  documentData: Invoice | Quote;
  templateConfig: TemplateConfiguration;
  sampleMode?: boolean;
  className?: string;
}

export function DocumentRenderer({
  documentType,
  documentData,
  templateConfig,
}: DocumentRendererProps) {
  const isInvoice = documentType === 'Invoice';
  const invData = isInvoice ? (documentData as Invoice) : null;
  const quoData = !isInvoice ? (documentData as Quote) : null;

  const docNumber = isInvoice ? invData!.invoiceNumber : quoData!.quoteNumber;
  const date = documentData.date;
  const dueDateOrExpiry = isInvoice ? invData!.dueDate : quoData!.expiryDate;
  const status = documentData.status;

  const cfg = templateConfig;
  const primaryColor = cfg.colors?.primary || '#159447';
  const tableHeaderBg = cfg.colors?.tableHeaderBg || '#E8F5EE';
  const secondaryColor = cfg.colors?.secondary || '#0E6831';
  const borderColor = cfg.colors?.border || '#e2e8f0';

  const branding = cfg.branding || {};
  const payment = cfg.payment || {};

  const resolvedAddress = resolveInvoiceAddressDisplay({
    sameAsBillingAddress: isInvoice ? invData?.sameAsBillingAddress : undefined,
    billingAddress: documentData.billingAddress,
    shippingAddress: documentData.shippingAddress,
  });

  const billingAddr = resolvedAddress.billingAddress;
  const shippingAddr = resolvedAddress.shippingAddress;
  const showShipping = resolvedAddress.showShippingBlock && shippingAddr;

  const hasBankDetails = Boolean(
    payment.bankName || payment.accountNumber || payment.ifscCode || payment.upiId || payment.accountName
  );

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* 1. TOP HEADER (Zoho Style: Logo Left, Company Details Right) */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Business Logo */}
        <div className="flex items-center space-x-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-full border border-slate-100 p-1" />
          ) : (
            <div
              className="h-16 w-16 rounded-full text-white font-black text-2xl flex items-center justify-center shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {(branding.companyName || 'SMS')[0]}
            </div>
          )}
        </div>

        {/* Business Name & Address */}
        <div className="text-left sm:text-right space-y-0.5 text-xs text-slate-600">
          <h1 className="text-base font-extrabold text-slate-900">{branding.companyName || 'SMS Billing'}</h1>
          {branding.companyGstin && <p className="font-mono text-[11px]">GSTIN: <strong>{branding.companyGstin}</strong></p>}
          {branding.companyAddress && <p className="whitespace-pre-line leading-relaxed">{branding.companyAddress}</p>}
          {branding.companyPhone && <p>Phone: {branding.companyPhone}</p>}
          {branding.companyEmail && <p>Email: {branding.companyEmail}</p>}
        </div>
      </div>

      {/* 2. CENTERED INVOICE TITLE WITH HORIZONTAL ACCENT DIVIDERS */}
      <div className="flex items-center space-x-4 py-2">
        <div className="flex-1 h-[1px] bg-slate-200" />
        <span className="text-xl font-extrabold tracking-widest text-slate-800 uppercase px-2">
          {documentType === 'Invoice' ? 'INVOICE' : 'QUOTATION'}
        </span>
        <div className="flex-1 h-[1px] bg-slate-200" />
      </div>

      {/* 3. BILL TO / SHIP TO & INVOICE NUMBER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
        {/* Left: Bill To & Ship To */}
        <div className="space-y-4 flex-1">
          {/* Bill To */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill To</span>
            <div className="font-extrabold text-slate-900 text-sm">{documentData.customerName}</div>
            {documentData.customerEmail && <div className="text-slate-500">{documentData.customerEmail}</div>}
            {documentData.customerPhone && <div className="text-slate-500">{documentData.customerPhone}</div>}
            {documentData.customerGstin && <div className="font-mono text-emerald-700 font-bold mt-0.5">GSTIN: {documentData.customerGstin}</div>}

            {billingAddr && (
              <div className="text-slate-600 mt-1 leading-relaxed">
                {billingAddr.street && <div>{billingAddr.street}</div>}
                <div>
                  {[billingAddr.city, billingAddr.state, billingAddr.postalCode].filter(Boolean).join(', ')}
                </div>
                {billingAddr.country && <div>{billingAddr.country}</div>}
              </div>
            )}
          </div>

          {/* Ship To (if separate) */}
          {showShipping && shippingAddr && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ship To</span>
              <div className="font-bold text-slate-800">{documentData.customerName}</div>
              <div className="text-slate-600 mt-0.5 leading-relaxed">
                {shippingAddr.street && <div>{shippingAddr.street}</div>}
                <div>
                  {[shippingAddr.city, shippingAddr.state, shippingAddr.postalCode].filter(Boolean).join(', ')}
                </div>
                {shippingAddr.country && <div>{shippingAddr.country}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Invoice # & Status */}
        <div className="text-left sm:text-right space-y-2">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {documentType === 'Invoice' ? 'Invoice#' : 'Quote#'}
            </span>
            <div className="text-xl font-black tracking-tight text-slate-900 font-mono mt-0.5">
              {docNumber}
            </div>
          </div>
          <div>
            {isInvoice ? <InvoiceStatusBadge status={status} /> : <QuoteStatusBadge status={status} />}
          </div>
        </div>
      </div>

      {/* 4. 3-COLUMN INVOICE INFORMATION TABLE (Zoho Style) */}
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <div className="grid grid-cols-3 text-white text-xs font-bold px-4 py-2.5" style={{ backgroundColor: primaryColor }}>
          <div>{documentType === 'Invoice' ? 'Invoice Date' : 'Quote Date'}</div>
          <div>Terms</div>
          <div>{documentType === 'Invoice' ? 'Due Date' : 'Expiry Date'}</div>
        </div>
        <div className="grid grid-cols-3 text-xs font-mono text-slate-800 px-4 py-2.5 bg-slate-50 border-t border-slate-200">
          <div><DateDisplay date={date} /></div>
          <div>{invData?.paymentTerms || 'Due on Receipt'}</div>
          <div><DateDisplay date={dueDateOrExpiry} /></div>
        </div>
      </div>

      {/* 5. LINE ITEM TABLE */}
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-white font-bold" style={{ backgroundColor: primaryColor }}>
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-3">Item & Description</th>
              <th className="py-2.5 px-3 text-right w-20">Qty</th>
              <th className="py-2.5 px-3 text-right w-28">Rate</th>
              <th className="py-2.5 px-3 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(documentData.items || []).map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                  {item.description && <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {item.quantity} {item.unit ? <span className="text-[10px] text-slate-400 font-sans">{item.unit}</span> : ''}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  <CurrencyDisplay amount={item.rate || item.unitPrice || 0} />
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  <CurrencyDisplay amount={item.amount || (item as any).total || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. TOTALS & PAYMENT DETAILS AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
        {/* Left: Payment & Banking Details Box */}
        <div className="flex-1 w-full">
          {hasBankDetails ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: secondaryColor }}>
                Payment & Banking Details:
              </span>
              {payment.bankName && <div className="font-bold text-slate-900">{payment.bankName}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-700">
                {payment.accountName && <div>A/C Name: <strong>{payment.accountName}</strong></div>}
                {payment.accountNumber && <div>A/C No: <strong>{payment.accountNumber}</strong></div>}
                {payment.ifscCode && <div>IFSC Code: <strong>{payment.ifscCode}</strong></div>}
                {payment.branchName && <div>Branch: <strong>{payment.branchName}</strong></div>}
                {payment.upiId && <div className="col-span-2 text-indigo-700 font-bold">UPI ID: {payment.upiId}</div>}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
              Payment details not configured
            </div>
          )}
        </div>

        {/* Right: Summary & Balance Due Box */}
        <div className="w-full sm:w-80 rounded-xl overflow-hidden border border-slate-200 text-xs p-4 space-y-2.5" style={{ backgroundColor: tableHeaderBg }}>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Sub Total</span>
            <span className="font-mono text-slate-800"><CurrencyDisplay amount={documentData.subtotal} /></span>
          </div>

          {documentData.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discount</span>
              <span className="font-mono">-[<CurrencyDisplay amount={documentData.discountTotal} />]</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600 font-medium">
            <span>Tax Rate (GST)</span>
            <span className="font-mono text-slate-800"><CurrencyDisplay amount={documentData.taxTotal} /></span>
          </div>

          <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-300 pt-2">
            <span>Total</span>
            <span className="font-mono" style={{ color: primaryColor }}><CurrencyDisplay amount={documentData.total} /></span>
          </div>

          {isInvoice && invData && (
            <>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Amount Paid</span>
                <span className="font-mono text-slate-800"><CurrencyDisplay amount={invData.amountPaid} /></span>
              </div>

              <div className="flex justify-between items-center font-black text-sm p-2.5 rounded-lg text-white mt-2" style={{ backgroundColor: primaryColor }}>
                <span>Balance Due</span>
                <span className="font-mono"><CurrencyDisplay amount={invData.amountDue} /></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 7. CUSTOMER NOTES & TERMS */}
      <div className="space-y-4 pt-4 border-t border-slate-200 text-xs">
        {documentData.notes && (
          <div>
            <span className="font-bold text-slate-700 block mb-1">Customer Notes:</span>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
              {documentData.notes}
            </p>
          </div>
        )}

        {documentData.terms && (
          <div>
            <span className="font-bold text-slate-700 block mb-1">Terms & Conditions:</span>
            <p className="text-slate-500 leading-relaxed whitespace-pre-line text-[11px]">
              {documentData.terms}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
        {branding.companyName || 'SMS Billing'} • Official Document
      </div>
    </div>
  );
}
