import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { InvoiceService } from '@/services/invoice/invoice.service';
import { TemplateService } from '@/services/template/template.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { errorResponse } from '@/lib/api/response';
import { formatCurrency, resolveInvoiceAddressDisplay } from '@/lib/formatters';
import { generateInvoicePdfBuffer } from '@/lib/pdf-generator';

const invoiceService = new InvoiceService();
const templateService = new TemplateService();
const orgService = new OrganizationService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const invoice = await invoiceService.getInvoiceById(context, params.id);
    let template = await templateService.getDefaultTemplate(context);
    if (!template && invoice.templateId) {
      template = await templateService.getTemplateById(context, invoice.templateId).catch(() => null);
    }

    const orgBiz = await orgService.getOrganization(context).catch(() => null);

    const cfg: any = template?.config || {};
    const colors = cfg.colors || { primary: '#059669', secondary: '#10B981', border: '#E2E8F0', tableHeaderBg: '#F8FAFC', tableHeaderText: '#334155', text: '#0F172A' };

    const companyName = orgBiz?.companyName || context.organization.name || cfg.branding?.companyName || 'SMS Billing';
    const companyGstin = orgBiz?.gstin || context.organization.gstin || cfg.branding?.companyGstin || '';
    const companyPan = orgBiz?.pan || context.organization.pan || cfg.branding?.companyPan || '';
    const companyAddress = [orgBiz?.address, orgBiz?.city, orgBiz?.state, orgBiz?.postalCode].filter(Boolean).join(', ') || cfg.branding?.companyAddress || '';
    const companyPhone = orgBiz?.phone || cfg.branding?.companyPhone || '';
    const companyEmail = orgBiz?.email || context.organization.email || cfg.branding?.companyEmail || '';

    const pdfBankName = orgBiz?.bankName || (cfg.payment?.bankName && !cfg.payment?.bankName.includes('HDFC') ? cfg.payment.bankName : '');
    const pdfAccountName = orgBiz?.accountName || (orgBiz?.companyName && orgBiz.companyName !== 'My Organization' ? orgBiz.companyName : companyName);
    const pdfAccountNumber = orgBiz?.accountNumber || (cfg.payment?.accountNumber && !cfg.payment?.accountNumber.includes('5020') ? cfg.payment.accountNumber : '');
    const pdfIfscCode = orgBiz?.ifscCode || (cfg.payment?.ifscCode && !cfg.payment?.ifscCode.includes('HDFC') ? cfg.payment.ifscCode : '');
    const pdfBranch = orgBiz?.branch || (cfg.payment?.branchName && !cfg.payment?.branchName.includes('BKC') ? cfg.payment.branchName : '');
    const pdfUpiId = (orgBiz as any)?.upiId || cfg.payment?.upiId || '';

    const resolvedAddress = resolveInvoiceAddressDisplay({
      sameAsBillingAddress: invoice.sameAsBillingAddress,
      billingAddress: invoice.billingAddress,
      shippingAddress: invoice.shippingAddress,
    });

    const isPrint = request.nextUrl.searchParams.get('print') === 'true';

    if (isPrint) {
      const itemsHtml = (invoice.items || []).map((item: any, idx: number) => `
        <tr style="border-bottom: 1px solid ${colors.border || '#e2e8f0'}; page-break-inside: avoid;">
          <td style="padding: 10px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 10px;">
            <div style="font-weight: bold; color: ${colors.text || '#0F172A'};">${item.name}</div>
            ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; font-family: monospace; color: #475569;">${item.classificationCode || item.hsn || '-'}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace;">${item.quantity} ${item.unit || ''}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(item.rate)}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace;">${item.discount > 0 ? '-' + formatCurrency(item.discount) : '-'}</td>
          <td style="padding: 10px; text-align: right; font-family: monospace;">${item.taxRate}%</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; font-family: monospace;">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('');

      const hasPdfBankDetails = Boolean(pdfBankName || pdfAccountNumber || pdfIfscCode || pdfUpiId || pdfAccountName);
      const bankDetailsHtml = hasPdfBankDetails ? `
        <div class="section-box">
          <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 4px;">Payment & Banking Details:</strong>
          ${pdfBankName ? `<div style="font-weight: bold; font-size: 12px; color: ${colors.text || '#0F172A'};">${pdfBankName}</div>` : ''}
          <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 2px;">
            ${pdfAccountName ? `A/C Name: ${pdfAccountName}<br>` : ''}
            ${pdfAccountNumber ? `A/C No: ${pdfAccountNumber}<br>` : ''}
            ${pdfIfscCode ? `IFSC Code: ${pdfIfscCode} ${pdfBranch ? '• Branch: ' + pdfBranch : ''}` : ''}
            ${pdfUpiId ? `<br>UPI ID: ${pdfUpiId}` : ''}
          </div>
        </div>
      ` : `<div class="section-box" style="color: #94a3b8; font-style: italic; font-size: 11px;">Payment details not configured</div>`;

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 30px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #059669; }
    .billing-grid { display: grid; grid-template-columns: ${resolvedAddress.showShippingBlock && resolvedAddress.shippingAddress ? '1fr 1fr' : '1fr'}; gap: 20px; margin-bottom: 20px; background: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; }
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
      <div style="color: #64748b; margin-top: 4px;"># ${invoice.invoiceNumber}</div>
    </div>
    <div style="text-align: right;">
      <div>Date: <strong>${invoice.date || ''}</strong></div>
      <div>Due Date: <strong>${invoice.dueDate || ''}</strong></div>
      <div style="margin-top: 4px; font-weight: bold; color: #059669;">Status: ${String(invoice.status).toUpperCase()}</div>
    </div>
  </div>
  <div class="billing-grid">
    <div class="billing-box">
      <strong>Billed To:</strong>
      <div style="font-weight: bold; font-size: 13px;">${invoice.customerName}</div>
      ${invoice.customerEmail ? `<div style="color: #64748b;">${invoice.customerEmail}</div>` : ''}
      ${invoice.customerPhone ? `<div style="color: #64748b;">${invoice.customerPhone}</div>` : ''}
      ${invoice.customerGstin ? `<div style="font-weight: bold; color: #059669; margin-top: 4px;">GSTIN: ${invoice.customerGstin}</div>` : ''}
      ${resolvedAddress.billingAddress ? `
        <div style="margin-top: 4px; color: #475569;">
          ${resolvedAddress.billingAddress.street ? resolvedAddress.billingAddress.street + '<br>' : ''}
          ${resolvedAddress.billingAddress.city || ''} ${resolvedAddress.billingAddress.state || ''} ${resolvedAddress.billingAddress.postalCode || ''}
        </div>
      ` : ''}
    </div>
    ${resolvedAddress.showShippingBlock && resolvedAddress.shippingAddress ? `
    <div class="billing-box">
      <strong>Shipping Address:</strong>
      <div style="font-weight: bold; font-size: 13px;">${invoice.customerName}</div>
      <div style="margin-top: 4px; color: #475569;">
        ${resolvedAddress.shippingAddress.street ? resolvedAddress.shippingAddress.street + '<br>' : ''}
        ${resolvedAddress.shippingAddress.city || ''} ${resolvedAddress.shippingAddress.state || ''} ${resolvedAddress.shippingAddress.postalCode || ''}
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
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal:</span> <span>${formatCurrency(invoice.subtotal)}</span></div>
    ${invoice.discountTotal > 0 ? `<div><span>Discount:</span> <span>-${formatCurrency(invoice.discountTotal)}</span></div>` : ''}
    <div><span>Tax (GST):</span> <span>${formatCurrency(invoice.taxTotal)}</span></div>
    <div class="grand-total"><span>Total Amount:</span> <span>${formatCurrency(invoice.total)}</span></div>
    <div><span>Amount Paid:</span> <span>${formatCurrency(invoice.amountPaid)}</span></div>
    <div style="font-weight: bold; color: #DC2626;"><span>Balance Due:</span> <span>${formatCurrency(invoice.amountDue)}</span></div>
  </div>
  ${bankDetailsHtml}
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

      return new NextResponse(htmlContent, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Generate REAL %PDF-1.4 Binary Buffer for PDF Download
    const billingAddressStr = resolvedAddress.billingAddress
      ? [resolvedAddress.billingAddress.street, resolvedAddress.billingAddress.city, resolvedAddress.billingAddress.state, resolvedAddress.billingAddress.postalCode].filter(Boolean).join(', ')
      : '';
    const shippingAddressStr = resolvedAddress.shippingAddress
      ? [resolvedAddress.shippingAddress.street, resolvedAddress.shippingAddress.city, resolvedAddress.shippingAddress.state, resolvedAddress.shippingAddress.postalCode].filter(Boolean).join(', ')
      : '';

    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      dueDate: invoice.dueDate,
      status: invoice.status,
      companyName,
      companyGstin,
      companyPan,
      companyAddress,
      companyPhone,
      companyEmail,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      customerGstin: invoice.customerGstin,
      billingAddress: billingAddressStr,
      shippingAddress: shippingAddressStr,
      showShippingBlock: resolvedAddress.showShippingBlock,
      items: (invoice.items || []).map((item: any) => ({
        name: item.name || 'Item',
        description: item.description,
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) || 0,
        amount: Number(item.amount) || 0,
      })),
      subtotal: Number(invoice.subtotal) || 0,
      discountTotal: Number(invoice.discountTotal) || 0,
      taxTotal: Number(invoice.taxTotal) || 0,
      total: Number(invoice.total) || 0,
      amountPaid: Number(invoice.amountPaid) || 0,
      balanceDue: Number(invoice.amountDue) || 0,
      bankName: pdfBankName,
      accountName: pdfAccountName,
      accountNumber: pdfAccountNumber,
      ifscCode: pdfIfscCode,
      branch: pdfBranch,
      upiId: pdfUpiId,
      notes: invoice.notes,
      terms: invoice.terms,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      category: template?.category || cfg.category,
      templateName: template?.name,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[PDF GENERATION ERROR]', error);
    return errorResponse(error, requestId);
  }
}
