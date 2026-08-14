import { format, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string, formatStr = 'dd MMM yyyy'): string {
  if (!dateString) return '-';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatStr);
  } catch {
    return dateString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export interface AddressObj {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export function isAddressNotEmpty(addr?: AddressObj | null): boolean {
  if (!addr) return false;
  return Boolean(
    (addr.street && addr.street.trim()) ||
    (addr.city && addr.city.trim()) ||
    (addr.state && addr.state.trim()) ||
    (addr.postalCode && addr.postalCode.trim()) ||
    (addr.country && addr.country.trim())
  );
}

export function resolveInvoiceAddressDisplay(params: {
  sameAsBillingAddress?: boolean;
  billingAddress?: AddressObj | null;
  shippingAddress?: AddressObj | null;
}) {
  const { sameAsBillingAddress, billingAddress, shippingAddress } = params;

  const hasBilling = isAddressNotEmpty(billingAddress);
  const hasSeparateShipping = isAddressNotEmpty(shippingAddress);

  // CASE 1: Checkbox checked (sameAsBillingAddress === true)
  if (sameAsBillingAddress === true) {
    return {
      billingAddress: hasBilling ? billingAddress : null,
      shippingAddress: hasBilling ? billingAddress : (hasSeparateShipping ? shippingAddress : null),
      showShippingBlock: hasBilling || hasSeparateShipping,
    };
  }

  // CASE 3: Checkbox unchecked AND separate shipping address provided
  if (hasSeparateShipping) {
    return {
      billingAddress: hasBilling ? billingAddress : null,
      shippingAddress: shippingAddress,
      showShippingBlock: true,
    };
  }

  // CASE 2: Checkbox unchecked AND no separate shipping address provided
  return {
    billingAddress: hasBilling ? billingAddress : null,
    shippingAddress: null,
    showShippingBlock: false,
  };
}
