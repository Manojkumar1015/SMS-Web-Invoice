import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { CustomerService } from '@/services/customer/customer.service';
import { validateRequestBody } from '@/lib/api/validation';
import { customerUpdateSchema } from '@/lib/api/customerValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new CustomerService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const customer = await service.getCustomerById(context, params.id);
    return successResponse(customer, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(customerUpdateSchema, rawBody);

    const updated = await service.updateCustomer(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.archiveCustomer(context, params.id);
    return successResponse({ archived: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
