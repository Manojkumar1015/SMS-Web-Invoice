import { NextRequest, NextResponse } from 'next/server';
import { GET as confirmGET } from '../confirm/route';

export async function GET(request: NextRequest) {
  return confirmGET(request);
}
