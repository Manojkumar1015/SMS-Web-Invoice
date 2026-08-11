import { IReportService, IGlobalSearchService } from '../interfaces/ReportService';
import { DashboardMetrics, RevenueChartPoint, ExpenseCategoryBreakdown, DateRangePeriod } from '@/types/report';
import { SearchResultItem } from '@/types/common';
import { mockDashboardMetrics, mockRevenueChartData, mockExpenseCategories } from '@/data/mockReports';
import { mockCustomers } from '@/data/mockCustomers';
import { mockInvoices } from '@/data/mockInvoices';
import { mockQuotes } from '@/data/mockQuotes';
import { mockItems } from '@/data/mockItems';
import { mockPayments } from '@/data/mockPayments';
import { mockExpenses } from '@/data/mockExpenses';

export class MockReportService implements IReportService {
  async getDashboardMetrics(_period?: DateRangePeriod): Promise<DashboardMetrics> {
    return { ...mockDashboardMetrics };
  }

  async getRevenueChartData(_period?: DateRangePeriod): Promise<RevenueChartPoint[]> {
    return [...mockRevenueChartData];
  }

  async getExpenseBreakdown(_period?: DateRangePeriod): Promise<ExpenseCategoryBreakdown[]> {
    return [...mockExpenseCategories];
  }
}

export class MockGlobalSearchService implements IGlobalSearchService {
  async search(query: string): Promise<SearchResultItem[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];

    // Search Customers
    mockCustomers.forEach((c) => {
      if (
        c.displayName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          title: c.displayName,
          subtitle: c.companyName || c.email,
          type: 'customer',
          url: `/app/customers/${c.id}`,
          status: c.status,
        });
      }
    });

    // Search Invoices
    mockInvoices.forEach((inv) => {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: inv.id,
          title: inv.invoiceNumber,
          subtitle: `${inv.customerName} • ₹${inv.total.toLocaleString('en-IN')}`,
          type: 'invoice',
          url: `/app/invoices/${inv.id}`,
          status: inv.status,
        });
      }
    });

    // Search Quotes
    mockQuotes.forEach((quo) => {
      if (
        quo.quoteNumber.toLowerCase().includes(q) ||
        quo.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: quo.id,
          title: quo.quoteNumber,
          subtitle: `${quo.customerName} • ₹${quo.total.toLocaleString('en-IN')}`,
          type: 'quote',
          url: `/app/quotes/${quo.id}`,
          status: quo.status,
        });
      }
    });

    // Search Items
    mockItems.forEach((item) => {
      if (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      ) {
        results.push({
          id: item.id,
          title: item.name,
          subtitle: `SKU: ${item.sku} • ₹${item.sellingPrice.toLocaleString('en-IN')}`,
          type: 'item',
          url: `/app/items`,
          status: item.status,
        });
      }
    });

    // Search Payments
    mockPayments.forEach((pay) => {
      if (
        pay.paymentNumber.toLowerCase().includes(q) ||
        pay.invoiceNumber.toLowerCase().includes(q) ||
        pay.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: pay.id,
          title: pay.paymentNumber,
          subtitle: `${pay.customerName} • ₹${pay.amount.toLocaleString('en-IN')} (${pay.paymentMethod.replace('_', ' ')})`,
          type: 'payment',
          url: `/app/payments`,
        });
      }
    });

    // Search Expenses
    mockExpenses.forEach((exp) => {
      if (
        exp.expenseNumber.toLowerCase().includes(q) ||
        exp.vendorName.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: exp.id,
          title: exp.expenseNumber,
          subtitle: `${exp.vendorName} • ${exp.category} • ₹${exp.amount.toLocaleString('en-IN')}`,
          type: 'expense',
          url: `/app/expenses`,
        });
      }
    });

    return results;
  }
}
