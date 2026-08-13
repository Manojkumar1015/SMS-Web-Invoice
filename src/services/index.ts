import { ICustomerService } from './interfaces/CustomerService';
import { IItemService } from './interfaces/ItemService';
import { IQuoteService } from './interfaces/QuoteService';
import { IInvoiceService } from './interfaces/InvoiceService';
import { IPaymentService } from './interfaces/PaymentService';
import { IExpenseService } from './interfaces/ExpenseService';
import { IReportService, IGlobalSearchService } from './interfaces/ReportService';
import { ITemplateService } from './interfaces/TemplateService';
import { ISettingsService } from './interfaces/SettingsService';

import { SupabaseCustomerService } from './supabase/SupabaseCustomerService';
import { SupabaseItemService } from './supabase/SupabaseItemService';
import { SupabaseQuoteService } from './supabase/SupabaseQuoteService';
import { SupabaseInvoiceService } from './supabase/SupabaseInvoiceService';
import { SupabasePaymentService } from './supabase/SupabasePaymentService';
import { SupabaseExpenseService } from './supabase/SupabaseExpenseService';
import { SupabaseReportService, SupabaseGlobalSearchService } from './supabase/SupabaseReportService';
import { SupabaseTemplateService } from './supabase/SupabaseTemplateService';
import { SupabaseSettingsService } from './supabase/SupabaseSettingsService';

// Central Service Registry (Production Web Cloud Backend)
export const customerService: ICustomerService = new SupabaseCustomerService();
export const itemService: IItemService = new SupabaseItemService();
export const quoteService: IQuoteService = new SupabaseQuoteService();
export const invoiceService: IInvoiceService = new SupabaseInvoiceService();
export const paymentService: IPaymentService = new SupabasePaymentService();
export const expenseService: IExpenseService = new SupabaseExpenseService();
export const reportService: IReportService = new SupabaseReportService();
export const globalSearchService: IGlobalSearchService = new SupabaseGlobalSearchService();
export const templateService: ITemplateService = new SupabaseTemplateService();
export const settingsService: ISettingsService = new SupabaseSettingsService();
