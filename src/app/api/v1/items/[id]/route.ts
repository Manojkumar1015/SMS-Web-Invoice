import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { ItemService } from '@/services/item/item.service';
import { validateRequestBody } from '@/lib/api/validation';
import { itemUpdateSchema } from '@/lib/api/itemValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new ItemService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const item = await service.getItemById(context, params.id);
    return successResponse(item, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(itemUpdateSchema, rawBody);

    const updated = await service.updateItem(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteItem(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    console.error('[DELETE /api/v1/items/[id] ERROR]', error);
    return errorResponse(error, requestId);
  }
}
