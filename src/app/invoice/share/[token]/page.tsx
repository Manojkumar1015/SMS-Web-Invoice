import * as React from 'react';
import { notFound } from 'next/navigation';
import { verifyShareToken } from '@/lib/share-token';
import { createClient } from '@/lib/supabase/server';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const revalidate = 0;

async function getSharedInvoice(token: string): Promise<Invoice | null> {
  const invoiceId = verifyShareToken(token);
  if (!invoiceId) return null;

  const supabase = createClient();
  const { data: row, error } = await (supabase.from('invoices' as any) as any)
    .select('*, customer:customers(*), items:invoice_items(*)')
    .eq('id', invoiceId)
    .single();

  if (error || !row) return null;

  const customer = row.customer ? {
    id: row.customer.id,
    displayName: row.customer.display_name,
    companyName: row.customer.company_name,
    email: row.customer.email,
    phone: row.customer.phone,
    gstin: row.customer.gstin,
    billingAddress: row.customer.billing_address,
    shippingAddress: row.customer.shipping_address,
    sameAsBillingAddress: row.customer.same_as_billing_address,
  } : undefined;

  const items = (row.items || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unit_price) || 0,
    discount: Number(item.discount) || 0,
    taxRate: Number(item.tax_rate) || 0,
    taxAmount: Number(item.tax_amount) || 0,
    total: Number(item.line_total) || 0,
  }));

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: customer?.displayName || customer?.companyName || 'Valued Customer',
    customerEmail: customer?.email || '',
    customerPhone: customer?.phone || undefined,
    customerGstin: customer?.gstin || undefined,
    billingAddress: row.billing_address || customer?.billingAddress || undefined,
    shippingAddress: row.shipping_address || customer?.shippingAddress || undefined,
    sameAsBillingAddress: row.same_as_billing_address ?? customer?.sameAsBillingAddress ?? (row.shipping_address ? false : true),
    quoteId: row.quote_id || undefined,
    date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : '',
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
    status: row.status,
    subtotal: Number(row.subtotal) || 0,
    discountTotal: Number(row.discount) || 0,
    taxTotal: Number(row.tax) || 0,
    total: Number(row.total) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    amountDue: Number(row.balance_due) || 0,
    notes: row.notes || undefined,
    terms: row.terms || undefined,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function PublicInvoiceSharePage({ params }: { params: { token: string } }) {
  const invoice = await getSharedInvoice(params.token);

  if (!invoice) {
    notFound();
  }

  const defaultTemplateConfig = {
    layout: 'classic',
    primaryColor: '#059669',
    secondaryColor: '#475569',
    fontFamily: 'Inter',
    fontSize: 'normal',
    headerStyle: 'standard',
    footerText: 'Thank you for your business!',
    showLogo: true,
    showBankDetails: true,
    showSignature: true,
    showQrCode: false,
    showTerms: true,
    showNotes: true,
    customerSectionStyle: 'boxed',
    tableHeaderBg: '#F1F5F9',
    tableAlternatingRowBg: false,
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-slate-500">
              Billed to {invoice.customerName}
            </p>
          </div>
          <a
            href={`/api/v1/invoices/public/${params.token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </a>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200">
          <DocumentRenderer
            documentType="Invoice"
            documentData={invoice}
            templateConfig={defaultTemplateConfig as any}
          />
        </div>
      </div>
    </div>
  );
}
