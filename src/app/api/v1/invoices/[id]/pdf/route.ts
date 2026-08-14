import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { InvoiceService } from '@/services/invoice/invoice.service';
import { TemplateService } from '@/services/template/template.service';
import { OrganizationService } from '@/services/organization/organization.service';
import { errorResponse } from '@/lib/api/response';
import { formatCurrency } from '@/lib/formatters';

const invoiceService = new InvoiceService();
const templateService = new TemplateService();
const orgService = new OrganizationService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const invoice = await invoiceService.getInvoiceById(context, params.id);
    let template = invoice.templateId ? await templateService.getTemplateById(context, invoice.templateId).catch(() => null) : null;
    if (!template) {
      template = await templateService.getDefaultTemplate(context);
    }

    const orgBiz = await orgService.getOrganization(context).catch(() => null);

    const cfg: any = template?.config || {};
    const colors = cfg.colors || { primary: '#059669', secondary: '#10B981', border: '#E2E8F0', tableHeaderBg: '#F8FAFC', tableHeaderText: '#334155', text: '#0F172A' };
    const headerCfg = cfg.header || {};
    const isBanner = headerCfg.style === 'banner' || headerCfg.showBannerBg || true;

    const companyName = orgBiz?.companyName || context.organization.name || cfg.branding?.companyName || 'SMS Billing';
    const companyGstin = orgBiz?.gstin || context.organization.gstin || cfg.branding?.companyGstin || '';
    const companyPan = orgBiz?.pan || context.organization.pan || cfg.branding?.companyPan || '';
    const companyAddress = [orgBiz?.address, orgBiz?.city, orgBiz?.state, orgBiz?.postalCode].filter(Boolean).join(', ') || cfg.branding?.companyAddress || '';
    const companyPhone = orgBiz?.phone || cfg.branding?.companyPhone || '';
    const companyEmail = orgBiz?.email || context.organization.email || cfg.branding?.companyEmail || '';
    const logoUrl = orgBiz?.logoUrl || cfg.branding?.logoUrl || '';

    // Calculate GST Tax breakdown (CGST 9% + SGST 9% for intra-state or IGST for inter-state)
    const taxTotal = invoice.taxTotal || 0;
    const cgstAmount = Math.round((taxTotal / 2) * 100) / 100;
    const sgstAmount = taxTotal - cgstAmount;

    const itemsHtml = invoice.items.map((item: any, idx: number) => `
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

    const pdfBankName = orgBiz?.bankName || (cfg.payment?.bankName && !cfg.payment?.bankName.includes('HDFC') ? cfg.payment.bankName : '');
    const pdfAccountName = orgBiz?.accountName || (orgBiz?.companyName && orgBiz.companyName !== 'My Organization' ? orgBiz.companyName : companyName);
    const pdfAccountNumber = orgBiz?.accountNumber || (cfg.payment?.accountNumber && !cfg.payment?.accountNumber.includes('5020') ? cfg.payment.accountNumber : '');
    const pdfIfscCode = orgBiz?.ifscCode || (cfg.payment?.ifscCode && !cfg.payment?.ifscCode.includes('HDFC') ? cfg.payment.ifscCode : '');
    const pdfBranch = orgBiz?.branch || (cfg.payment?.branchName && !cfg.payment?.branchName.includes('BKC') ? cfg.payment.branchName : '');
    const hasPdfBankDetails = Boolean(pdfBankName || pdfAccountNumber || pdfIfscCode);

    const bankDetailsHtml = hasPdfBankDetails ? `
      <div class="section-box">
        <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 4px;">Payment & Banking Details:</strong>
        ${pdfBankName ? `<div style="font-weight: bold; font-size: 12px; color: ${colors.text || '#0F172A'};">${pdfBankName}</div>` : ''}
        <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 2px;">
          ${pdfAccountName ? `A/C Name: ${pdfAccountName}<br>` : ''}
          ${pdfAccountNumber ? `A/C No: ${pdfAccountNumber}<br>` : ''}
          ${pdfIfscCode ? `IFSC Code: ${pdfIfscCode} ${pdfBranch ? '• Branch: ' + pdfBranch : ''}` : ''}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">
          Please reference the invoice number on all electronic payments.
        </div>
      </div>
    ` : `
      <div class="section-box" style="color: #94a3b8; font-style: italic; font-size: 11px;">
        Payment details not configured
      </div>
    `;

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
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: ${colors.text || '#0F172A'};
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid ${colors.border || '#E2E8F0'};
      border-radius: 12px;
      padding: 28px;
      position: relative;
      background: #ffffff;
    }
    .banner-header {
      background-color: ${colors.primary || '#059669'};
      color: #ffffff;
      padding: 24px;
      border-radius: 10px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-logo {
      width: 48px;
      height: 48px;
      background: #ffffff;
      color: ${colors.primary || '#059669'};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      margin-right: 12px;
    }
    .inv-badge {
      background: rgba(255,255,255,0.2);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      margin-left: 6px;
    }
    .billing-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; font-size: 12px; }
    .billing-box { flex: 1; padding: 14px; background: ${colors.tableHeaderBg || '#F8FAFC'}; border-radius: 8px; border: 1px solid ${colors.border || '#E2E8F0'}; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    thead { display: table-header-group; }
    th { background: ${colors.tableHeaderBg || '#F8FAFC'}; color: ${colors.tableHeaderText || '#334155'}; border-bottom: 2px solid ${colors.primary || '#059669'}; padding: 10px; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
    .totals-container { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; page-break-inside: avoid; }
    .totals-box { width: 280px; margin-left: auto; text-align: right; font-size: 12px; line-height: 1.8; }
    .grand-total { font-size: 16px; font-weight: 900; color: ${colors.primary || '#059669'}; border-top: 2px solid ${colors.primary || '#059669'}; border-bottom: 2px solid ${colors.primary || '#059669'}; padding: 8px 0; margin-top: 8px; }
    .tax-box { padding: 12px; background: #FAF5FF; border: 1px solid #F3E8FF; border-radius: 8px; margin-bottom: 20px; font-size: 11px; }
    .section-box { padding: 12px; background: ${colors.tableHeaderBg || '#F8FAFC'}; border-radius: 8px; border-left: 3px solid ${colors.primary || '#059669'}; margin-bottom: 16px; font-size: 12px; page-break-inside: avoid; }
    .footer { margin-top: 32px; border-top: 1px solid ${colors.border || '#E2E8F0'}; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; page-break-inside: avoid; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .invoice-container { border: none; padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="banner-header">
      <div style="display: flex; align-items: center;">
        <div class="company-logo">
          ${logoUrl ? `<img src="${logoUrl}" style="max-height: 40px; max-width: 40px; object-fit: contain;" />` : 'SMS'}
        </div>
        <div>
          <div style="font-size: 18px; font-weight: bold; color: #ffffff;">${companyName}</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px;">
            ${companyGstin ? `GSTIN: ${companyGstin}` : ''} ${companyPan ? `• PAN: ${companyPan}` : ''}<br>
            ${companyAddress ? `${companyAddress}<br>` : ''}
            ${companyEmail ? `${companyEmail}` : ''} ${companyPhone ? `• ${companyPhone}` : ''}
          </div>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #ffffff; display: flex; align-items: center; justify-content: flex-end;">
          INVOICE <span class="inv-badge">${invoice.status}</span>
        </div>
        <div style="font-size: 14px; font-weight: bold; margin-top: 4px; color: #ffffff; font-family: monospace;">${invoice.invoiceNumber}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 4px;">
          Date: <strong>${invoice.date}</strong> &nbsp;•&nbsp; Due Date: <strong>${invoice.dueDate}</strong>
        </div>
      </div>
    </div>

    <div class="billing-grid">
      <div class="billing-box">
        <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 6px;">Billed To:</strong>
        <div style="font-weight: bold; font-size: 14px; color: ${colors.text || '#0F172A'};">${invoice.customerName}</div>
        ${invoice.customerEmail ? `<div style="color: #64748b; margin-top: 2px;">${invoice.customerEmail}</div>` : ''}
        ${invoice.customerPhone ? `<div style="color: #64748b;">${invoice.customerPhone}</div>` : ''}
        ${invoice.customerGstin ? `<div style="font-family: monospace; font-weight: bold; color: ${colors.primary || '#059669'}; margin-top: 4px;">GSTIN: ${invoice.customerGstin}</div>` : ''}
        ${(billingAddress.street || billingAddress.city) ? `
          <div style="margin-top: 6px; color: #475569;">
            ${billingAddress.street ? billingAddress.street + '<br>' : ''}
            ${billingAddress.city || ''} ${billingAddress.state || ''} ${billingAddress.postalCode || ''}
            ${billingAddress.country ? '<br>' + billingAddress.country : ''}
          </div>
        ` : ''}
      </div>

      <div class="billing-box">
        <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 6px;">Shipping Address:</strong>
        ${hasShipping ? `
          <div style="font-weight: bold; font-size: 13px; color: ${colors.text || '#0F172A'};">${invoice.customerName}</div>
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
          <th style="text-align: left;">Item & Description</th>
          <th style="width: 80px; text-align: center;">HSN/SAC</th>
          <th style="width: 60px; text-align: right;">Qty</th>
          <th style="width: 85px; text-align: right;">Rate (₹)</th>
          <th style="width: 70px; text-align: right;">Discount</th>
          <th style="width: 55px; text-align: right;">Tax %</th>
          <th style="width: 100px; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    ${taxTotal > 0 ? `
      <div class="tax-box">
        <strong style="color: #6B21A8; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 6px;">GST Tax Breakdown:</strong>
        <div style="display: flex; gap: 24px; font-family: monospace;">
          <div>CGST (9%): <strong>${formatCurrency(cgstAmount)}</strong></div>
          <div>SGST (9%): <strong>${formatCurrency(sgstAmount)}</strong></div>
          <div>Total GST: <strong>${formatCurrency(taxTotal)}</strong></div>
        </div>
      </div>
    ` : ''}

    <div class="totals-container">
      <div style="flex: 1;">
        ${bankDetailsHtml}
      </div>

      <div class="totals-box">
        <div>Subtotal: <strong>${formatCurrency(invoice.subtotal)}</strong></div>
        ${invoice.discountTotal > 0 ? `<div style="color: #059669;">Discount: -<strong>${formatCurrency(invoice.discountTotal)}</strong></div>` : ''}
        <div>Tax Total (GST): <strong>${formatCurrency(invoice.taxTotal)}</strong></div>
        ${invoice.roundOff ? `<div>Round Off: <strong>${formatCurrency(invoice.roundOff)}</strong></div>` : ''}
        <div class="grand-total">Grand Total: ${formatCurrency(invoice.total)}</div>
        <div>Amount Paid: <strong style="color: #059669;">${formatCurrency(invoice.amountPaid)}</strong></div>
        <div style="color: ${invoice.amountDue > 0 ? '#dc2626' : '#64748b'}; font-weight: 900; font-size: 14px; margin-top: 4px;">Balance Due: ${formatCurrency(invoice.amountDue)}</div>
      </div>
    </div>

    ${invoice.notes ? `
      <div class="section-box">
        <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 2px;">Customer Notes:</strong>
        <div style="color: #475569; font-size: 12px;">${invoice.notes}</div>
      </div>
    ` : ''}

    ${invoice.terms ? `
      <div class="section-box">
        <strong style="color: ${colors.primary || '#059669'}; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 2px;">Terms & Conditions:</strong>
        <div style="color: #64748b; font-size: 11px; white-space: pre-line;">${invoice.terms}</div>
      </div>
    ` : ''}

    <div class="footer">
      <div>${cfg.footer?.text || `${companyName} • Official Tax Invoice`}</div>
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
        'Content-Disposition': `inline; filename="Invoice_${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('[PDF GENERATION ERROR]', error);
    return errorResponse(error, requestId);
  }
}
