import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { TemplateService } from '@/services/template/template.service';
import { templateCreateSchema } from '@/lib/api/templateValidation';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';

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
    const body = await request.json();

    const parseResult = templateCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const payload = {
      ...parseResult.data,
      description: parseResult.data.description || undefined,
    };

    const template = await service.createTemplate(context, payload);
    return successResponse(template, 201, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
