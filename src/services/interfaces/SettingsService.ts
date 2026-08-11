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

export interface ISettingsService {
  getBusinessSettings(): Promise<BusinessSettings>;
  updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings>;

  getInvoiceSettings(): Promise<InvoiceSettings>;
  updateInvoiceSettings(data: Partial<InvoiceSettings>): Promise<InvoiceSettings>;

  getQuoteSettings(): Promise<QuoteSettings>;
  updateQuoteSettings(data: Partial<QuoteSettings>): Promise<QuoteSettings>;

  getTaxSettings(): Promise<TaxSettings>;
  updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings>;

  getPaymentSettings(): Promise<PaymentSettings>;
  updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings>;

  getExpenseCategories(): Promise<ExpenseCategorySetting[]>;
  addExpenseCategory(name: string, description?: string): Promise<ExpenseCategorySetting>;
  updateExpenseCategory(id: string, data: Partial<ExpenseCategorySetting>): Promise<ExpenseCategorySetting>;

  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings>;

  getTeamUsers(): Promise<TeamUser[]>;
  inviteUser(input: InviteUserInput): Promise<TeamUser>;
  updateUserRole(userId: string, role: TeamUser['role']): Promise<TeamUser>;
  updateUserStatus(userId: string, status: TeamUser['status']): Promise<TeamUser>;
  deleteUser(userId: string): Promise<boolean>;
}
