import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { TemplateService } from '@/services/template/template.service';
import { validateRequestBody } from '@/lib/api/validation';
import { templateCreateSchema } from '@/lib/api/templateValidation';
import { successResponse, errorResponse } from '@/lib/api/response';

const service = new TemplateService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const templates = await service.listTemplates(context);
    return successResponse(templates, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validated = validateRequestBody(templateCreateSchema, rawBody);

    const created = await service.createTemplate(context, validated as any);
    return successResponse(created, 201, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
