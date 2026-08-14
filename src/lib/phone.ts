export function normalizePhoneNumber(phone?: string | null, defaultCountryCode = '91'): {
  isValid: boolean;
  fullNumber: string;
  formatted: string;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      fullNumber: '',
      formatted: '',
      error: 'Customer phone number is missing. Add a phone number before sending through WhatsApp.',
    };
  }

  let cleaned = phone.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If 10-digit Indian number starting with 6, 7, 8, 9, prepend 91
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = defaultCountryCode + cleaned;
  }

  if (cleaned.length < 10) {
    return {
      isValid: false,
      fullNumber: '',
      formatted: '',
      error: 'Customer phone number is invalid. Please check the mobile number.',
    };
  }

  return {
    isValid: true,
    fullNumber: cleaned,
    formatted: `+${cleaned}`,
  };
}
