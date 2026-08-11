import {
  DashboardMetrics,
  RevenueChartPoint,
  ExpenseCategoryBreakdown,
  DateRangePreset,
  DateFilter,
  RevenueReportData,
  InvoiceReportData,
  PaymentReportData,
  ExpenseReportData,
  ProfitReportData,
  TaxReportData,
  TopCustomerMetric,
} from '@/types/report';
import { SearchResultItem } from '@/types/common';

export interface IReportService {
  getDashboardMetrics(period?: DateRangePreset): Promise<DashboardMetrics>;
  getRevenueChartData(period?: DateRangePreset): Promise<RevenueChartPoint[]>;
  getExpenseBreakdown(period?: DateRangePreset): Promise<ExpenseCategoryBreakdown[]>;

  getRevenueReport(filter?: DateFilter): Promise<RevenueReportData>;
  getInvoiceReport(filter?: DateFilter): Promise<InvoiceReportData>;
  getPaymentReport(filter?: DateFilter): Promise<PaymentReportData>;
  getExpenseReport(filter?: DateFilter): Promise<ExpenseReportData>;
  getProfitReport(filter?: DateFilter): Promise<ProfitReportData>;
  getCustomerReport(filter?: DateFilter): Promise<TopCustomerMetric[]>;
  getTaxReport(filter?: DateFilter): Promise<TaxReportData>;
}

export interface IGlobalSearchService {
  search(query: string): Promise<SearchResultItem[]>;
}
