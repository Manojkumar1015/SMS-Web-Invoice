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
import {
  mockBusinessSettings,
  mockInvoiceSettings,
  mockQuoteSettings,
  mockTaxSettings,
  mockPaymentSettings,
  mockExpenseCategories,
  mockNotificationSettings,
  mockTeamUsers,
} from '@/data/mockSettings';

export class MockSettingsService implements ISettingsService {
  private business: BusinessSettings = { ...mockBusinessSettings };
  private invoice: InvoiceSettings = { ...mockInvoiceSettings };
  private quote: QuoteSettings = { ...mockQuoteSettings };
  private tax: TaxSettings = { ...mockTaxSettings };
  private payment: PaymentSettings = JSON.parse(JSON.stringify(mockPaymentSettings));
  private categories: ExpenseCategorySetting[] = [...mockExpenseCategories];
  private notifications: NotificationSettings = JSON.parse(JSON.stringify(mockNotificationSettings));
  private users: TeamUser[] = [...mockTeamUsers];

  async getBusinessSettings(): Promise<BusinessSettings> {
    return { ...this.business };
  }

  async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    this.business = { ...this.business, ...data };
    return { ...this.business };
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    return { ...this.invoice };
  }

  async updateInvoiceSettings(data: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
    this.invoice = { ...this.invoice, ...data };
    return { ...this.invoice };
  }

  async getQuoteSettings(): Promise<QuoteSettings> {
    return { ...this.quote };
  }

  async updateQuoteSettings(data: Partial<QuoteSettings>): Promise<QuoteSettings> {
    this.quote = { ...this.quote, ...data };
    return { ...this.quote };
  }

  async getTaxSettings(): Promise<TaxSettings> {
    return { ...this.tax };
  }

  async updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings> {
    this.tax = { ...this.tax, ...data };
    return { ...this.tax };
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    return JSON.parse(JSON.stringify(this.payment));
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
    this.payment = {
      ...this.payment,
      ...data,
      methods: { ...this.payment.methods, ...(data.methods || {}) },
      bankDetails: { ...this.payment.bankDetails, ...(data.bankDetails || {}) },
    };
    return JSON.parse(JSON.stringify(this.payment));
  }

  async getExpenseCategories(): Promise<ExpenseCategorySetting[]> {
    return [...this.categories];
  }

  async addExpenseCategory(name: string, description?: string): Promise<ExpenseCategorySetting> {
    const newCat: ExpenseCategorySetting = {
      id: `cat-${Date.now()}`,
      name,
      description,
      enabled: true,
      isSystem: false,
    };
    this.categories.push(newCat);
    return newCat;
  }

  async updateExpenseCategory(id: string, data: Partial<ExpenseCategorySetting>): Promise<ExpenseCategorySetting> {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    this.categories[idx] = { ...this.categories[idx], ...data };
    return this.categories[idx];
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    return JSON.parse(JSON.stringify(this.notifications));
  }

  async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    this.notifications = {
      ...this.notifications,
      ...data,
      emailNotifications: { ...this.notifications.emailNotifications, ...(data.emailNotifications || {}) },
      reminderPreferences: { ...this.notifications.reminderPreferences, ...(data.reminderPreferences || {}) },
    };
    return JSON.parse(JSON.stringify(this.notifications));
  }

  async getTeamUsers(): Promise<TeamUser[]> {
    return [...this.users];
  }

  async inviteUser(input: InviteUserInput): Promise<TeamUser> {
    const newUser: TeamUser = {
      id: `user-${Date.now()}`,
      name: input.email.split('@')[0].replace('.', ' '),
      email: input.email,
      role: input.role,
      status: 'Invited',
      lastActive: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserRole(userId: string, role: TeamUser['role']): Promise<TeamUser> {
    const target = this.users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found');
    target.role = role;
    return target;
  }

  async updateUserStatus(userId: string, status: TeamUser['status']): Promise<TeamUser> {
    const target = this.users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found');
    target.status = status;
    return target;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const len = this.users.length;
    this.users = this.users.filter((u) => u.id !== userId);
    return this.users.length < len;
  }
}
