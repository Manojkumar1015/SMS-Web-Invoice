import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { InvoiceService } from '@/services/invoice/invoice.service';
import { validateRequestBody } from '@/lib/api/validation';
import { invoiceUpdateSchema } from '@/lib/api/invoiceValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new InvoiceService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const invoice = await service.getInvoiceById(context, params.id);
    return successResponse(invoice, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(invoiceUpdateSchema, rawBody);

    const updated = await service.updateInvoice(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteInvoice(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
