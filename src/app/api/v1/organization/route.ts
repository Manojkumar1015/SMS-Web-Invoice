import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { OrganizationService } from '@/services/organization/organization.service';
import { validateRequestBody, organizationUpdateSchema } from '@/lib/api/validation';
import { successResponse, errorResponse } from '@/lib/api/response';

const orgService = new OrganizationService();

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const result = await orgService.getOrganization(context);
    return successResponse(result, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const rawBody = await request.json();
    const validatedData = validateRequestBody(organizationUpdateSchema, rawBody);

    const result = await orgService.updateOrganization(context, validatedData);
    return successResponse(result, 200, undefined, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
