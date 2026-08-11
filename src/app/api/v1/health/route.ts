import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    return successResponse(
      {
        status: 'ok',
        service: 'SMS Web Invoice SaaS API',
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
      200,
      undefined,
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
