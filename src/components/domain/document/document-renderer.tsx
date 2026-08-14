'use client';

import * as React from 'react';
import { Invoice } from '@/types/invoice';
import { Quote, DocumentItem } from '@/types/quote';
import { TemplateConfiguration } from '@/types/template';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DateDisplay } from '@/components/ui/date-display';
import { DocumentNumber } from '@/components/ui/document-number';
import { QuoteStatusBadge } from '@/components/domain/quote/quote-status-badge';
import { InvoiceStatusBadge } from '@/components/domain/invoice/invoice-status-badge';
import { cn } from '@/lib/utils';

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
  sampleMode = false,
  className,
}: DocumentRendererProps) {
  const isInvoice = documentType === 'Invoice';
  const invData = isInvoice ? (documentData as Invoice) : null;
  const quoData = !isInvoice ? (documentData as Quote) : null;

  const docNumber = isInvoice ? invData!.invoiceNumber : quoData!.quoteNumber;
  const date = documentData.date;
  const dueDateOrExpiry = isInvoice ? invData!.dueDate : quoData!.expiryDate;
  const status = documentData.status;

  const cfg = templateConfig;
  const colors = cfg.colors;
  const font = cfg.typography;
  const branding = cfg.branding;
  const header = cfg.header;
  const customer = cfg.customer;
  const details = cfg.invoiceDetails;
  const itemsCfg = cfg.itemsTable;
  const totals = cfg.totals;
  const payment = cfg.payment;
  const notes = cfg.notes;
  const terms = cfg.terms;
  const signature = cfg.signature;
  const footer = cfg.footer;
  const watermark = cfg.watermark;

  // Font family helper
  const fontStyle = {
    fontFamily:
      font.fontFamily === 'Playfair Display'
        ? '"Playfair Display", Georgia, serif'
        : font.fontFamily === 'Lora'
        ? '"Lora", Georgia, serif'
        : font.fontFamily === 'Courier Prime'
        ? '"Courier Prime", monospace'
        : font.fontFamily === 'Outfit'
        ? '"Outfit", sans-serif'
        : font.fontFamily === 'Roboto'
        ? '"Roboto", sans-serif'
        : font.fontFamily === 'Plus Jakarta Sans'
        ? '"Plus Jakarta Sans", sans-serif'
        : '"Inter", sans-serif',
  };

  // Active section ordering
  const activeSections = [...(cfg.sections || [])].sort((a, b) => a.order - b.order);

  // Render individual sections dynamically
  const renderHeader = () => {
    const isBanner = header.style === 'banner' || header.showBannerBg;

    return (
      <div
        className={cn(
          'relative pb-6 mb-6 border-b transition-colors',
          isBanner && 'p-6 rounded-xl text-white mb-6',
          header.style === 'centered' && 'text-center'
        )}
        style={{
          borderColor: colors.border,
          backgroundColor: isBanner ? colors.primary : undefined,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo & Company Details */}
          <div className={cn('flex items-center space-x-3', header.style === 'centered' && 'justify-center w-full')}>
            {branding.logoVisible && (
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl font-black shadow-xs shrink-0',
                  branding.logoSize === 'small' ? 'h-10 w-10 text-base' : branding.logoSize === 'large' ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-xl',
                  isBanner ? 'bg-white text-slate-900' : 'text-white'
                )}
                style={{ backgroundColor: isBanner ? '#ffffff' : colors.primary, color: isBanner ? colors.primary : '#ffffff' }}
              >
                {branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logoUrl} alt="Logo" className="h-full w-full object-contain p-1 rounded-xl" />
                ) : (
                  'SMS'
                )}
              </div>
            )}

            <div>
              {branding.showCompanyName && (
                <h2 className={cn('font-bold', isBanner ? 'text-white text-lg' : 'text-slate-900 text-base')} style={{ fontSize: `${font.headingSize}px` }}>
                  {branding.companyName || documentData.customerName}
                </h2>
              )}
              {branding.showCompanyDetails && (
                <div className={cn('text-xs mt-0.5 space-y-0.5', isBanner ? 'text-slate-200' : 'text-slate-500')}>
                  {branding.companyGstin && <p>GSTIN: {branding.companyGstin} {branding.companyPan ? `• PAN: ${branding.companyPan}` : ''}</p>}
                  {branding.companyAddress && <p>{branding.companyAddress}</p>}
                  {branding.companyEmail && <p>{branding.companyEmail} {branding.companyPhone ? `• ${branding.companyPhone}` : ''}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Document Title, Number & Dates */}
          <div className={cn('text-left sm:text-right', header.style === 'centered' && 'text-center mt-3')}>
            <div className="flex items-center sm:justify-end space-x-2">
              <span className={cn('text-2xl font-black uppercase tracking-tight', isBanner ? 'text-white' : 'text-slate-900')} style={{ color: isBanner ? '#ffffff' : colors.primary }}>
                {documentType}
              </span>
              {isInvoice ? <InvoiceStatusBadge status={status} /> : <QuoteStatusBadge status={status} />}
            </div>

            {details.showInvoiceNumber && (
              <div className="mt-1.5">
                <DocumentNumber number={docNumber} type={documentType} />
              </div>
            )}

            <div className={cn('mt-2 text-xs flex flex-wrap sm:justify-end gap-x-4 gap-y-1', isBanner ? 'text-slate-200' : 'text-slate-600')}>
              {details.showDate && (
                <span>
                  <strong>Date:</strong> <DateDisplay date={date} className={isBanner ? 'text-white' : 'text-slate-900'} />
                </span>
              )}
              {details.showDueDate && (
                <span>
                  <strong>{isInvoice ? 'Due Date:' : 'Valid Until:'}</strong>{' '}
                  <DateDisplay date={dueDateOrExpiry} className={isBanner ? 'text-white' : 'text-slate-900'} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomer = () => {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border mb-6 text-xs"
        style={{ backgroundColor: `${colors.tableHeaderBg}40`, borderColor: colors.border }}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.secondary }}>
            Billed To:
          </span>
          {customer.showName && <h4 className="font-bold text-sm text-slate-900">{documentData.customerName}</h4>}
          {customer.showEmail && <p className="text-slate-600 mt-0.5">{documentData.customerEmail}</p>}
          {customer.showPhone && documentData.customerPhone && <p className="text-slate-600">{documentData.customerPhone}</p>}
          {customer.showGstin && documentData.customerGstin && (
            <p className="font-mono mt-1 font-semibold" style={{ color: colors.primary }}>
              GSTIN: {documentData.customerGstin}
            </p>
          )}

          {customer.showBillingAddress && documentData.billingAddress && (
            <div className="mt-2 text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Billing Address:</span>
              <br />
              {documentData.billingAddress.street && <>{documentData.billingAddress.street}<br /></>}
              {documentData.billingAddress.city}{documentData.billingAddress.city && ','} {documentData.billingAddress.state} {documentData.billingAddress.postalCode}
              {documentData.billingAddress.country && <><br />{documentData.billingAddress.country}</>}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.secondary }}>
            Shipping Address:
          </span>
          {customer.showShippingAddress && documentData.shippingAddress ? (
            <p className="text-slate-600 leading-relaxed">
              <strong className="font-semibold text-slate-700 block">{documentData.customerName}</strong>
              {documentData.shippingAddress.street && <>{documentData.shippingAddress.street}<br /></>}
              {documentData.shippingAddress.city}{documentData.shippingAddress.city && ','} {documentData.shippingAddress.state} {documentData.shippingAddress.postalCode}
              {documentData.shippingAddress.country && <><br />{documentData.shippingAddress.country}</>}
            </p>
          ) : (
            <p className="text-slate-500 italic leading-relaxed">Same as billing address</p>
          )}
        </div>
      </div>
    );
  };

  const renderItemsTable = () => {
    const visibleCols = (itemsCfg.columns || []).filter((c) => c.visible);

    return (
      <div className="overflow-x-auto rounded-xl border mb-6" style={{ borderColor: colors.border }}>
        <table className="w-full text-left text-xs">
          <thead
            className="uppercase text-[10px] font-bold tracking-wider border-b"
            style={{
              backgroundColor: itemsCfg.headerBg ? colors.tableHeaderBg : 'transparent',
              color: colors.tableHeaderText || colors.primary,
              borderColor: colors.border,
            }}
          >
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: colors.border }}>
            {documentData.items.map((item: DocumentItem, idx: number) => (
              <tr
                key={item.id || idx}
                className={cn(itemsCfg.stripedRows && idx % 2 === 1 && 'bg-slate-50/60')}
              >
                {visibleCols.map((col) => {
                  if (col.key === 'index') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                    );
                  }
                  if (col.key === 'item') {
                    const code = item.classificationCode || item.hsn;
                    const type = item.classificationType || (code ? 'HSN/SAC' : undefined);
                    return (
                      <td key={col.key} className="px-3 py-2.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{item.name}</span>
                          {code && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {type && type !== 'HSN/SAC' ? `${type}: ${code}` : `${code}`}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</div>
                        )}
                      </td>
                    );
                  }
                  if (col.key === 'hsn') {
                    const code = item.classificationCode || item.hsn;
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center font-mono text-slate-600">
                        {code || '—'}
                      </td>
                    );
                  }
                  if (col.key === 'quantity') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-right font-medium text-slate-800 whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </td>
                    );
                  }
                  if (col.key === 'rate') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                        <CurrencyDisplay amount={item.rate} />
                      </td>
                    );
                  }
                  if (col.key === 'discount') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-right text-emerald-600 font-mono whitespace-nowrap">
                        {item.discount > 0 ? `- ₹${item.discount.toLocaleString('en-IN')}` : '-'}
                      </td>
                    );
                  }
                  if (col.key === 'tax') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-right text-slate-500 font-mono whitespace-nowrap">
                        {item.taxRate}%
                      </td>
                    );
                  }
                  if (col.key === 'amount') {
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-right font-extrabold text-slate-900 font-mono whitespace-nowrap">
                        <CurrencyDisplay amount={item.amount} />
                      </td>
                    );
                  }
                  return <td key={col.key} className="px-3 py-2.5"></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTotals = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between gap-6 border-t pt-6 text-xs mb-6" style={{ borderColor: colors.border }}>
        <div className="flex-1">
          {cfg.taxes.showTaxSummary && cfg.taxes.breakdownGst && (
            <div className="p-3 rounded-xl border text-xs space-y-1" style={{ backgroundColor: `${colors.tableHeaderBg}30`, borderColor: colors.border }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: colors.secondary }}>
                GST Tax Breakdown:
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block">CGST (9%):</span>
                  <span className="font-semibold text-slate-800">
                    <CurrencyDisplay amount={documentData.taxTotal / 2} />
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">SGST (9%):</span>
                  <span className="font-semibold text-slate-800">
                    <CurrencyDisplay amount={documentData.taxTotal / 2} />
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total GST:</span>
                  <span className="font-bold" style={{ color: colors.primary }}>
                    <CurrencyDisplay amount={documentData.taxTotal} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full sm:w-80 space-y-2.5 text-right font-mono">
          {totals.showSubtotal && (
            <div className="flex justify-between text-slate-600">
              <span className="font-sans text-slate-500">Subtotal:</span>
              <CurrencyDisplay amount={documentData.subtotal} className="font-semibold text-slate-800" />
            </div>
          )}

          {totals.showDiscount && documentData.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span className="font-sans text-emerald-700">Discount Total:</span>
              <span>- <CurrencyDisplay amount={documentData.discountTotal} /></span>
            </div>
          )}

          {totals.showTax && (
            <div className="flex justify-between text-slate-600">
              <span className="font-sans text-slate-500">Tax Total (GST):</span>
              <CurrencyDisplay amount={documentData.taxTotal} className="font-semibold text-slate-800" />
            </div>
          )}

          {totals.showRoundOff && isInvoice && invData?.roundOff !== 0 && invData?.roundOff !== undefined && (
            <div className="flex justify-between text-slate-500">
              <span className="font-sans text-slate-500">Round Off:</span>
              <CurrencyDisplay amount={invData.roundOff} />
            </div>
          )}

          {totals.showGrandTotal && (
            <div className="flex justify-between text-sm font-extrabold border-t pt-2.5 text-slate-900" style={{ borderColor: colors.border }}>
              <span className="font-sans">Grand Total:</span>
              <CurrencyDisplay amount={documentData.total} className="text-base font-black" style={{ color: colors.primary }} />
            </div>
          )}

          {isInvoice && invData?.amountPaid !== undefined && (
            <div className="flex justify-between text-emerald-600 font-bold pt-1">
              <span className="font-sans text-emerald-700">Amount Paid:</span>
              <CurrencyDisplay amount={invData.amountPaid} />
            </div>
          )}

          {isInvoice && invData?.amountDue !== undefined && (
            <div className="flex justify-between text-red-600 font-black text-sm border-t border-dashed pt-2 bg-red-50/50 p-2 rounded-lg" style={{ borderColor: colors.border }}>
              <span className="font-sans text-red-700">Balance Due:</span>
              <CurrencyDisplay amount={invData.amountDue} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    if (!payment.showBankDetails) return null;

    const hasBankDetails = Boolean(
      payment.bankName || payment.accountNumber || payment.ifscCode
    );

    return (
      <div className="p-4 rounded-xl border text-xs text-slate-600 space-y-2 mb-6" style={{ backgroundColor: `${colors.tableHeaderBg}30`, borderColor: colors.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: colors.secondary }}>
          Payment & Banking Details:
        </span>
        {hasBankDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              {payment.bankName && <p className="font-bold text-slate-900 text-sm">{payment.bankName}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-700">
                {payment.accountName && <div>A/C Name: <strong>{payment.accountName}</strong></div>}
                {payment.accountNumber && <div>A/C No: <strong>{payment.accountNumber}</strong></div>}
                {payment.ifscCode && <div>IFSC Code: <strong>{payment.ifscCode}</strong></div>}
                {payment.branchName && <div>Branch: <strong>{payment.branchName}</strong></div>}
              </div>
              {payment.instructions && <p className="text-[11px] text-slate-500 pt-1">{payment.instructions}</p>}
            </div>

            {payment.showUpiQr && payment.upiId && (
              <div className="flex flex-col items-center justify-center p-2 rounded-lg border bg-white border-slate-200 text-center">
                <div className="h-16 w-16 border-2 border-dashed border-indigo-300 rounded flex items-center justify-center bg-indigo-50/50 text-[9px] font-bold text-indigo-700">
                  UPI QR CODE
                </div>
                <span className="text-[10px] font-mono text-slate-600 mt-1">{payment.upiId}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Payment details not configured</p>
        )}
      </div>
    );
  };

  const renderNotes = () => {
    if (!notes.visible || (!documentData.notes && !notes.text)) return null;

    return (
      <div className="pt-4 border-t text-xs text-slate-600 mb-4" style={{ borderColor: colors.border }}>
        <span className="font-bold uppercase text-[10px] tracking-wider block mb-1" style={{ color: colors.secondary }}>
          {notes.heading || 'Customer Notes'}:
        </span>
        <p className="leading-relaxed whitespace-pre-line text-slate-700 p-3 rounded-lg border" style={{ backgroundColor: `${colors.tableHeaderBg}20`, borderColor: colors.border }}>
          {documentData.notes || notes.text}
        </p>
      </div>
    );
  };

  const renderTerms = () => {
    if (!terms.visible || (!documentData.terms && !terms.text)) return null;

    return (
      <div className="pt-4 border-t text-xs text-slate-600 mb-6" style={{ borderColor: colors.border }}>
        <span className="font-bold uppercase text-[10px] tracking-wider block mb-1" style={{ color: colors.secondary }}>
          {terms.heading || 'Terms & Conditions'}:
        </span>
        <p className="leading-relaxed whitespace-pre-line text-slate-600 italic">
          {documentData.terms || terms.text}
        </p>
      </div>
    );
  };

  const renderSignature = () => {
    if (!signature.visible) return null;

    return (
      <div className="flex justify-end pt-6 mb-6">
        <div className="text-center w-56 space-y-2">
          <div className="h-16 border-b flex items-center justify-center relative" style={{ borderColor: colors.border }}>
            {signature.showDigitalStamp && (
              <div className="absolute inset-0 flex items-center justify-center opacity-80">
                <span className="font-serif italic text-xs font-bold rotate-[-6deg] border-2 px-3 py-1 rounded" style={{ color: colors.primary, borderColor: colors.secondary }}>
                  {signature.label || 'Authorized Signatory'}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-slate-800">{signature.authorizedPerson || 'Authorized Signatory'}</p>
          <p className="text-[11px] text-slate-500">{signature.designation || branding.companyName}</p>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (!footer.visible) return null;

    return (
      <div className="pt-6 border-t text-center text-[11px] text-slate-400 space-y-1" style={{ borderColor: colors.border }}>
        <p>{footer.text}</p>
        {footer.showPageNumbers && <p className="font-mono text-[10px] text-slate-400">Page 1 of 1</p>}
      </div>
    );
  };

  // Section Component Mapper
  const sectionComponentMap: Record<string, () => React.ReactNode> = {
    header: renderHeader,
    customer: renderCustomer,
    items: renderItemsTable,
    totals: renderTotals,
    payment: renderPayment,
    notes: renderNotes,
    terms: renderTerms,
    signature: renderSignature,
    footer: renderFooter,
  };

  return (
    <div
      className={cn(
        'relative max-w-4xl mx-auto border shadow-xl bg-white text-slate-900 overflow-hidden transition-all p-8 sm:p-12',
        className
      )}
      style={{
        ...fontStyle,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {/* Top Gold Accent Stripe for White Gold / Elegant templates */}
      {(cfg.category === 'elegant' || cfg.id === 'tmpl-white-gold') && (
        <div
          className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-600"
          style={{ backgroundColor: colors.primary || '#B8860B' }}
        />
      )}

      {/* Watermark Overlay */}
      {watermark.enabled && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10">
          <span
            className="font-black text-6xl sm:text-8xl tracking-widest uppercase select-none"
            style={{
              color: watermark.color || colors.primary,
              opacity: watermark.opacity || 0.15,
              transform: `rotate(${watermark.rotation || -25}deg)`,
            }}
          >
            {watermark.text || 'PAID'}
          </span>
        </div>
      )}

      {/* Render ordered active sections */}
      {activeSections.map((sec) => {
        if (!sec.enabled) return null;
        const Component = sectionComponentMap[sec.id];
        return Component ? <React.Fragment key={sec.id}>{Component()}</React.Fragment> : null;
      })}
    </div>
  );
}
