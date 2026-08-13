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
    return {
      prefix: 'INV',
      numberFormat: 'INV-YYYY-000001',
      nextNumber: 1,
      defaultPaymentTerms: 'Net 30',
      defaultDueDays: 30,
      defaultCurrency: 'INR',
      defaultTemplateId: 'tmpl-modern',
      notesFooter: 'Thank you for your business!',
    };
  }

  async updateInvoiceSettings(data: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
    const current = await this.getInvoiceSettings();
    return { ...current, ...data };
  }

  async getQuoteSettings(): Promise<QuoteSettings> {
    return {
      prefix: 'QUO',
      numberFormat: 'QUO-YYYY-000001',
      nextNumber: 1,
      defaultValidityDays: 30,
      defaultTerms: 'Quotations valid for specified period.',
      defaultTemplateId: 'tmpl-modern',
    };
  }

  async updateQuoteSettings(data: Partial<QuoteSettings>): Promise<QuoteSettings> {
    const current = await this.getQuoteSettings();
    return { ...current, ...data };
  }

  async getTaxSettings(): Promise<TaxSettings> {
    return {
      enableTax: true,
      defaultTaxType: 'GST',
      defaultGstRate: 18,
      customRates: [5, 12, 18, 28],
      businessState: 'Maharashtra',
      taxRegistrationStatus: 'Registered',
    };
  }

  async updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings> {
    const current = await this.getTaxSettings();
    return { ...current, ...data };
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    return {
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
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const current = await this.getPaymentSettings();
    return { ...current, ...data };
  }

  async getExpenseCategories(): Promise<ExpenseCategorySetting[]> {
    return [
      { id: 'exp-cat-1', name: 'Software & Infrastructure', description: 'Cloud hosting, SaaS tools', enabled: true, isSystem: true },
      { id: 'exp-cat-2', name: 'Office Supplies', description: 'Stationery and supplies', enabled: true, isSystem: true },
      { id: 'exp-cat-3', name: 'Professional Fees', description: 'Legal and accounting', enabled: true, isSystem: true },
      { id: 'exp-cat-4', name: 'Marketing & Ads', description: 'Promotions and marketing', enabled: true, isSystem: true },
    ];
  }

  async addExpenseCategory(name: string, description?: string): Promise<ExpenseCategorySetting> {
    return {
      id: `exp-cat-${Date.now()}`,
      name,
      description,
      enabled: true,
      isSystem: false,
    };
  }

  async updateExpenseCategory(id: string, data: Partial<ExpenseCategorySetting>): Promise<ExpenseCategorySetting> {
    return {
      id,
      name: data.name || 'Category',
      description: data.description,
      enabled: data.enabled ?? true,
      isSystem: data.isSystem ?? false,
    };
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    return {
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
  }

  async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const current = await this.getNotificationSettings();
    return { ...current, ...data };
  }

  async getTeamUsers(): Promise<TeamUser[]> {
    return [];
  }

  async inviteUser(input: InviteUserInput): Promise<TeamUser> {
    const now = new Date().toISOString();
    return {
      id: `user-${Date.now()}`,
      name: input.email.split('@')[0],
      email: input.email,
      role: input.role,
      status: 'Invited',
      lastActive: now,
      createdAt: now,
    };
  }

  async updateUserRole(userId: string, role: TeamUser['role']): Promise<TeamUser> {
    const now = new Date().toISOString();
    return {
      id: userId,
      name: 'Team Member',
      email: 'member@organization.com',
      role,
      status: 'Active',
      lastActive: now,
      createdAt: now,
    };
  }

  async updateUserStatus(userId: string, status: TeamUser['status']): Promise<TeamUser> {
    const now = new Date().toISOString();
    return {
      id: userId,
      name: 'Team Member',
      email: 'member@organization.com',
      role: 'Staff',
      status,
      lastActive: now,
      createdAt: now,
    };
  }

  async deleteUser(_userId: string): Promise<boolean> {
    return true;
  }
}
