import { DashboardMetrics, RevenueChartPoint, ExpenseCategoryBreakdown } from '@/types/report';

export const mockDashboardMetrics: DashboardMetrics = {
  totalRevenue: 1790000,
  revenueChange: 14.8,
  outstanding: 346300,
  outstandingChange: -5.2,
  paymentsReceived: 1365100,
  paymentsChange: 22.4,
  expenses: 103900,
  expensesChange: 3.1,
  netProfit: 1261200,
  netProfitChange: 18.2,
};

export const mockRevenueChartData: RevenueChartPoint[] = [
  { date: 'Sep 2025', revenue: 180000, expenses: 22000, netProfit: 158000 },
  { date: 'Oct 2025', revenue: 240000, expenses: 31000, netProfit: 209000 },
  { date: 'Nov 2025', revenue: 310000, expenses: 28000, netProfit: 282000 },
  { date: 'Dec 2025', revenue: 290000, expenses: 35000, netProfit: 255000 },
  { date: 'Jan 2026', revenue: 390000, expenses: 44000, netProfit: 346000 },
  { date: 'Feb 2026', revenue: 380000, expenses: 39000, netProfit: 341000 },
];

export const mockExpenseCategories: ExpenseCategoryBreakdown[] = [
  { category: 'Marketing & Ads', amount: 42000, percentage: 40.4 },
  { category: 'Software & Subscriptions', amount: 35000, percentage: 33.7 },
  { category: 'Travel & Lodging', amount: 18400, percentage: 17.7 },
  { category: 'Office Supplies', amount: 8500, percentage: 8.2 },
];
