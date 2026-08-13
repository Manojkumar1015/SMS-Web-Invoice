import { IReportService, IGlobalSearchService } from '../interfaces/ReportService';
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
import { getDateRangeFromPreset } from '@/lib/dateRanges';
import { roundCurrency } from '@/lib/financial';

export class SupabaseReportService implements IReportService {
  private async fetchReportsData(startDate?: string, endDate?: string) {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);

    const res = await fetch(`/api/v1/reports?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch report metrics: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch reports data');
    }
    return json.data || {};
  }

  async getDashboardMetrics(period?: DateRangePreset): Promise<DashboardMetrics> {
    const range = getDateRangeFromPreset(period || 'this_month');
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const summary = data.summary || {};

    return {
      totalRevenue: summary.revenue || 0,
      revenueChange: 0,
      outstanding: summary.outstanding || 0,
      outstandingChange: 0,
      paymentsReceived: summary.received || 0,
      paymentsChange: 0,
      expenses: summary.expenses || 0,
      expensesChange: 0,
      netProfit: summary.netProfit || 0,
      netProfitChange: 0,
      invoicesCount: summary.invoiceCount || 0,
      customersCount: summary.customerCount || 0,
    };
  }

  async getRevenueChartData(period?: DateRangePreset): Promise<RevenueChartPoint[]> {
    const range = getDateRangeFromPreset(period || 'this_month');
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    return data.chartData || [];
  }

  async getExpenseBreakdown(period?: DateRangePreset): Promise<ExpenseCategoryBreakdown[]> {
    const range = getDateRangeFromPreset(period || 'this_month');
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    return detailed.expenseByCategory || [];
  }

  async getRevenueReport(filter?: DateFilter): Promise<RevenueReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const summary = data.summary || {};

    return {
      totalRevenue: summary.revenue || 0,
      paymentsReceived: summary.received || 0,
      outstanding: summary.outstanding || 0,
      chartData: data.chartData || [],
    };
  }

  async getInvoiceReport(filter?: DateFilter): Promise<InvoiceReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    const summary = data.summary || {};

    return {
      totalInvoices: summary.invoiceCount || 0,
      totalAmount: summary.revenue || 0,
      totalOutstanding: summary.outstanding || 0,
      byStatus: detailed.invoiceByStatus || [],
    };
  }

  async getPaymentReport(filter?: DateFilter): Promise<PaymentReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    const summary = data.summary || {};

    return {
      totalPayments: (detailed.paymentByMethod || []).reduce((acc: number, m: any) => acc + (m.count || 0), 0),
      totalReceived: summary.received || 0,
      unallocated: 0,
      partiallyAllocated: 0,
      byMethod: detailed.paymentByMethod || [],
    };
  }

  async getExpenseReport(filter?: DateFilter): Promise<ExpenseReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    const summary = data.summary || {};

    return {
      totalExpenses: summary.expenses || 0,
      customerExpenses: 0,
      businessExpenses: summary.expenses || 0,
      billableExpenses: 0,
      nonBillableExpenses: summary.expenses || 0,
      byCategory: detailed.expenseByCategory || [],
    };
  }

  async getProfitReport(filter?: DateFilter): Promise<ProfitReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const summary = data.summary || {};

    const rev = summary.revenue || 0;
    const exp = summary.expenses || 0;
    const net = summary.netProfit || 0;

    return {
      revenue: rev,
      expenses: exp,
      netProfit: net,
      profitMarginPercentage: rev > 0 ? roundCurrency((net / rev) * 100) : 0,
    };
  }

  async getCustomerReport(filter?: DateFilter): Promise<TopCustomerMetric[]> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    return detailed.customerReport || [];
  }

  async getTaxReport(filter?: DateFilter): Promise<TaxReportData> {
    const range = getDateRangeFromPreset(filter?.preset || 'this_month', filter?.startDate, filter?.endDate);
    const data = await this.fetchReportsData(range.startDate, range.endDate);
    const detailed = data.detailedReports || {};
    const taxRep = detailed.taxReport || {};

    return {
      taxableAmount: taxRep.taxableAmount || 0,
      cgstAmount: roundCurrency((taxRep.totalGst || 0) / 2),
      sgstAmount: roundCurrency((taxRep.totalGst || 0) / 2),
      igstAmount: 0,
      totalGst: taxRep.totalGst || 0,
      slabs: taxRep.slabs || [],
    };
  }
}

export class SupabaseGlobalSearchService implements IGlobalSearchService {
  async search(query: string): Promise<SearchResultItem[]> {
    if (!query || !query.trim()) return [];
    const res = await fetch(`/api/v1/reports/global-search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  }
}
