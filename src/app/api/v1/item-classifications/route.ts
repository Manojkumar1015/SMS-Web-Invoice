import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { ClassificationService } from '@/services/classification/classification.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new ClassificationService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const searchParams = request.nextUrl.searchParams;

  try {
    await getAuthContext();
    const search = searchParams.get('search') || undefined;
    const type = (searchParams.get('type') as 'HSN' | 'SAC') || undefined;
    const category = searchParams.get('category') || undefined;

    const items = await service.listClassifications({ search, type, category });
    return successResponse(items, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
