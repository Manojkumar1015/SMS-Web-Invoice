export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  themeColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'right' | 'center';
  isDefault: boolean;
  showGstin: boolean;
  showTerms: boolean;
  showBankDetails: boolean;
  footerText: string;
}
