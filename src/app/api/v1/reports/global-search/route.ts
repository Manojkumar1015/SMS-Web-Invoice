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
    const q = searchParams.get('q') || '';

    const results = await service.globalSearch(context, q);
    return successResponse(results, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
