export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export type DateRangePeriod = DateRangePreset;

export interface DateFilter {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  payments: number;
  expenses: number;
  netProfit: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopCustomerMetric {
  id: string;
  customerName: string;
  invoicesCount: number;
  revenue: number;
  paid: number;
  outstanding: number;
  expenses: number;
  profitContribution: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  outstanding: number;
  outstandingChange: number;
  paymentsReceived: number;
  paymentsChange: number;
  expenses: number;
  expensesChange: number;
  netProfit: number;
  netProfitChange: number;
  invoicesCount?: number;
  customersCount?: number;
}

export interface RevenueReportData {
  totalRevenue: number;
  paymentsReceived: number;
  outstanding: number;
  chartData: RevenueChartPoint[];
}

export interface InvoiceReportData {
  totalInvoices: number;
  totalAmount: number;
  totalOutstanding: number;
  byStatus: {
    status: string;
    count: number;
    amount: number;
    outstanding: number;
  }[];
}

export interface PaymentReportData {
  totalPayments: number;
  totalReceived: number;
  unallocated: number;
  partiallyAllocated: number;
  byMethod: {
    method: string;
    label: string;
    count: number;
    amount: number;
  }[];
}

export interface ExpenseReportData {
  totalExpenses: number;
  customerExpenses: number;
  businessExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  byCategory: ExpenseCategoryBreakdown[];
}

export interface ProfitReportData {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMarginPercentage: number;
}

export interface TaxReportData {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  slabs: {
    slabName: string;
    rate: number;
    taxableTurnover: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
  }[];
}
