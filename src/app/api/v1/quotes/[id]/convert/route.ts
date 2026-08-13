import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { QuoteService } from '@/services/quote/quote.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new QuoteService();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const invoiceId = await service.convertToInvoice(context, params.id);
    return successResponse({ converted: true, quoteId: params.id, invoiceId }, 201, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
