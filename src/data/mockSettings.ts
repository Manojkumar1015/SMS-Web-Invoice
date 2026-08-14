import {
  BusinessSettings,
  InvoiceSettings,
  QuoteSettings,
  TaxSettings,
  PaymentSettings,
  ExpenseCategorySetting,
  NotificationSettings,
  TeamUser,
} from '@/types/settings';

export const mockBusinessSettings: BusinessSettings = {
  companyName: 'My Organization',
  legalName: 'My Organization',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  gstin: '',
  pan: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata (IST)',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12-hour (hh:mm A)',
};

export const mockInvoiceSettings: InvoiceSettings = {
  prefix: 'INV-',
  numberFormat: 'INV-YYYY-000001',
  nextNumber: 1004,
  defaultPaymentTerms: 'Net 30 Days',
  defaultDueDays: 30,
  defaultCurrency: 'INR',
  defaultTemplateId: 'gst-standard',
  notesFooter: 'Thank you for your business. Please remit payments promptly via bank transfer or UPI.',
};

export const mockQuoteSettings: QuoteSettings = {
  prefix: 'QUO-',
  numberFormat: 'QUO-000001',
  nextNumber: 1003,
  defaultValidityDays: 15,
  defaultTerms: 'Valid for 15 days from date of issue. Prices subject to change thereafter.',
  defaultTemplateId: 'modern',
};

export const mockTaxSettings: TaxSettings = {
  enableTax: true,
  defaultTaxType: 'GST',
  defaultGstRate: 18,
  customRates: [0, 5, 12, 18, 28],
  businessState: 'Maharashtra (27)',
  gstin: '27AAAAA0000A1Z5',
  taxRegistrationStatus: 'Registered',
};

export const mockPaymentSettings: PaymentSettings = {
  methods: {
    cash: true,
    upi: true,
    bankTransfer: true,
    creditCard: true,
    cheque: true,
    other: false,
  },
  bankDetails: {
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
  },
  upiId: '',
  paymentInstructions: 'Kindly mention invoice number in UTR/Remarks during bank transfer.',
};

export const mockExpenseCategories: ExpenseCategorySetting[] = [
  { id: 'cat-1', name: 'Software', description: 'Cloud hosting, SaaS subscriptions, developer licenses', enabled: true, isSystem: true },
  { id: 'cat-2', name: 'Rent', description: 'Commercial office space rental charges', enabled: true, isSystem: true },
  { id: 'cat-3', name: 'Salary', description: 'Payroll wages and employee compensation', enabled: true, isSystem: true },
  { id: 'cat-4', name: 'Electricity', description: 'Power grid and utility bills', enabled: true, isSystem: true },
  { id: 'cat-5', name: 'Fuel', description: 'Generator fuel and vehicle gas expenses', enabled: true, isSystem: true },
  { id: 'cat-6', name: 'Travel', description: 'Client meeting flights, trains, and hotel lodging', enabled: true, isSystem: true },
  { id: 'cat-7', name: 'Transport', description: 'Logistics, courier, and freight charges', enabled: true, isSystem: true },
  { id: 'cat-8', name: 'Materials', description: 'Hardware materials and equipment purchases', enabled: true, isSystem: true },
  { id: 'cat-9', name: 'Marketing', description: 'Digital advertising and event sponsorships', enabled: true, isSystem: true },
  { id: 'cat-10', name: 'Office', description: 'Stationery and pantry supplies', enabled: true, isSystem: true },
  { id: 'cat-11', name: 'Maintenance', description: 'Hardware repair and facility maintenance', enabled: true, isSystem: true },
  { id: 'cat-12', name: 'Utilities', description: 'Internet broadband and telecom connections', enabled: true, isSystem: true },
  { id: 'cat-13', name: 'Professional Services', description: 'Legal, audit, and tax consulting fees', enabled: true, isSystem: true },
  { id: 'cat-14', name: 'Other', description: 'Miscellaneous operational expenses', enabled: true, isSystem: true },
];

export const mockNotificationSettings: NotificationSettings = {
  emailNotifications: {
    invoiceSent: true,
    invoiceViewed: true,
    invoicePaid: true,
    invoiceOverdue: true,
    paymentReceived: true,
    quoteAccepted: true,
    quoteExpiring: false,
    expenseAdded: false,
  },
  browserNotifications: true,
  reminderPreferences: {
    invoiceReminders: true,
    reminderDaysBeforeDue: 3,
    paymentReminders: true,
  },
};

export const mockTeamUsers: TeamUser[] = [
  {
    id: 'user-1',
    name: 'Vikram Malhotra',
    email: 'vikram@acmesolutions.com',
    role: 'Owner',
    status: 'Active',
    lastActive: 'Just now',
    createdAt: '2025-10-01',
  },
  {
    id: 'user-2',
    name: 'Rajesh Nair',
    email: 'rajesh.nair@acmesolutions.com',
    role: 'Admin',
    status: 'Active',
    lastActive: '2 hours ago',
    createdAt: '2025-11-15',
  },
  {
    id: 'user-3',
    name: 'Priya Sharma',
    email: 'accounts@acmesolutions.com',
    role: 'Accountant',
    status: 'Active',
    lastActive: 'Yesterday',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-4',
    name: 'Aman Verma',
    email: 'aman@acmesolutions.com',
    role: 'Staff',
    status: 'Invited',
    lastActive: 'Never',
    createdAt: '2026-02-01',
  },
];
