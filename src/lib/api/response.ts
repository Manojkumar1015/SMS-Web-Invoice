import { NextResponse } from 'next/server';
import { handleApiError } from './errors';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: PaginationMeta,
  requestId?: string
) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return NextResponse.json(body, { status: statusCode, headers });
}

export function errorResponse(error: unknown, requestId?: string) {
  const { statusCode, body } = handleApiError(error);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return NextResponse.json(body, { status: statusCode, headers });
}
