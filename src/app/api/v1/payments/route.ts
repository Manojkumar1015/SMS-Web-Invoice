import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { PaymentService } from '@/services/payment/payment.service';
import { validateRequestBody, validatePaginationParams, buildPaginationMeta, validateSortParams } from '@/lib/api/validation';
import { paymentCreateSchema } from '@/lib/api/paymentValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new PaymentService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const searchParams = request.nextUrl.searchParams;

  try {
    const context = await getAuthContext();

    const search = searchParams.get('search') || undefined;
    const invoiceId = searchParams.get('invoiceId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const { page, pageSize } = validatePaginationParams({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    const { field: sortField, order: sortOrder } = validateSortParams(
      searchParams.get('sortField') || undefined,
      searchParams.get('sortOrder') || undefined,
      ['payment_number', 'created_at', 'amount', 'payment_date']
    );

    const { data, total } = await service.listPayments(context, {
      search,
      invoiceId,
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
    const validated = validateRequestBody(paymentCreateSchema, rawBody);

    const created = await service.createPayment(context, validated as any);
    return successResponse(created, 201, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
