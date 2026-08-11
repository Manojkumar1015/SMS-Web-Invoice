'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoiceService, customerService } from '@/services';
import { Invoice } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DocumentHeader } from '@/components/domain/document/document-header';
import { DocumentCustomerSection } from '@/components/domain/document/document-customer-section';
import { DocumentItemsTable } from '@/components/domain/document/document-items-table';
import { DocumentTotals } from '@/components/domain/document/document-totals';
import { RecordPaymentDialog } from '@/components/domain/invoice/record-payment-dialog';
import { Printer, CreditCard, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const inv = await invoiceService.getInvoiceById(invoiceId);
      if (!inv) return;
      setInvoice(inv);
      const c = await customerService.getCustomerById(inv.customerId);
      setCustomer(c);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading invoice document...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-sm font-semibold">Invoice document not found</h3>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/invoices')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Billed to ${invoice.customerName}`}
        breadcrumbs={[
          { label: 'Invoices', href: '/app/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: 'Invoice Emailed', description: `Sent copy to ${invoice.customerEmail}`, variant: 'info' })}
            >
              <Mail className="h-4 w-4 mr-1" /> Email Invoice
            </Button>
            {invoice.amountDue > 0 ? (
              <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1" /> Record Payment
              </Button>
            ) : (
              <Button size="sm" variant="secondary" className="text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Fully Paid
              </Button>
            )}
          </div>
        }
      />

      <Card className="max-w-4xl mx-auto border-border shadow-md">
        <CardContent className="p-8 sm:p-12 space-y-6 bg-white text-slate-900">
          <DocumentHeader
            type="Invoice"
            documentNumber={invoice.invoiceNumber}
            date={invoice.date}
            dueDateOrExpiry={invoice.dueDate}
            status={invoice.status}
          />

          <DocumentCustomerSection
            customerName={invoice.customerName}
            customerEmail={invoice.customerEmail}
            customerGstin={invoice.customerGstin || customer?.gstin}
            customerAddress={customer?.billingAddress}
          />

          <DocumentItemsTable items={invoice.items} />

          <DocumentTotals
            subtotal={invoice.subtotal}
            discountTotal={invoice.discountTotal}
            taxTotal={invoice.taxTotal}
            total={invoice.total}
            amountPaid={invoice.amountPaid}
            amountDue={invoice.amountDue}
          />

          {invoice.notes && (
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">Notes & Terms:</span>
              <p>{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      {invoice && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={invoice}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
