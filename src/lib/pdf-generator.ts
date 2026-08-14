/**
 * High-performance, zero-dependency Zoho-Style PDF Binary Generator
 * Generates 100% valid %PDF-1.4 binary buffers matching the Master Zoho Layout
 * readable by Adobe Acrobat Reader, Google Chrome, Microsoft Edge, macOS Preview.
 */

export interface PdfInvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface PdfInvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  companyName: string;
  companyGstin?: string;
  companyPan?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  showShippingBlock?: boolean;
  items: PdfInvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  paymentInstructions?: string;
  notes?: string;
  terms?: string;
  primaryColor?: string;
  secondaryColor?: string;
  category?: string;
  templateName?: string;
}

function escapePdfText(text: string): string {
  if (!text) return '';
  const sanitized = text.replace(/₹/g, 'INR ').replace(/[\r\n]+/g, ' ');
  return sanitized
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatAmount(num: number): string {
  return 'INR ' + Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hexToPdfRgb(hex?: string, fallback = '0.08 0.58 0.28'): string {
  if (!hex || !hex.startsWith('#')) return fallback;
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return fallback;
  }
  return `${(r / 255).toFixed(2)} ${(g / 255).toFixed(2)} ${(b / 255).toFixed(2)}`;
}

export function generateInvoicePdfBuffer(data: PdfInvoiceData): Buffer {
  const streamLines: string[] = [];

  const primaryRgb = hexToPdfRgb(data.primaryColor, '0.08 0.58 0.28');
  const tableHeaderRgb = primaryRgb;

  // Helper to append PDF stream operators
  const addText = (text: string, x: number, y: number, font = 'F2', size = 10, rgb = '0 0 0') => {
    const escaped = escapePdfText(text);
    streamLines.push(`BT /${font} ${size} Tf ${rgb} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number, rgb = '0.8 0.85 0.9', width = 1) => {
    streamLines.push(`${rgb} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const addRect = (x: number, y: number, w: number, h: number, fillRgb = '0.95 0.97 0.98') => {
    streamLines.push(`${fillRgb} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };

  // 1. ZOHO TOP HEADER (Logo Left, Business Details Right)
  // Left: Logo Placeholder
  addRect(40, 770, 45, 45, primaryRgb);
  addText((data.companyName || 'SMS')[0], 56, 786, 'F1', 20, '1 1 1');

  // Right: Business Details
  let currentY = 810;
  addText(data.companyName || 'SMS Billing', 380, currentY, 'F1', 13, '0.05 0.09 0.16');
  currentY -= 14;

  if (data.companyGstin) {
    addText(`GSTIN: ${data.companyGstin}`, 380, currentY, 'F2', 9, '0.25 0.33 0.45');
    currentY -= 12;
  }
  if (data.companyAddress) {
    addText(data.companyAddress.slice(0, 40), 380, currentY, 'F2', 9, '0.35 0.42 0.52');
    currentY -= 12;
  }
  if (data.companyEmail || data.companyPhone) {
    addText([data.companyPhone, data.companyEmail].filter(Boolean).join('  |  ').slice(0, 40), 380, currentY, 'F2', 9, '0.35 0.42 0.52');
  }

  // 2. CENTERED INVOICE TITLE WITH ACCENT DIVIDERS
  addLine(40, 745, 230, 745, '0.85 0.88 0.92', 1);
  addText('INVOICE', 250, 740, 'F1', 16, '0.1 0.15 0.25');
  addLine(340, 745, 555, 745, '0.85 0.88 0.92', 1);

  // 3. BILL TO / SHIP TO & INVOICE#
  currentY = 715;
  addText('Bill To', 40, currentY, 'F1', 9, '0.5 0.55 0.65');
  addText('Invoice#', 450, currentY, 'F1', 9, '0.5 0.55 0.65');

  currentY -= 14;
  addText(data.customerName || 'Valued Customer', 40, currentY, 'F1', 11, '0.05 0.09 0.16');
  addText(data.invoiceNumber || 'INV-000001', 450, currentY, 'F1', 12, '0.05 0.09 0.16');

  currentY -= 12;
  if (data.customerGstin) {
    addText(`GSTIN: ${data.customerGstin}`, 40, currentY, 'F1', 8.5, primaryRgb);
    currentY -= 10;
  }
  if (data.billingAddress) {
    addText(data.billingAddress.slice(0, 50), 40, currentY, 'F2', 8.5, '0.3 0.35 0.45');
    currentY -= 10;
  }

  // Ship To (If separate)
  if (data.showShippingBlock && data.shippingAddress) {
    currentY -= 6;
    addText('Ship To', 40, currentY, 'F1', 9, '0.5 0.55 0.65');
    currentY -= 12;
    addText(data.shippingAddress.slice(0, 50), 40, currentY, 'F2', 8.5, '0.3 0.35 0.45');
  }

  // 4. 3-COLUMN INVOICE DATES & TERMS TABLE (Zoho Style)
  currentY = 620;
  addRect(40, currentY, 515, 20, primaryRgb);
  addText('Invoice Date', 50, currentY + 6, 'F1', 9, '1 1 1');
  addText('Terms', 220, currentY + 6, 'F1', 9, '1 1 1');
  addText('Due Date', 390, currentY + 6, 'F1', 9, '1 1 1');

  currentY -= 18;
  addRect(40, currentY, 515, 18, '0.97 0.98 0.99');
  addLine(40, currentY, 555, currentY, '0.88 0.91 0.95');
  addText(data.date || '-', 50, currentY + 5, 'F2', 9, '0.1 0.15 0.25');
  addText('Due on Receipt', 220, currentY + 5, 'F2', 9, '0.1 0.15 0.25');
  addText(data.dueDate || '-', 390, currentY + 5, 'F2', 9, '0.1 0.15 0.25');

  // 5. LINE ITEM TABLE HEADER
  currentY -= 30;
  addRect(40, currentY, 515, 22, primaryRgb);
  addText('#', 48, currentY + 7, 'F1', 9, '1 1 1');
  addText('ITEM & DESCRIPTION', 75, currentY + 7, 'F1', 9, '1 1 1');
  addText('QTY', 330, currentY + 7, 'F1', 9, '1 1 1');
  addText('RATE', 390, currentY + 7, 'F1', 9, '1 1 1');
  addText('AMOUNT', 480, currentY + 7, 'F1', 9, '1 1 1');

  // Line Items Rows
  currentY -= 20;
  (data.items || []).forEach((item, idx) => {
    if (currentY < 200) return;
    const rowBg = idx % 2 === 1 ? '0.98 0.99 1' : '1 1 1';
    addRect(40, currentY, 515, 20, rowBg);
    addLine(40, currentY, 555, currentY, '0.92 0.94 0.96');

    addText(String(idx + 1), 48, currentY + 5, 'F2', 9, '0.4 0.45 0.55');
    addText((item.name || 'Item').slice(0, 45), 75, currentY + 5, 'F1', 9, '0.1 0.15 0.25');
    addText(String(item.quantity || 1), 330, currentY + 5, 'F2', 9, '0.2 0.25 0.35');
    addText(formatAmount(item.rate), 390, currentY + 5, 'F2', 9, '0.2 0.25 0.35');
    addText(formatAmount(item.amount), 480, currentY + 5, 'F1', 9, '0.1 0.15 0.25');

    currentY -= 20;
  });

  // 6. TOTALS & PAYMENT DETAILS SECTION
  currentY -= 15;
  const totalsY = currentY;
  addRect(330, totalsY - 95, 225, 105, '0.96 0.98 0.96');
  addLine(330, totalsY + 10, 555, totalsY + 10, '0.85 0.88 0.92');
  addLine(330, totalsY - 95, 555, totalsY - 95, '0.85 0.88 0.92');

  addText('Sub Total:', 340, totalsY - 5, 'F2', 9, '0.3 0.35 0.45');
  addText(formatAmount(data.subtotal), 460, totalsY - 5, 'F2', 9, '0.1 0.15 0.25');

  if (data.discountTotal > 0) {
    addText('Discount:', 340, totalsY - 20, 'F2', 9, '0.3 0.35 0.45');
    addText(`-${formatAmount(data.discountTotal)}`, 460, totalsY - 20, 'F2', 9, '0.8 0.2 0.2');
  }

  addText('Tax Rate (GST):', 340, totalsY - 35, 'F2', 9, '0.3 0.35 0.45');
  addText(formatAmount(data.taxTotal), 460, totalsY - 35, 'F2', 9, '0.1 0.15 0.25');

  addLine(340, totalsY - 45, 545, totalsY - 45, '0.8 0.84 0.88');
  addText('Total:', 340, totalsY - 60, 'F1', 10, primaryRgb);
  addText(formatAmount(data.total), 460, totalsY - 60, 'F1', 10, primaryRgb);

  addText('Amount Paid:', 340, totalsY - 75, 'F2', 9, '0.3 0.35 0.45');
  addText(formatAmount(data.amountPaid), 460, totalsY - 75, 'F2', 9, '0.1 0.15 0.25');

  addText('Balance Due:', 340, totalsY - 90, 'F1', 9.5, '0.85 0.15 0.15');
  addText(formatAmount(data.balanceDue), 460, totalsY - 90, 'F1', 9.5, '0.85 0.15 0.15');

  // Left: Payment & Banking Details Box
  const hasBankDetails = Boolean(data.bankName || data.accountNumber || data.ifscCode || data.upiId || data.accountName);
  if (hasBankDetails) {
    const bankY = totalsY;
    addRect(40, bankY - 95, 275, 105, '0.97 0.98 0.99');
    addLine(40, bankY + 10, 315, bankY + 10, '0.85 0.88 0.92');

    addText('PAYMENT & BANKING DETAILS:', 50, bankY - 5, 'F1', 9, primaryRgb);
    let bY = bankY - 20;

    if (data.bankName) {
      addText(`Bank Name: ${data.bankName}`, 50, bY, 'F1', 9, '0.1 0.15 0.25');
      bY -= 14;
    }
    if (data.accountName) {
      addText(`A/C Name: ${data.accountName}`, 50, bY, 'F2', 8.5, '0.2 0.25 0.35');
      bY -= 12;
    }
    if (data.accountNumber) {
      addText(`A/C No: ${data.accountNumber}`, 50, bY, 'F1', 8.5, '0.1 0.15 0.25');
      bY -= 12;
    }
    if (data.ifscCode) {
      addText(`IFSC Code: ${data.ifscCode}${data.branch ? '  Branch: ' + data.branch : ''}`, 50, bY, 'F2', 8.5, '0.2 0.25 0.35');
      bY -= 12;
    }
    if (data.upiId) {
      addText(`UPI ID: ${data.upiId}`, 50, bY, 'F1', 8.5, primaryRgb);
    }
  }

  // 7. FOOTER / NOTES / TERMS
  if (data.notes) {
    addText(data.notes.slice(0, 80), 40, 80, 'F2', 9, '0.3 0.35 0.45');
  } else {
    addText('Thanks for your business.', 40, 80, 'F2', 9, '0.3 0.35 0.45');
  }

  addText('Terms & Conditions', 40, 60, 'F1', 9, '0.1 0.15 0.25');
  addText(data.terms ? data.terms.slice(0, 95) : 'Full payment is due upon receipt of this invoice.', 40, 48, 'F2', 8, '0.4 0.45 0.55');

  addText('Page 1 of 1', 500, 30, 'F2', 8, '0.5 0.55 0.65');

  // Build PDF Stream Object 6 Content
  const contentStream = streamLines.join('\n');
  const contentLength = Buffer.byteLength(contentStream, 'ascii');

  // Construct PDF Objects
  const headerStr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const objects: string[] = [
    // 1 0 obj - Catalog
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    // 2 0 obj - Pages
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    // 3 0 obj - Page
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [0 0 595.28 841.89] /Contents 6 0 R >>\nendobj\n',
    // 4 0 obj - Font Helvetica-Bold
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    // 5 0 obj - Font Helvetica
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    // 6 0 obj - Content Stream
    `6 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  // Calculate Byte Offsets for Cross-Reference (xref) Table
  let currentOffset = Buffer.byteLength(headerStr, 'ascii');
  const offsets: number[] = [0];

  objects.forEach((obj) => {
    offsets.push(currentOffset);
    currentOffset += Buffer.byteLength(obj, 'ascii');
  });

  // Construct xref Table
  let xrefStr = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const startXrefOffset = currentOffset;
  const trailerStr = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXrefOffset}\n%%EOF\n`;

  const fullPdfStr = headerStr + objects.join('') + xrefStr + trailerStr;
  return Buffer.from(fullPdfStr, 'binary');
}
