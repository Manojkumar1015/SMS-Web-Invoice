import crypto from 'crypto';

const SHARE_SECRET = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sms-web-invoice-share-secret';

export function generateShareToken(invoiceId: string): string {
  const hmac = crypto.createHmac('sha256', SHARE_SECRET).update(invoiceId).digest('hex').substring(0, 16);
  return `${invoiceId}.${hmac}`;
}

export function verifyShareToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [invoiceId, signature] = token.split('.');
  if (!invoiceId || !signature) return null;

  try {
    const expectedSignature = crypto.createHmac('sha256', SHARE_SECRET).update(invoiceId).digest('hex').substring(0, 16);
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return invoiceId;
    }
  } catch {
    return null;
  }
  return null;
}
