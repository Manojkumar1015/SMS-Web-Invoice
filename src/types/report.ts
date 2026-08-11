export type DateRangePeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year';

export interface RevenueChartPoint {
  date: string;
  revenue: number;
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
  revenue: number;
  paid: number;
  outstanding: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number; // percentage
  outstanding: number;
  outstandingChange: number;
  paymentsReceived: number;
  paymentsChange: number;
  expenses: number;
  expensesChange: number;
  netProfit: number;
  netProfitChange: number;
}
