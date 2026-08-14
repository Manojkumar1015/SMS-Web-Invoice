import { ISettingsService } from '../interfaces/SettingsService';
import {
  BusinessSettings,
  InvoiceSettings,
  QuoteSettings,
  TaxSettings,
  PaymentSettings,
  ExpenseCategorySetting,
  NotificationSettings,
  TeamUser,
  InviteUserInput,
} from '@/types/settings';

const STORAGE_KEYS = {
  invoice: 'sms_invoice_settings',
  quote: 'sms_quote_settings',
  tax: 'sms_tax_settings',
  payment: 'sms_payment_settings',
  expenses: 'sms_expense_categories',
  notifications: 'sms_notification_settings',
  users: 'sms_team_users',
};

function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

export class SupabaseSettingsService implements ISettingsService {
  async getBusinessSettings(): Promise<BusinessSettings> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/v1/organization', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch business settings from API:', err);
    }
    return {
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
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12-hour (hh:mm A)',
    };
  }

  async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/v1/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    }
    throw new Error('Failed to update business settings');
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    const defaultSettings: InvoiceSettings = {
      prefix: 'INV',
      numberFormat: 'INV-YYYY-000001',
      nextNumber: 1,
      defaultPaymentTerms: 'Net 30',
      defaultDueDays: 30,
      defaultCurrency: 'INR',
      defaultTemplateId: 'tmpl-modern',
      notesFooter: 'Thank you for your business!',
    };
    return getStoredItem<InvoiceSettings>(STORAGE_KEYS.invoice, defaultSettings);
  }

  async updateInvoiceSettings(data: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
    const current = await this.getInvoiceSettings();
    const updated = { ...current, ...data };
    setStoredItem(STORAGE_KEYS.invoice, updated);
    return updated;
  }

  async getQuoteSettings(): Promise<QuoteSettings> {
    const defaultSettings: QuoteSettings = {
      prefix: 'QUO',
      numberFormat: 'QUO-YYYY-000001',
      nextNumber: 1,
      defaultValidityDays: 30,
      defaultTerms: 'Quotations valid for specified period.',
      defaultTemplateId: 'tmpl-modern',
    };
    return getStoredItem<QuoteSettings>(STORAGE_KEYS.quote, defaultSettings);
  }

  async updateQuoteSettings(data: Partial<QuoteSettings>): Promise<QuoteSettings> {
    const current = await this.getQuoteSettings();
    const updated = { ...current, ...data };
    setStoredItem(STORAGE_KEYS.quote, updated);
    return updated;
  }

  async getTaxSettings(): Promise<TaxSettings> {
    const defaultSettings: TaxSettings = {
      enableTax: true,
      defaultTaxType: 'GST',
      defaultGstRate: 18,
      customRates: [5, 12, 18, 28],
      businessState: 'Maharashtra',
      taxRegistrationStatus: 'Registered',
    };
    return getStoredItem<TaxSettings>(STORAGE_KEYS.tax, defaultSettings);
  }

  async updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings> {
    const current = await this.getTaxSettings();
    const updated = { ...current, ...data };
    setStoredItem(STORAGE_KEYS.tax, updated);
    return updated;
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const defaultSettings: PaymentSettings = {
      methods: {
        cash: true,
        upi: true,
        bankTransfer: true,
        creditCard: true,
        cheque: true,
        other: true,
      },
      bankDetails: {
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branch: '',
      },
      upiId: '',
      paymentInstructions: 'Payment due within invoice terms.',
    };
    return getStoredItem<PaymentSettings>(STORAGE_KEYS.payment, defaultSettings);
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const current = await this.getPaymentSettings();
    const updated: PaymentSettings = {
      ...current,
      ...data,
      methods: { ...current.methods, ...(data.methods || {}) },
      bankDetails: { ...current.bankDetails, ...(data.bankDetails || {}) },
    };
    setStoredItem(STORAGE_KEYS.payment, updated);
    return updated;
  }

  async getExpenseCategories(): Promise<ExpenseCategorySetting[]> {
    const defaultCategories: ExpenseCategorySetting[] = [
      { id: 'exp-cat-1', name: 'Software & Infrastructure', description: 'Cloud hosting, SaaS tools', enabled: true, isSystem: true },
      { id: 'exp-cat-2', name: 'Office Supplies', description: 'Stationery and supplies', enabled: true, isSystem: true },
      { id: 'exp-cat-3', name: 'Professional Fees', description: 'Legal and accounting', enabled: true, isSystem: true },
      { id: 'exp-cat-4', name: 'Marketing & Ads', description: 'Promotions and marketing', enabled: true, isSystem: true },
    ];
    return getStoredItem<ExpenseCategorySetting[]>(STORAGE_KEYS.expenses, defaultCategories);
  }

  async addExpenseCategory(name: string, description?: string): Promise<ExpenseCategorySetting> {
    const current = await this.getExpenseCategories();
    const newCat: ExpenseCategorySetting = {
      id: `exp-cat-${Date.now()}`,
      name,
      description,
      enabled: true,
      isSystem: false,
    };
    const updated = [...current, newCat];
    setStoredItem(STORAGE_KEYS.expenses, updated);
    return newCat;
  }

  async updateExpenseCategory(id: string, data: Partial<ExpenseCategorySetting>): Promise<ExpenseCategorySetting> {
    const current = await this.getExpenseCategories();
    const index = current.findIndex((c) => c.id === id);
    if (index === -1) {
      const newCat: ExpenseCategorySetting = {
        id,
        name: data.name || 'Category',
        description: data.description,
        enabled: data.enabled ?? true,
        isSystem: data.isSystem ?? false,
      };
      setStoredItem(STORAGE_KEYS.expenses, [...current, newCat]);
      return newCat;
    }
    current[index] = { ...current[index], ...data };
    setStoredItem(STORAGE_KEYS.expenses, current);
    return current[index];
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const defaultSettings: NotificationSettings = {
      emailNotifications: {
        invoiceSent: true,
        invoiceViewed: true,
        invoicePaid: true,
        invoiceOverdue: true,
        paymentReceived: true,
        quoteAccepted: true,
        quoteExpiring: true,
        expenseAdded: true,
      },
      browserNotifications: true,
      reminderPreferences: {
        invoiceReminders: true,
        reminderDaysBeforeDue: 3,
        paymentReminders: true,
      },
    };
    return getStoredItem<NotificationSettings>(STORAGE_KEYS.notifications, defaultSettings);
  }

  async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const current = await this.getNotificationSettings();
    const updated: NotificationSettings = {
      ...current,
      ...data,
      emailNotifications: { ...current.emailNotifications, ...(data.emailNotifications || {}) },
      reminderPreferences: { ...current.reminderPreferences, ...(data.reminderPreferences || {}) },
    };
    setStoredItem(STORAGE_KEYS.notifications, updated);
    return updated;
  }

  async getTeamUsers(): Promise<TeamUser[]> {
    const defaultUsers: TeamUser[] = [
      {
        id: 'usr-owner-1',
        name: 'Admin Owner',
        email: 'admin@organization.com',
        role: 'Owner',
        status: 'Active',
        lastActive: 'Today at 10:00 AM',
        createdAt: new Date().toISOString(),
      },
    ];
    return getStoredItem<TeamUser[]>(STORAGE_KEYS.users, defaultUsers);
  }

  async inviteUser(input: InviteUserInput): Promise<TeamUser> {
    const current = await this.getTeamUsers();
    const now = new Date().toISOString();
    const newUser: TeamUser = {
      id: `user-${Date.now()}`,
      name: input.email.split('@')[0].replace('.', ' '),
      email: input.email,
      role: input.role,
      status: 'Invited',
      lastActive: 'Never',
      createdAt: now.split('T')[0],
    };
    const updated = [...current, newUser];
    setStoredItem(STORAGE_KEYS.users, updated);
    return newUser;
  }

  async updateUserRole(userId: string, role: TeamUser['role']): Promise<TeamUser> {
    const current = await this.getTeamUsers();
    const idx = current.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    current[idx].role = role;
    setStoredItem(STORAGE_KEYS.users, current);
    return current[idx];
  }

  async updateUserStatus(userId: string, status: TeamUser['status']): Promise<TeamUser> {
    const current = await this.getTeamUsers();
    const idx = current.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    current[idx].status = status;
    setStoredItem(STORAGE_KEYS.users, current);
    return current[idx];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const current = await this.getTeamUsers();
    const updated = current.filter((u) => u.id !== userId);
    setStoredItem(STORAGE_KEYS.users, updated);
    return true;
  }
}
