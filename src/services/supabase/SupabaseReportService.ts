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

export class SupabaseReportService implements IReportService {
  async getDashboardMetrics(period?: DateRangePreset): Promise<DashboardMetrics> {
    const res = await fetch('/api/v1/reports', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch report metrics: ${res.statusText}`);
    }
    const json = await res.json();
    const summary = json.data?.summary || {};

    const totalRevenue = summary.revenue || 0;
    const paymentsReceived = summary.received || 0;
    const outstanding = summary.outstanding || 0;
    const expenses = summary.expenses || 0;
    const netProfit = summary.netProfit || 0;

    return {
      totalRevenue,
      revenueChange: 0,
      outstanding,
      outstandingChange: 0,
      paymentsReceived,
      paymentsChange: 0,
      expenses,
      expensesChange: 0,
      netProfit,
      netProfitChange: 0,
      invoicesCount: summary.invoiceCount || 0,
      customersCount: 0,
    };
  }

  async getRevenueChartData(period?: DateRangePreset): Promise<RevenueChartPoint[]> {
    const res = await fetch('/api/v1/reports', { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const summary = json.data?.summary || {};

    return [
      {
        date: new Date().toISOString().split('T')[0],
        revenue: summary.revenue || 0,
        payments: summary.received || 0,
        expenses: summary.expenses || 0,
        netProfit: summary.netProfit || 0,
      },
    ];
  }

  async getExpenseBreakdown(period?: DateRangePreset): Promise<ExpenseCategoryBreakdown[]> {
    return [];
  }

  async getRevenueReport(filter?: DateFilter): Promise<RevenueReportData> {
    const metrics = await this.getDashboardMetrics();
    return {
      totalRevenue: metrics.totalRevenue,
      paymentsReceived: metrics.paymentsReceived,
      outstanding: metrics.outstanding,
      chartData: await this.getRevenueChartData(),
    };
  }

  async getInvoiceReport(filter?: DateFilter): Promise<InvoiceReportData> {
    return {
      totalInvoices: 0,
      totalAmount: 0,
      totalOutstanding: 0,
      byStatus: [],
    };
  }

  async getPaymentReport(filter?: DateFilter): Promise<PaymentReportData> {
    return {
      totalPayments: 0,
      totalReceived: 0,
      unallocated: 0,
      partiallyAllocated: 0,
      byMethod: [],
    };
  }

  async getExpenseReport(filter?: DateFilter): Promise<ExpenseReportData> {
    return {
      totalExpenses: 0,
      customerExpenses: 0,
      businessExpenses: 0,
      billableExpenses: 0,
      nonBillableExpenses: 0,
      byCategory: [],
    };
  }

  async getProfitReport(filter?: DateFilter): Promise<ProfitReportData> {
    const metrics = await this.getDashboardMetrics();
    return {
      revenue: metrics.totalRevenue,
      expenses: metrics.expenses,
      netProfit: metrics.netProfit,
      profitMarginPercentage: metrics.totalRevenue > 0 ? (metrics.netProfit / metrics.totalRevenue) * 100 : 0,
    };
  }

  async getCustomerReport(filter?: DateFilter): Promise<TopCustomerMetric[]> {
    return [];
  }

  async getTaxReport(filter?: DateFilter): Promise<TaxReportData> {
    return {
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalGst: 0,
      slabs: [],
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
