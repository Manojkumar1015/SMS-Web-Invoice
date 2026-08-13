/**
 * Centralized financial calculation logic for Quotes, Invoices, and Line Items.
 * Provides deterministic 2-decimal place rounding to avoid JavaScript floating point errors.
 */

export interface LineItemInput {
  quantity: number;
  unitPrice: number;
  discount?: number; // monetary discount per line or total line discount
  taxRate?: number; // tax rate percentage e.g. 18.00
}

export interface CalculatedLineItem {
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface DocumentTotalsInput {
  items: LineItemInput[];
  discountTotal?: number; // additional overall document discount
}

export interface CalculatedDocumentTotals {
  items: CalculatedLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

/**
 * Rounds a number deterministically to 2 decimal places.
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates financial totals for a single line item.
 */
export function calculateLineItem(item: LineItemInput): CalculatedLineItem {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
  const discount = Math.max(0, Number(item.discount) || 0);
  const taxRate = Math.max(0, Number(item.taxRate) || 0);

  const rawLineSubtotal = quantity * unitPrice;
  const lineSubtotal = roundCurrency(rawLineSubtotal);

  const taxableAmount = Math.max(0, roundCurrency(lineSubtotal - discount));
  const rawTax = taxableAmount * (taxRate / 100);
  const taxAmount = roundCurrency(rawTax);

  const lineTotal = roundCurrency(taxableAmount + taxAmount);

  return {
    quantity,
    unitPrice,
    lineSubtotal,
    discount,
    taxableAmount,
    taxRate,
    taxAmount,
    lineTotal,
  };
}

/**
 * Calculates complete financial totals for a Quote or Invoice document.
 */
export function calculateDocumentTotals(input: DocumentTotalsInput): CalculatedDocumentTotals {
  const calculatedItems = (input.items || []).map((item) => calculateLineItem(item));

  const subtotal = roundCurrency(
    calculatedItems.reduce((acc, item) => acc + item.lineSubtotal, 0)
  );

  const itemDiscounts = roundCurrency(
    calculatedItems.reduce((acc, item) => acc + item.discount, 0)
  );

  const overallDiscount = Math.max(0, Number(input.discountTotal) || 0);
  const discountTotal = roundCurrency(itemDiscounts + overallDiscount);

  const taxTotal = roundCurrency(
    calculatedItems.reduce((acc, item) => acc + item.taxAmount, 0)
  );

  const total = Math.max(0, roundCurrency(subtotal - discountTotal + taxTotal));

  return {
    items: calculatedItems,
    subtotal,
    discountTotal,
    taxTotal,
    total,
  };
}
