import { NextRequest, NextResponse } from 'next/server';
import { verifyShareToken } from '@/lib/share-token';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, resolveInvoiceAddressDisplay } from '@/lib/formatters';

export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const invoiceId = verifyShareToken(params.token);
    if (!invoiceId) {
      return new NextResponse('Invalid or expired invoice token', { status: 404 });
    }

    const supabase = createClient();
    const { data: invoice, error } = await (supabase.from('invoices' as any) as any)
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const customer = invoice.customer || {};
    const items = invoice.items || [];
    const customerName = customer.display_name || customer.company_name || 'Valued Customer';

    const resolvedAddress = resolveInvoiceAddressDisplay({
      sameAsBillingAddress: invoice.same_as_billing_address ?? customer.same_as_billing_address,
      billingAddress: invoice.billing_address || customer.billing_address,
      shippingAddress: invoice.shipping_address || customer.shipping_address,
    });
    const billingAddr = resolvedAddress.billingAddress;
    const shippingAddr = resolvedAddress.shippingAddress;
    const showShipping = resolvedAddress.showShippingBlock && shippingAddr;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 30px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #059669; }
    .billing-grid { display: grid; grid-template-columns: ${showShipping ? '1fr 1fr' : '1fr'}; gap: 20px; margin-bottom: 20px; background: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; }
    .billing-box strong { font-size: 10px; color: #059669; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #F1F5F9; text-transform: uppercase; font-size: 10px; padding: 8px; border-bottom: 2px solid #CBD5E1; text-align: left; }
    td { padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: left; }
    .totals { width: 250px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #059669; border-bottom: 2px solid #059669; padding: 8px 0; color: #059669; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">INVOICE</div>
      <div style="color: #64748b; margin-top: 4px;"># ${invoice.invoice_number}</div>
    </div>
    <div style="text-align: right;">
      <div>Date: <strong>${invoice.invoice_date ? invoice.invoice_date.split('T')[0] : ''}</strong></div>
      <div>Due Date: <strong>${invoice.due_date ? invoice.due_date.split('T')[0] : ''}</strong></div>
      <div style="margin-top: 4px; font-weight: bold; color: #059669;">Status: ${String(invoice.status).toUpperCase()}</div>
    </div>
  </div>

  <div class="billing-grid">
    <div class="billing-box">
      <strong>Billed To:</strong>
      <div style="font-weight: bold; font-size: 13px;">${customerName}</div>
      ${customer.email ? `<div style="color: #64748b;">${customer.email}</div>` : ''}
      ${customer.phone ? `<div style="color: #64748b;">${customer.phone}</div>` : ''}
      ${customer.gstin ? `<div style="font-weight: bold; color: #059669; margin-top: 4px;">GSTIN: ${customer.gstin}</div>` : ''}
      ${billingAddr ? `
        <div style="margin-top: 4px; color: #475569;">
          ${billingAddr.street ? billingAddr.street + '<br>' : ''}
          ${billingAddr.city || ''} ${billingAddr.state || ''} ${billingAddr.postalCode || ''}
          ${billingAddr.country ? '<br>' + billingAddr.country : ''}
        </div>
      ` : ''}
    </div>

    ${showShipping && shippingAddr ? `
    <div class="billing-box">
      <strong>Shipping Address:</strong>
      <div style="font-weight: bold; font-size: 13px;">${customerName}</div>
      <div style="margin-top: 4px; color: #475569;">
        ${shippingAddr.street ? shippingAddr.street + '<br>' : ''}
        ${shippingAddr.city || ''} ${shippingAddr.state || ''} ${shippingAddr.postalCode || ''}
        ${shippingAddr.country ? '<br>' + shippingAddr.country : ''}
      </div>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Item & Description</th>
        <th style="text-align: right; width: 60px;">Qty</th>
        <th style="text-align: right; width: 90px;">Rate</th>
        <th style="text-align: right; width: 90px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${item.description}</strong></td>
          <td style="text-align: right;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(Number(item.unit_price) || 0)}</td>
          <td style="text-align: right;">${formatCurrency(Number(item.line_total) || 0)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal:</span> <span>${formatCurrency(Number(invoice.subtotal) || 0)}</span></div>
    ${Number(invoice.discount) > 0 ? `<div><span>Discount:</span> <span>-${formatCurrency(Number(invoice.discount))}</span></div>` : ''}
    ${Number(invoice.tax) > 0 ? `<div><span>Tax (GST):</span> <span>${formatCurrency(Number(invoice.tax))}</span></div>` : ''}
    <div class="grand-total"><span>Total Amount:</span> <span>${formatCurrency(Number(invoice.total) || 0)}</span></div>
    <div><span>Amount Paid:</span> <span>${formatCurrency(Number(invoice.amount_paid) || 0)}</span></div>
    <div style="font-weight: bold; color: #DC2626;"><span>Balance Due:</span> <span>${formatCurrency(Number(invoice.balance_due) || 0)}</span></div>
  </div>
</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
