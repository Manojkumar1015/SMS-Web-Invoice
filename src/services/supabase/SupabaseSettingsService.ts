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
import { MockSettingsService } from '../mock/MockSettingsService';

export class SupabaseSettingsService implements ISettingsService {
  private fallbackMock = new MockSettingsService();

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
    } catch {
      // Fallback to mock service
    }
    return this.fallbackMock.getBusinessSettings();
  }

  async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    try {
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
    } catch {
      // Fallback
    }
    return this.fallbackMock.updateBusinessSettings(data);
  }

  // Delegated mock methods for remaining settings domains in Phase 6B
  getInvoiceSettings(): Promise<InvoiceSettings> {
    return this.fallbackMock.getInvoiceSettings();
  }
  updateInvoiceSettings(data: Partial<InvoiceSettings>): Promise<InvoiceSettings> {
    return this.fallbackMock.updateInvoiceSettings(data);
  }
  getQuoteSettings(): Promise<QuoteSettings> {
    return this.fallbackMock.getQuoteSettings();
  }
  updateQuoteSettings(data: Partial<QuoteSettings>): Promise<QuoteSettings> {
    return this.fallbackMock.updateQuoteSettings(data);
  }
  getTaxSettings(): Promise<TaxSettings> {
    return this.fallbackMock.getTaxSettings();
  }
  updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings> {
    return this.fallbackMock.updateTaxSettings(data);
  }
  getPaymentSettings(): Promise<PaymentSettings> {
    return this.fallbackMock.getPaymentSettings();
  }
  updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
    return this.fallbackMock.updatePaymentSettings(data);
  }
  getExpenseCategories(): Promise<ExpenseCategorySetting[]> {
    return this.fallbackMock.getExpenseCategories();
  }
  addExpenseCategory(name: string, description?: string): Promise<ExpenseCategorySetting> {
    return this.fallbackMock.addExpenseCategory(name, description);
  }
  updateExpenseCategory(id: string, data: Partial<ExpenseCategorySetting>): Promise<ExpenseCategorySetting> {
    return this.fallbackMock.updateExpenseCategory(id, data);
  }
  getNotificationSettings(): Promise<NotificationSettings> {
    return this.fallbackMock.getNotificationSettings();
  }
  updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return this.fallbackMock.updateNotificationSettings(data);
  }
  getTeamUsers(): Promise<TeamUser[]> {
    return this.fallbackMock.getTeamUsers();
  }
  inviteUser(input: InviteUserInput): Promise<TeamUser> {
    return this.fallbackMock.inviteUser(input);
  }
  updateUserRole(userId: string, role: TeamUser['role']): Promise<TeamUser> {
    return this.fallbackMock.updateUserRole(userId, role);
  }
  updateUserStatus(userId: string, status: TeamUser['status']): Promise<TeamUser> {
    return this.fallbackMock.updateUserStatus(userId, status);
  }
  deleteUser(userId: string): Promise<boolean> {
    return this.fallbackMock.deleteUser(userId);
  }
}
