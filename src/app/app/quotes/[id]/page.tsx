'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quoteService, customerService } from '@/services';
import { Quote } from '@/types/quote';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DocumentHeader } from '@/components/domain/document/document-header';
import { DocumentCustomerSection } from '@/components/domain/document/document-customer-section';
import { DocumentItemsTable } from '@/components/domain/document/document-items-table';
import { DocumentTotals } from '@/components/domain/document/document-totals';
import { Printer, ArrowRight, ArrowLeft, Mail, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quoteId = params.id as string;

  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const q = await quoteService.getQuoteById(quoteId);
        if (!q) return;
        setQuote(q);
        const c = await customerService.getCustomerById(q.customerId);
        setCustomer(c);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [quoteId]);

  const handleConvertToInvoice = async () => {
    if (!quote) return;
    try {
      const invId = await quoteService.convertToInvoice(quote.id);
      toast({ title: 'Converted to Invoice', description: 'Quote accepted and invoice generated.', variant: 'success' });
      router.push(`/app/invoices/new?quoteId=${quote.id}&customerId=${quote.customerId}`);
    } catch {
      toast({ title: 'Error', description: 'Could not convert quote.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading quote document...</div>;
  }

  if (!quote) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-sm font-semibold">Quote document not found</h3>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/quotes')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Quotes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quote ${quote.quoteNumber}`}
        subtitle={`Issued for ${quote.customerName}`}
        breadcrumbs={[
          { label: 'Quotes', href: '/app/quotes' },
          { label: quote.quoteNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: 'Quote Emailed', description: `Sent copy to ${quote.customerEmail}`, variant: 'info' })}
            >
              <Mail className="h-4 w-4 mr-1" /> Email Quote
            </Button>
            <Button size="sm" onClick={handleConvertToInvoice}>
              <ArrowRight className="h-4 w-4 mr-1" /> Convert to Invoice
            </Button>
          </div>
        }
      />

      {/* Document View Sheet */}
      <Card className="max-w-4xl mx-auto border-border shadow-md">
        <CardContent className="p-8 sm:p-12 space-y-6 bg-white text-slate-900">
          <DocumentHeader
            type="Quote"
            documentNumber={quote.quoteNumber}
            date={quote.date}
            dueDateOrExpiry={quote.expiryDate}
            status={quote.status}
          />

          <DocumentCustomerSection
            customerName={quote.customerName}
            customerEmail={quote.customerEmail}
            customerGstin={customer?.gstin}
            customerAddress={customer?.billingAddress}
          />

          <DocumentItemsTable items={quote.items} />

          <DocumentTotals
            subtotal={quote.subtotal}
            discountTotal={quote.discountTotal}
            taxTotal={quote.taxTotal}
            total={quote.total}
          />

          {quote.notes && (
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">Notes & Terms:</span>
              <p>{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
