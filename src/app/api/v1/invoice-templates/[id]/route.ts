import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { TemplateService } from '@/services/template/template.service';
import { validateRequestBody } from '@/lib/api/validation';
import { templateUpdateSchema } from '@/lib/api/templateValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new TemplateService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const template = await service.getTemplateById(context, params.id);
    return successResponse(template, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(templateUpdateSchema, rawBody);

    const updated = await service.updateTemplate(context, params.id, validated as any);
    return successResponse(updated, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteTemplate(context, params.id);
    return successResponse({ deleted: true, id: params.id }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
