import { ReportRepository } from '@/repositories/report.repository';
import { AuthContext } from '@/lib/api/auth-context';

export class ReportService {
  private repo = new ReportRepository();

  async getDashboardSummary(context: AuthContext, startDate?: string, endDate?: string) {
    return this.repo.getDashboardSummary(context.organization.id, startDate, endDate);
  }

  async getRevenueChartData(context: AuthContext, startDate?: string, endDate?: string) {
    return this.repo.getRevenueChartData(context.organization.id, startDate, endDate);
  }

  async getDetailedReports(context: AuthContext, startDate?: string, endDate?: string) {
    return this.repo.getDetailedReports(context.organization.id, startDate, endDate);
  }

  async getRecentActivity(context: AuthContext) {
    return this.repo.getRecentActivity(context.organization.id);
  }

  async globalSearch(context: AuthContext, query: string) {
    return this.repo.globalSearch(context.organization.id, query);
  }
}
