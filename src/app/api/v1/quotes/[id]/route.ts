import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { QuoteService } from '@/services/quote/quote.service';
import { validateRequestBody } from '@/lib/api/validation';
import { quoteUpdateSchema } from '@/lib/api/quoteValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new QuoteService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const quote = await service.getQuoteById(context, params.id);
    return successResponse(quote, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(quoteUpdateSchema, rawBody);

    const updated = await service.updateQuote(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteQuote(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
