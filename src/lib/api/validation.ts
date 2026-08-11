import { z } from 'zod';
import { ValidationError } from './errors';
import { PaginationMeta } from './response';

export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: any): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new ValidationError('Invalid request payload', formattedErrors);
  }
  return result.data;
}

export function validatePaginationParams(params: {
  page?: string | number;
  pageSize?: string | number;
}): { page: number; pageSize: number } {
  let page = Number(params.page) || 1;
  let pageSize = Number(params.pageSize) || 25;

  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 25;
  if (pageSize > 100) pageSize = 100; // Cap max page size to 100

  return { page, pageSize };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return { page, pageSize, total, totalPages };
}

export function validateSortParams(
  sortField?: string,
  sortOrder?: string,
  allowedFields: string[] = ['created_at', 'name', 'updated_at']
): { field: string; order: 'asc' | 'desc' } {
  const field = sortField && allowedFields.includes(sortField) ? sortField : allowedFields[0];
  const order = sortOrder === 'desc' ? 'desc' : 'asc';
  return { field, order };
}

// Zod Schema for Business Profile Update (PATCH /api/v1/organization)
export const organizationUpdateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100).optional(),
  legalName: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  website: z.string().max(100).optional(),
  address: z.string().max(250).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
  gstin: z.string().max(15, 'GSTIN cannot exceed 15 characters').optional(),
  pan: z.string().max(10, 'PAN cannot exceed 10 characters').optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']).optional(),
  timezone: z.string().max(50).optional(),
  dateFormat: z.string().max(20).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});
