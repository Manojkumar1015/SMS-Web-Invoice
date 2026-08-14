import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { QuoteService } from '@/services/quote/quote.service';
import { validateRequestBody, validatePaginationParams, buildPaginationMeta, validateSortParams } from '@/lib/api/validation';
import { quoteCreateSchema } from '@/lib/api/quoteValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new QuoteService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const searchParams = request.nextUrl.searchParams;

  try {
    const context = await getAuthContext();

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const { page, pageSize } = validatePaginationParams({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    const { field: sortField, order: sortOrder } = validateSortParams(
      searchParams.get('sortField') || undefined,
      searchParams.get('sortOrder') || undefined,
      ['quote_number', 'created_at', 'updated_at', 'total', 'valid_until']
    );

    const { data, total } = await service.listQuotes(context, {
      search,
      status,
      customerId,
      page,
      pageSize,
      sortField,
      sortOrder,
    });

    const meta = buildPaginationMeta(page, pageSize, total);
    return successResponse(data, 200, meta, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(quoteCreateSchema, rawBody);

    const created = await service.createQuote(context, validated as any);
    return successResponse(created, 201, undefined, requestId);
  } catch (error) {
    console.error('[POST /api/v1/quotes] Error creating quote:', error);
    return errorResponse(error, requestId);
  }
}
