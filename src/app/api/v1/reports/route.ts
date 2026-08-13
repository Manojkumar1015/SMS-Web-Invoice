import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { ReportService } from '@/services/report/report.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new ReportService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const searchParams = request.nextUrl.searchParams;

  try {
    const context = await getAuthContext();
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const summary = await service.getDashboardSummary(context, startDate, endDate);
    const activity = await service.getRecentActivity(context);

    return successResponse(
      {
        summary,
        activity,
      },
      200,
      undefined,
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
