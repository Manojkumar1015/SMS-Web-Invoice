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
import { createClient } from '@/lib/supabase/client';

export class SupabaseSettingsService implements ISettingsService {
  private fallbackMock = new MockSettingsService();

  async getBusinessSettings(): Promise<BusinessSettings> {
    try {
      const supabase = createClient();
      const { data: userRes } = await supabase.auth.getUser();

      if (userRes.user) {
        const { data: member } = await (supabase
          .from('organization_members' as any) as any)
          .select('organization_id')
          .eq('user_id', userRes.user.id)
          .maybeSingle();

        if (member?.organization_id) {
          const { data: org } = await (supabase
            .from('organizations' as any) as any)
            .select('*')
            .eq('id', member.organization_id)
            .single();

          if (org) {
            return {
              companyName: org.name,
              legalName: org.legal_name || org.name,
              email: org.email || '',
              phone: org.phone || '',
              website: org.website || '',
              address: org.address || '',
              city: org.city || '',
              state: org.state || '',
              postalCode: org.postal_code || '',
              country: org.country || 'India',
              gstin: org.gstin || '',
              pan: org.pan || '',
              currency: (org.currency as any) || 'INR',
              timezone: org.timezone || 'Asia/Kolkata',
              dateFormat: org.date_format || 'DD/MM/YYYY',
              timeFormat: '12-hour (hh:mm A)',
              logoUrl: org.logo_url || undefined,
            };
          }
        }
      }
    } catch {
      // Graceful fallback
    }
    return this.fallbackMock.getBusinessSettings();
  }

  async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    try {
      const supabase = createClient();
      const { data: userRes } = await supabase.auth.getUser();

      if (userRes.user) {
        const { data: member } = await (supabase
          .from('organization_members' as any) as any)
          .select('organization_id')
          .eq('user_id', userRes.user.id)
          .maybeSingle();

        if (member?.organization_id) {
          const updatePayload: Record<string, any> = {};
          if (data.companyName !== undefined) updatePayload.name = data.companyName;
          if (data.legalName !== undefined) updatePayload.legal_name = data.legalName;
          if (data.email !== undefined) updatePayload.email = data.email;
          if (data.phone !== undefined) updatePayload.phone = data.phone;
          if (data.website !== undefined) updatePayload.website = data.website;
          if (data.address !== undefined) updatePayload.address = data.address;
          if (data.city !== undefined) updatePayload.city = data.city;
          if (data.state !== undefined) updatePayload.state = data.state;
          if (data.postalCode !== undefined) updatePayload.postal_code = data.postalCode;
          if (data.country !== undefined) updatePayload.country = data.country;
          if (data.gstin !== undefined) updatePayload.gstin = data.gstin;
          if (data.pan !== undefined) updatePayload.pan = data.pan;
          if (data.currency !== undefined) updatePayload.currency = data.currency;
          if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
          if (data.dateFormat !== undefined) updatePayload.date_format = data.dateFormat;
          if (data.logoUrl !== undefined) updatePayload.logo_url = data.logoUrl;

          updatePayload.updated_at = new Date().toISOString();

          await (supabase.from('organizations' as any) as any).update(updatePayload).eq('id', member.organization_id);
          return this.getBusinessSettings();
        }
      }
    } catch {
      // Fallback
    }
    return this.fallbackMock.updateBusinessSettings(data);
  }

  // Delegated mock methods for remaining settings domains in Phase 6A
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
