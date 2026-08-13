import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { ItemService } from '@/services/item/item.service';
import { validateRequestBody, validatePaginationParams, buildPaginationMeta, validateSortParams } from '@/lib/api/validation';
import { itemCreateSchema } from '@/lib/api/itemValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new ItemService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;
  const searchParams = request.nextUrl.searchParams;

  try {
    const context = await getAuthContext();

    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const isActiveParam = searchParams.get('is_active');
    const isActive = isActiveParam === 'false' ? false : true;

    const { page, pageSize } = validatePaginationParams({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    const { field: sortField, order: sortOrder } = validateSortParams(
      searchParams.get('sortField') || undefined,
      searchParams.get('sortOrder') || undefined,
      ['name', 'item_code', 'selling_price', 'category', 'created_at', 'updated_at']
    );

    const { data, total } = await service.listItems(context, {
      search,
      category,
      isActive,
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
    const validated = validateRequestBody(itemCreateSchema, rawBody);

    const created = await service.createItem(context, validated as any);
    return successResponse(created, 201, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
