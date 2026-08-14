export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface BusinessSettings {
  companyName: string;
  legalName: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstin?: string;
  pan?: string;
  currency: CurrencyCode;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  logoUrl?: string;
  logoName?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
}

export interface InvoiceSettings {
  prefix: string;
  numberFormat: 'INV-000001' | 'INV-YYYY-000001' | 'INV/YYYY/000001';
  nextNumber: number;
  defaultPaymentTerms: string;
  defaultDueDays: number;
  defaultCurrency: CurrencyCode;
  defaultTemplateId: string;
  notesFooter?: string;
}

export interface QuoteSettings {
  prefix: string;
  numberFormat: 'QUO-000001' | 'QUO-YYYY-000001' | 'QUO/YYYY/000001';
  nextNumber: number;
  defaultValidityDays: number;
  defaultTerms?: string;
  defaultTemplateId: string;
}

export type TaxType = 'GST' | 'IGST' | 'CGST_SGST' | 'NO_TAX';
export type TaxRegistrationStatus = 'Registered' | 'Unregistered' | 'Composition';

export interface TaxSettings {
  enableTax: boolean;
  defaultTaxType: TaxType;
  defaultGstRate: number; // e.g. 18
  customRates: number[];
  businessState: string;
  gstin?: string;
  taxRegistrationStatus: TaxRegistrationStatus;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}

export interface PaymentMethodSettings {
  cash: boolean;
  upi: boolean;
  bankTransfer: boolean;
  creditCard: boolean;
  cheque: boolean;
  other: boolean;
}

export interface PaymentSettings {
  methods: PaymentMethodSettings;
  bankDetails: BankDetails;
  upiId: string;
  paymentInstructions?: string;
}

export interface ExpenseCategorySetting {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  isSystem: boolean;
}

export interface NotificationSettings {
  emailNotifications: {
    invoiceSent: boolean;
    invoiceViewed: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    paymentReceived: boolean;
    quoteAccepted: boolean;
    quoteExpiring: boolean;
    expenseAdded: boolean;
  };
  browserNotifications: boolean;
  reminderPreferences: {
    invoiceReminders: boolean;
    reminderDaysBeforeDue: number;
    paymentReminders: boolean;
  };
}

export type UserRole = 'Owner' | 'Admin' | 'Accountant' | 'Staff' | 'Viewer';
export type UserStatus = 'Active' | 'Invited' | 'Suspended';

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  lastActive: string;
  createdAt: string;
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
}
