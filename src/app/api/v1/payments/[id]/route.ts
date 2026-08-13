import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { PaymentService } from '@/services/payment/payment.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new PaymentService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const payment = await service.getPaymentById(context, params.id);
    return successResponse(payment, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deletePayment(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
