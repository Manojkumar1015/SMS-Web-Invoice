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
    const colors = cfg.colors || { primary: '#B8860B', secondary: '#9A7B38', border: '#E5DFD3', tableHeaderBg: '#FAF8F5', tableHeaderText: '#8A6D2B', text: '#1A202C' };
    const isGold = cfg.category === 'elegant' || cfg.id === 'tmpl-white-gold' || colors.primary === '#B8860B';
    const org = context.organization;

    const itemsHtml = invoice.items.map((item: any, idx: number) => `
      <tr style="border-bottom: 1px solid ${colors.border || '#e2e8f0'}; page-break-inside: avoid;">
        <td style="padding: 10px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 10px;">
          <div style="font-weight: bold; color: ${colors.text || '#0f172a'};">${item.name}</div>
          ${item.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding: 10px; text-align: center; font-family: monospace; color: #475569;">${item.hsn || '-'}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(item.rate)}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; color: #059669;">${item.discount > 0 ? '-' + formatCurrency(item.discount) : '-'}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">${item.taxRate}%</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; font-family: monospace;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    const billingAddress = invoice.billingAddress || {};
    const shippingAddress = invoice.shippingAddress || {};
    const hasShipping = shippingAddress.street || shippingAddress.city || shippingAddress.state;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Playfair Display', 'Lora', 'Inter', system-ui, -apple-system, sans-serif;
      color: ${colors.text || '#1A202C'};
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid ${colors.border || '#E5DFD3'};
      border-radius: 8px;
      padding: 32px;
      position: relative;
      background: #ffffff;
    }
    ${isGold ? `.gold-stripe { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #B8860B, #D4AF37, #B8860B); border-top-left-radius: 8px; border-top-right-radius: 8px; }` : ''}
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${colors.primary || '#B8860B'}; padding-bottom: 20px; margin-bottom: 24px; margin-top: ${isGold ? '8px' : '0'}; }
    .org-name { font-size: 22px; font-weight: bold; color: ${colors.primary || '#B8860B'}; }
    .inv-title { font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: ${colors.primary || '#B8860B'}; text-align: right; }
    .billing-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; font-size: 12px; }
    .billing-box { flex: 1; padding: 14px; background: ${colors.tableHeaderBg || '#FAF8F5'}; border-radius: 8px; border: 1px solid ${colors.border || '#E5DFD3'}; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    thead { display: table-header-group; }
    th { background: ${colors.tableHeaderBg || '#FAF8F5'}; color: ${colors.tableHeaderText || '#8A6D2B'}; border-bottom: 2px solid ${colors.primary || '#B8860B'}; padding: 10px; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
    .totals-container { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; page-break-inside: avoid; }
    .totals-box { width: 280px; margin-left: auto; text-align: right; font-size: 12px; line-height: 1.8; }
    .grand-total { font-size: 16px; font-weight: 900; color: ${colors.primary || '#B8860B'}; border-top: 2px solid ${colors.primary || '#B8860B'}; border-bottom: 2px solid ${colors.primary || '#B8860B'}; padding: 8px 0; margin-top: 8px; }
    .section-box { padding: 12px; background: ${colors.tableHeaderBg || '#FAF8F5'}; border-radius: 8px; border-left: 3px solid ${colors.primary || '#B8860B'}; margin-bottom: 16px; font-size: 12px; page-break-inside: avoid; }
    .footer { margin-top: 32px; border-top: 1px solid ${colors.border || '#E5DFD3'}; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; page-break-inside: avoid; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .invoice-container { border: none; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${isGold ? '<div class="gold-stripe"></div>' : ''}
    <div class="header">
      <div>
        <div class="org-name">${org.name}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          ${org.email ? `<div>Email: ${org.email}</div>` : ''}
          ${org.gstin ? `<div>GSTIN: ${org.gstin}</div>` : ''}
          ${org.pan ? `<div>PAN: ${org.pan}</div>` : ''}
        </div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div style="font-size: 14px; font-weight: bold; margin-top: 4px; text-align: right; color: ${colors.text || '#1A202C'};">${invoice.invoiceNumber}</div>
        <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">
          Date: <strong>${invoice.date}</strong><br>
          Due Date: <strong>${invoice.dueDate}</strong>
        </div>
      </div>
    </div>

    <div class="billing-grid">
      <div class="billing-box">
        <strong style="color: ${colors.secondary || '#9A7B38'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 6px;">Billed To:</strong>
        <div style="font-weight: bold; font-size: 14px; color: ${colors.text || '#1A202C'};">${invoice.customerName}</div>
        ${invoice.customerEmail ? `<div style="color: #64748b; margin-top: 2px;">${invoice.customerEmail}</div>` : ''}
        ${invoice.customerPhone ? `<div style="color: #64748b;">${invoice.customerPhone}</div>` : ''}
        ${invoice.customerGstin ? `<div style="font-family: monospace; font-weight: bold; color: ${colors.primary || '#B8860B'}; margin-top: 4px;">GSTIN: ${invoice.customerGstin}</div>` : ''}
        ${(billingAddress.street || billingAddress.city) ? `
          <div style="margin-top: 6px; color: #475569; leading-height: 1.4;">
            ${billingAddress.street ? billingAddress.street + '<br>' : ''}
            ${billingAddress.city || ''} ${billingAddress.state || ''} ${billingAddress.postalCode || ''}
            ${billingAddress.country ? '<br>' + billingAddress.country : ''}
          </div>
        ` : ''}
      </div>

      <div class="billing-box">
        <strong style="color: ${colors.secondary || '#9A7B38'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 6px;">Shipping Address:</strong>
        ${hasShipping ? `
          <div style="font-weight: bold; font-size: 13px; color: ${colors.text || '#1A202C'};">${invoice.customerName}</div>
          <div style="margin-top: 4px; color: #475569;">
            ${shippingAddress.street ? shippingAddress.street + '<br>' : ''}
            ${shippingAddress.city || ''} ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}
            ${shippingAddress.country ? '<br>' + shippingAddress.country : ''}
          </div>
        ` : `
          <div style="color: #64748b; font-style: italic;">Same as billing address</div>
        `}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th style="text-align: left;">Item Description</th>
          <th style="width: 75px; text-align: center;">HSN/SAC</th>
          <th style="width: 55px; text-align: right;">Qty</th>
          <th style="width: 85px; text-align: right;">Rate</th>
          <th style="width: 70px; text-align: right;">Discount</th>
          <th style="width: 50px; text-align: right;">Tax %</th>
          <th style="width: 95px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-container">
      <div style="flex: 1;">
        ${(cfg.payment?.bankName || cfg.payment?.accountNumber) ? `
          <div class="section-box">
            <strong style="color: ${colors.secondary || '#9A7B38'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 4px;">Bank & Payment Details:</strong>
            <div style="font-weight: bold; font-size: 12px; color: ${colors.text || '#1A202C'};">${cfg.payment.bankName}</div>
            <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 2px;">
              A/C Name: ${cfg.payment.accountName || org.name}<br>
              A/C No: ${cfg.payment.accountNumber}<br>
              IFSC: ${cfg.payment.ifscCode} ${cfg.payment.branchName ? '• ' + cfg.payment.branchName : ''}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="totals-box">
        <div>Subtotal: <strong>${formatCurrency(invoice.subtotal)}</strong></div>
        ${invoice.discountTotal > 0 ? `<div style="color: #059669;">Discount: -<strong>${formatCurrency(invoice.discountTotal)}</strong></div>` : ''}
        <div>GST Tax Total: <strong>${formatCurrency(invoice.taxTotal)}</strong></div>
        ${invoice.roundOff ? `<div>Round Off: <strong>${formatCurrency(invoice.roundOff)}</strong></div>` : ''}
        <div class="grand-total">Grand Total: ${formatCurrency(invoice.total)}</div>
        ${invoice.amountPaid > 0 ? `<div style="color: #059669; font-weight: bold; margin-top: 4px;">Amount Paid: ${formatCurrency(invoice.amountPaid)}</div>` : ''}
        ${invoice.amountDue > 0 ? `<div style="color: #dc2626; font-weight: 900; font-size: 14px; margin-top: 4px;">Balance Due: ${formatCurrency(invoice.amountDue)}</div>` : ''}
      </div>
    </div>

    ${invoice.notes ? `
      <div class="section-box">
        <strong style="color: ${colors.secondary || '#9A7B38'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 2px;">Customer Notes:</strong>
        <div style="color: #475569; font-size: 12px;">${invoice.notes}</div>
      </div>
    ` : ''}

    ${invoice.terms ? `
      <div class="section-box">
        <strong style="color: ${colors.secondary || '#9A7B38'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 2px;">Terms & Conditions:</strong>
        <div style="color: #64748b; font-size: 11px; white-space: pre-line;">${invoice.terms}</div>
      </div>
    ` : ''}

    <div class="footer">
      <div>${cfg.footer?.text || `${org.name} • Official Tax Invoice`}</div>
      <div style="font-size: 10px; margin-top: 4px;">Page 1 of 1</div>
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
