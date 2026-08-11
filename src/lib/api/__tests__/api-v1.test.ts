import { handleApiError, AppError, ValidationError, AuthenticationError, AuthorizationError } from '../errors';
import { validateRequestBody, organizationUpdateSchema, validatePaginationParams, validateSortParams } from '../validation';
import { requireRole } from '../auth-context';

export function runPhase6BApiTests() {
  const results: Array<{ test: string; passed: boolean; details?: string }> = [];

  // Test 1: ValidationError handling (422)
  try {
    const err = new ValidationError('Invalid payload', [{ field: 'email', message: 'Invalid email' }]);
    const handled = handleApiError(err);
    const passed = handled.statusCode === 422 && handled.body.error.code === 'VALIDATION_ERROR';
    results.push({ test: 'ValidationError maps to 422 JSON response', passed });
  } catch (e: any) {
    results.push({ test: 'ValidationError maps to 422 JSON response', passed: false, details: e.message });
  }

  // Test 2: AuthenticationError handling (401)
  try {
    const err = new AuthenticationError();
    const handled = handleApiError(err);
    const passed = handled.statusCode === 401 && handled.body.error.code === 'UNAUTHENTICATED';
    results.push({ test: 'AuthenticationError maps to 401 JSON response', passed });
  } catch (e: any) {
    results.push({ test: 'AuthenticationError maps to 401 JSON response', passed: false, details: e.message });
  }

  // Test 3: AuthorizationError handling (403)
  try {
    const err = new AuthorizationError();
    const handled = handleApiError(err);
    const passed = handled.statusCode === 403 && handled.body.error.code === 'FORBIDDEN';
    results.push({ test: 'AuthorizationError maps to 403 JSON response', passed });
  } catch (e: any) {
    results.push({ test: 'AuthorizationError maps to 403 JSON response', passed: false, details: e.message });
  }

  // Test 4: Zod Payload Validation - Valid Body
  try {
    const valid = validateRequestBody(organizationUpdateSchema, { companyName: 'Test Corp', email: 'test@corp.com' });
    const passed = valid.companyName === 'Test Corp' && valid.email === 'test@corp.com';
    results.push({ test: 'Zod accepts valid organization update payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid organization update payload', passed: false, details: e.message });
  }

  // Test 5: Zod Payload Validation - Invalid Body (Rejection)
  try {
    validateRequestBody(organizationUpdateSchema, { email: 'not-an-email' });
    results.push({ test: 'Zod rejects invalid email address payload', passed: false, details: 'Did not throw ValidationError' });
  } catch (e: any) {
    const passed = e instanceof ValidationError;
    results.push({ test: 'Zod rejects invalid email address payload', passed });
  }

  // Test 6: Role Authorization Guard - Success for Owner/Admin
  try {
    requireRole(['Owner', 'Admin'], 'Owner');
    requireRole(['Owner', 'Admin'], 'Admin');
    results.push({ test: 'Role guard allows Owner and Admin roles', passed: true });
  } catch (e: any) {
    results.push({ test: 'Role guard allows Owner and Admin roles', passed: false, details: e.message });
  }

  // Test 7: Role Authorization Guard - Rejection for Viewer/Staff
  try {
    requireRole(['Owner', 'Admin'], 'Viewer');
    results.push({ test: 'Role guard rejects Viewer role for admin operations', passed: false, details: 'Did not throw AuthorizationError' });
  } catch (e: any) {
    const passed = e instanceof AuthorizationError;
    results.push({ test: 'Role guard rejects Viewer role for admin operations', passed });
  }

  // Test 8: Pagination Capping (Max 100)
  try {
    const pag = validatePaginationParams({ page: '1', pageSize: '500' });
    const passed = pag.pageSize === 100 && pag.page === 1;
    results.push({ test: 'Pagination caps pageSize at maximum 100', passed });
  } catch (e: any) {
    results.push({ test: 'Pagination caps pageSize at maximum 100', passed: false, details: e.message });
  }

  // Test 9: Sort Allowlist Protection
  try {
    const sort = validateSortParams('malicious_column; DROP TABLE', 'desc', ['name', 'created_at']);
    const passed = sort.field === 'name' && sort.order === 'desc';
    results.push({ test: 'Sort validator enforces column allowlist', passed });
  } catch (e: any) {
    results.push({ test: 'Sort validator enforces column allowlist', passed: false, details: e.message });
  }

  return results;
}
