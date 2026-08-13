import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { TemplateService } from '@/services/template/template.service';
import { templateUpdateSchema } from '@/lib/api/templateValidation';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';

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
    const body = await request.json();

    const parseResult = templateUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const payload = {
      ...parseResult.data,
      description: parseResult.data.description || undefined,
    };

    const template = await service.updateTemplate(context, params.id, payload);
    return successResponse(template, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    await service.deleteTemplate(context, params.id);
    return successResponse({ success: true }, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
