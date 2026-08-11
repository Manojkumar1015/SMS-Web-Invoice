import { DashboardMetrics, RevenueChartPoint, ExpenseCategoryBreakdown, DateRangePeriod } from '@/types/report';
import { SearchResultItem } from '@/types/common';

export interface IReportService {
  getDashboardMetrics(period?: DateRangePeriod): Promise<DashboardMetrics>;
  getRevenueChartData(period?: DateRangePeriod): Promise<RevenueChartPoint[]>;
  getExpenseBreakdown(period?: DateRangePeriod): Promise<ExpenseCategoryBreakdown[]>;
}

export interface IGlobalSearchService {
  search(query: string): Promise<SearchResultItem[]>;
}
