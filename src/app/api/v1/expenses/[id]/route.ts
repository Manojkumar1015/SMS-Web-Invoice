import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { ExpenseService } from '@/services/expense/expense.service';
import { validateRequestBody } from '@/lib/api/validation';
import { expenseUpdateSchema } from '@/lib/api/expenseValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new ExpenseService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const expense = await service.getExpenseById(context, params.id);
    return successResponse(expense, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(expenseUpdateSchema, rawBody);

    const updated = await service.updateExpense(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteExpense(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
