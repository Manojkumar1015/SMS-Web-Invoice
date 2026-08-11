import { ICustomerService } from './interfaces/CustomerService';
import { IItemService } from './interfaces/ItemService';
import { IQuoteService } from './interfaces/QuoteService';
import { IInvoiceService } from './interfaces/InvoiceService';
import { IPaymentService } from './interfaces/PaymentService';
import { IExpenseService } from './interfaces/ExpenseService';
import { IReportService, IGlobalSearchService } from './interfaces/ReportService';

import { MockCustomerService } from './mock/MockCustomerService';
import { MockItemService } from './mock/MockItemService';
import { MockQuoteService } from './mock/MockQuoteService';
import { MockInvoiceService } from './mock/MockInvoiceService';
import { MockPaymentService } from './mock/MockPaymentService';
import { MockExpenseService } from './mock/MockExpenseService';
import { MockReportService, MockGlobalSearchService } from './mock/MockReportService';

// Central Service Registry (Currently bound to Mock implementations)
export const customerService: ICustomerService = new MockCustomerService();
export const itemService: IItemService = new MockItemService();
export const quoteService: IQuoteService = new MockQuoteService();
export const invoiceService: IInvoiceService = new MockInvoiceService();
export const paymentService: IPaymentService = new MockPaymentService();
export const expenseService: IExpenseService = new MockExpenseService();
export const reportService: IReportService = new MockReportService();
export const globalSearchService: IGlobalSearchService = new MockGlobalSearchService();
