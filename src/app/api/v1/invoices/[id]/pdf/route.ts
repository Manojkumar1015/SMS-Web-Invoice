import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { InvoiceService } from '@/services/invoice/invoice.service';
import { TemplateService } from '@/services/template/template.service';
import { errorResponse } from '@/lib/api/response';
import { formatCurrency } from '@/lib/formatters';

const invoiceService = new InvoiceService();
const templateService = new TemplateService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const invoice = await invoiceService.getInvoiceById(context, params.id);
    let template = invoice.templateId ? await templateService.getTemplateById(context, invoice.templateId).catch(() => null) : null;
    if (!template) {
      template = await templateService.getDefaultTemplate(context);
    }

    const cfg: any = template?.config || {};
    const colors = cfg.colors || { primary: '#3b82f6', secondary: '#1e40af', border: '#e2e8f0', text: '#0f172a' };
    const org = context.organization;

    const itemsHtml = invoice.items.map((item: any, idx: number) => `
      <tr style="border-bottom: 1px solid ${colors.border || '#e2e8f0'};">
        <td style="padding: 10px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 10px;">
          <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
          ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(item.rate)}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${item.taxRate}%</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; font-family: monospace;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid ${colors.border || '#e2e8f0'};
      border-radius: 12px;
      padding: 32px;
    }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${colors.primary || '#3b82f6'}; padding-bottom: 20px; margin-bottom: 24px; }
    .org-name { font-size: 20px; font-weight: bold; color: ${colors.primary || '#3b82f6'}; }
    .inv-title { font-size: 24px; font-weight: 900; text-transform: uppercase; color: ${colors.primary || '#3b82f6'}; text-align: right; }
    .billing-grid { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; font-size: 13px; }
    .billing-box { flex: 1; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid ${colors.border || '#e2e8f0'}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: ${colors.primary || '#3b82f6'}; color: #ffffff; padding: 10px; text-transform: uppercase; font-size: 11px; font-weight: bold; }
    .totals-box { width: 280px; margin-left: auto; text-align: right; font-size: 13px; line-height: 1.8; }
    .grand-total { font-size: 16px; font-weight: 900; color: ${colors.primary || '#3b82f6'}; border-top: 2px solid ${colors.primary || '#3b82f6'}; padding-top: 8px; margin-top: 8px; }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div>
        <div class="org-name">${org.name}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          ${org.email ? `<div>${org.email}</div>` : ''}
          ${org.gstin ? `<div>GSTIN: ${org.gstin}</div>` : ''}
        </div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div style="font-size: 13px; font-weight: bold; margin-top: 4px; text-align: right;">${invoice.invoiceNumber}</div>
        <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">
          Date: <strong>${invoice.date}</strong><br>
          Due Date: <strong>${invoice.dueDate}</strong>
        </div>
      </div>
    </div>

    <div class="billing-grid">
      <div class="billing-box">
        <strong style="color: ${colors.secondary || '#1e40af'}; text-transform: uppercase; font-size: 11px; display: block; margin-bottom: 6px;">Billed To:</strong>
        <div style="font-weight: bold; font-size: 14px;">${invoice.customerName}</div>
        ${invoice.customerEmail ? `<div>${invoice.customerEmail}</div>` : ''}
        ${invoice.customerPhone ? `<div>${invoice.customerPhone}</div>` : ''}
        ${invoice.customerGstin ? `<div style="font-family: monospace; font-weight: bold; margin-top: 4px;">GSTIN: ${invoice.customerGstin}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Tax %</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-box">
      <div>Subtotal: <strong>${formatCurrency(invoice.subtotal)}</strong></div>
      ${invoice.discountTotal > 0 ? `<div style="color: #059669;">Discount: -<strong>${formatCurrency(invoice.discountTotal)}</strong></div>` : ''}
      <div>GST Tax Total: <strong>${formatCurrency(invoice.taxTotal)}</strong></div>
      <div class="grand-total">Grand Total: ${formatCurrency(invoice.total)}</div>
      ${invoice.amountPaid > 0 ? `<div style="color: #059669; font-weight: bold;">Amount Paid: ${formatCurrency(invoice.amountPaid)}</div>` : ''}
      ${invoice.amountDue > 0 ? `<div style="color: #dc2626; font-weight: 900; font-size: 15px;">Balance Due: ${formatCurrency(invoice.amountDue)}</div>` : ''}
    </div>

    <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      Thank you for your business! Generated on ${new Date().toLocaleDateString('en-IN')}.
    </div>
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() { window.print(); };
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
