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
import { mockCustomers } from '@/data/mockCustomers';
import { mockInvoices } from '@/data/mockInvoices';
import { mockQuotes } from '@/data/mockQuotes';

export class MockReportService implements IReportService {
  async getDashboardMetrics(period: DateRangePreset = 'this_month'): Promise<DashboardMetrics> {
    return {
      totalRevenue: 1845000,
      revenueChange: 14.2,
      outstanding: 420000,
      outstandingChange: -5.1,
      paymentsReceived: 1425000,
      paymentsChange: 18.4,
      expenses: 385000,
      expensesChange: 2.3,
      netProfit: 1040000,
      netProfitChange: 22.8,
      invoicesCount: mockInvoices.length,
      customersCount: mockCustomers.length,
    };
  }

  async getRevenueChartData(period: DateRangePreset = 'this_month'): Promise<RevenueChartPoint[]> {
    return [
      { date: 'Oct 2025', revenue: 1200000, payments: 1100000, expenses: 320000, netProfit: 780000 },
      { date: 'Nov 2025', revenue: 1450000, payments: 1350000, expenses: 350000, netProfit: 1000000 },
      { date: 'Dec 2025', revenue: 1600000, payments: 1500000, expenses: 410000, netProfit: 1090000 },
      { date: 'Jan 2026', revenue: 1780000, payments: 1620000, expenses: 390000, netProfit: 1230000 },
      { date: 'Feb 2026', revenue: 1845000, payments: 1425000, expenses: 385000, netProfit: 1040000 },
    ];
  }

  async getExpenseBreakdown(period: DateRangePreset = 'this_month'): Promise<ExpenseCategoryBreakdown[]> {
    return [
      { category: 'Rent', amount: 85000, percentage: 22 },
      { category: 'Software & Cloud', amount: 65860, percentage: 17 },
      { category: 'Salary & Wages', amount: 150000, percentage: 39 },
      { category: 'Travel & Hospitality', amount: 34070, percentage: 9 },
      { category: 'Utilities & Power', amount: 21370, percentage: 6 },
      { category: 'Office & Admin', amount: 28700, percentage: 7 },
    ];
  }

  async getRevenueReport(filter?: DateFilter): Promise<RevenueReportData> {
    const chartData = await this.getRevenueChartData(filter?.preset);
    return {
      totalRevenue: 1845000,
      paymentsReceived: 1425000,
      outstanding: 420000,
      chartData,
    };
  }

  async getInvoiceReport(filter?: DateFilter): Promise<InvoiceReportData> {
    return {
      totalInvoices: 24,
      totalAmount: 2265000,
      totalOutstanding: 420000,
      byStatus: [
        { status: 'paid', count: 14, amount: 1425000, outstanding: 0 },
        { status: 'sent', count: 4, amount: 350000, outstanding: 350000 },
        { status: 'partially_paid', count: 2, amount: 180000, outstanding: 70000 },
        { status: 'draft', count: 3, amount: 210000, outstanding: 0 },
        { status: 'overdue', count: 1, amount: 100000, outstanding: 100000 },
      ],
    };
  }

  async getPaymentReport(filter?: DateFilter): Promise<PaymentReportData> {
    return {
      totalPayments: 18,
      totalReceived: 1425000,
      unallocated: 45000,
      partiallyAllocated: 80000,
      byMethod: [
        { method: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)', count: 10, amount: 950000 },
        { method: 'upi', label: 'UPI / QR Code', count: 5, amount: 280000 },
        { method: 'cheque', label: 'Cheque', count: 2, amount: 125000 },
        { method: 'credit_card', label: 'Credit / Debit Card', count: 1, amount: 70000 },
      ],
    };
  }

  async getExpenseReport(filter?: DateFilter): Promise<ExpenseReportData> {
    const byCategory = await this.getExpenseBreakdown(filter?.preset);
    return {
      totalExpenses: 385000,
      customerExpenses: 124000,
      businessExpenses: 261000,
      billableExpenses: 98000,
      nonBillableExpenses: 287000,
      byCategory,
    };
  }

  async getProfitReport(filter?: DateFilter): Promise<ProfitReportData> {
    const revenue = 1845000;
    const expenses = 385000;
    const netProfit = revenue - expenses;
    const profitMarginPercentage = Number(((netProfit / revenue) * 100).toFixed(1));

    return {
      revenue,
      expenses,
      netProfit,
      profitMarginPercentage,
    };
  }

  async getCustomerReport(filter?: DateFilter): Promise<TopCustomerMetric[]> {
    return [
      { id: 'cust-1', customerName: 'Acme Solutions Pvt Ltd', invoicesCount: 8, revenue: 850000, paid: 700000, outstanding: 150000, expenses: 34000, profitContribution: 816000 },
      { id: 'cust-2', customerName: 'TechCorp India Technologies', invoicesCount: 5, revenue: 520000, paid: 440000, outstanding: 80000, expenses: 19320, profitContribution: 500680 },
      { id: 'cust-3', customerName: 'Global Logistics Pvt Ltd', invoicesCount: 4, revenue: 310000, paid: 285000, outstanding: 25000, expenses: 12000, profitContribution: 298000 },
      { id: 'cust-4', customerName: 'Apex Enterprise Software', invoicesCount: 3, revenue: 165000, paid: 0, outstanding: 165000, expenses: 5000, profitContribution: 160000 },
    ];
  }

  async getTaxReport(filter?: DateFilter): Promise<TaxReportData> {
    return {
      taxableAmount: 1845000,
      cgstAmount: 83025,
      sgstAmount: 83025,
      igstAmount: 166050,
      totalGst: 332100,
      slabs: [
        { slabName: '18% Standard GST', rate: 18, taxableTurnover: 1500000, cgst: 67500, sgst: 67500, igst: 135000, totalGst: 270000 },
        { slabName: '12% Hardware Services', rate: 12, taxableTurnover: 290000, cgst: 15525, sgst: 15525, igst: 31050, totalGst: 62100 },
        { slabName: '5% Transport & Logistics', rate: 5, taxableTurnover: 55000, cgst: 0, sgst: 0, igst: 0, totalGst: 0 },
      ],
    };
  }
}

export class MockGlobalSearchService implements IGlobalSearchService {
  async search(query: string): Promise<SearchResultItem[]> {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();
    const results: SearchResultItem[] = [];

    mockCustomers.forEach((c) => {
      if (c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
        results.push({ id: c.id, title: c.displayName, subtitle: `${c.customerType.toUpperCase()} • ${c.email}`, type: 'customer', url: `/app/customers/${c.id}` });
      }
    });

    mockInvoices.forEach((i) => {
      if (i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)) {
        results.push({ id: i.id, title: i.invoiceNumber, subtitle: `${i.customerName} • ₹${i.total}`, type: 'invoice', url: `/app/invoices/${i.id}` });
      }
    });

    mockQuotes.forEach((qt) => {
      if (qt.quoteNumber.toLowerCase().includes(q) || qt.customerName.toLowerCase().includes(q)) {
        results.push({ id: qt.id, title: qt.quoteNumber, subtitle: `${qt.customerName} • ₹${qt.total}`, type: 'quote', url: `/app/quotes/${qt.id}` });
      }
    });

    return results;
  }
}
