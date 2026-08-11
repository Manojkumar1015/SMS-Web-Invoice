import { DocumentItem } from '@/types/quote';

export interface DocumentTotalsCalculation {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Calculates line item amounts.
 */
export function calculateLineItem(
  quantity: number,
  rate: number,
  discount: number = 0,
  taxRate: number = 0
): { lineSubtotal: number; lineDiscount: number; lineTax: number; lineTotal: number } {
  const q = Math.max(0, quantity || 0);
  const r = Math.max(0, rate || 0);
  const d = Math.max(0, discount || 0);
  const tRate = Math.max(0, taxRate || 0);

  const lineSubtotal = q * r;
  const lineDiscount = Math.min(lineSubtotal, d);
  const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
  const lineTax = (taxableAmount * tRate) / 100;
  const lineTotal = taxableAmount + lineTax;

  return {
    lineSubtotal,
    lineDiscount,
    lineTax,
    lineTotal,
  };
}

/**
 * Calculates document aggregate totals.
 */
export function calculateDocumentTotals(
  items: DocumentItem[],
  customDiscount: number = 0,
  applyRoundOff: boolean = false
): DocumentTotalsCalculation {
  let subtotal = 0;
  let lineDiscountTotal = 0;
  let taxTotal = 0;

  items.forEach((item) => {
    const calc = calculateLineItem(item.quantity, item.rate, item.discount, item.taxRate);
    subtotal += calc.lineSubtotal;
    lineDiscountTotal += calc.lineDiscount;
    taxTotal += calc.lineTax;
  });

  const discountTotal = lineDiscountTotal + Math.max(0, customDiscount);
  const unroundedTotal = Math.max(0, subtotal - discountTotal + taxTotal);

  let grandTotal = unroundedTotal;
  let roundOff = 0;

  if (applyRoundOff) {
    grandTotal = Math.round(unroundedTotal);
    roundOff = Number((grandTotal - unroundedTotal).toFixed(2));
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    roundOff: Number(roundOff.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}
