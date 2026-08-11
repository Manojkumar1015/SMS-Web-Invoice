'use client';

import * as React from 'react';
import { DocumentHeader } from './document-header';
import { DocumentCustomerSection } from './document-customer-section';
import { DocumentItemsTable } from './document-items-table';
import { DocumentTotals } from './document-totals';
import { DocumentNotes } from './document-notes';
import { DocumentTerms } from './document-terms';
import { DocumentSignature } from './document-signature';
import { DocumentFooter } from './document-footer';
import { Quote } from '@/types/quote';
import { Invoice } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentPreviewProps {
  documentType: 'Quote' | 'Invoice';
  documentData: Quote | Invoice;
  templateStyle?: string;
  className?: string;
}

export function DocumentPreview({
  documentType,
  documentData,
  className,
}: DocumentPreviewProps) {
  const isInvoice = documentType === 'Invoice';
  const invoiceData = isInvoice ? (documentData as Invoice) : null;
  const quoteData = !isInvoice ? (documentData as Quote) : null;

  const docNumber = isInvoice ? invoiceData!.invoiceNumber : quoteData!.quoteNumber;
  const date = documentData.date;
  const dueDateOrExpiry = isInvoice ? invoiceData!.dueDate : quoteData!.expiryDate;
  const status = documentData.status;

  return (
    <Card className={`max-w-4xl mx-auto border-slate-200 shadow-xl bg-white text-slate-900 overflow-hidden ${className || ''}`}>
      <CardContent className="p-8 sm:p-12 space-y-6">
        <DocumentHeader
          type={documentType}
          documentNumber={docNumber}
          date={date}
          dueDateOrExpiry={dueDateOrExpiry}
          status={status}
        />

        <DocumentCustomerSection
          customerName={documentData.customerName}
          customerEmail={documentData.customerEmail}
          customerPhone={documentData.customerPhone}
          customerGstin={documentData.customerGstin}
          billingAddress={documentData.billingAddress}
          shippingAddress={documentData.shippingAddress}
        />

        <DocumentItemsTable items={documentData.items} />

        <DocumentTotals
          subtotal={documentData.subtotal}
          discountTotal={documentData.discountTotal}
          taxTotal={documentData.taxTotal}
          roundOff={isInvoice ? invoiceData?.roundOff : 0}
          total={documentData.total}
          amountPaid={isInvoice ? invoiceData?.amountPaid : undefined}
          amountDue={isInvoice ? invoiceData?.amountDue : undefined}
          showPaymentDetails={isInvoice}
        />

        <DocumentNotes notes={documentData.notes} />
        <DocumentTerms terms={documentData.terms} />
        <DocumentSignature />
        <DocumentFooter />
      </CardContent>
    </Card>
  );
}
