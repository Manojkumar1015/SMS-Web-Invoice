import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { profileUpdateSchema } from '@/lib/api/profileValidation';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ValidationError, DatabaseError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const supabase = createClient();

    const { data: profile, error } = await (supabase.from('profiles' as any) as any)
      .select('*')
      .eq('id', context.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(`Failed to fetch profile: ${error.message}`);
    }

    const fullName = profile?.full_name || context.user.email.split('@')[0];
    const phone = profile?.phone || '';
    const avatarUrl = profile?.avatar_url || '';

    return successResponse(
      {
        id: context.user.id,
        email: context.user.email,
        fullName,
        phone,
        avatarUrl,
        organizationName: context.organization.name,
        role: context.membership.role,
      },
      200,
      undefined,
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const supabase = createClient();
    const body = await request.json();

    const parseResult = profileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = parseResult.data;

    // 1. Update Profile table
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone || null;
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl || null;

    const { data: updatedProfile, error: profileErr } = await (supabase.from('profiles' as any) as any)
      .upsert({
        id: context.user.id,
        ...updatePayload,
      })
      .select()
      .single();

    if (profileErr) {
      throw new DatabaseError(`Failed to update profile: ${profileErr.message}`);
    }

    // 2. Update Auth Password if requested
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      const { error: pwdErr } = await supabase.auth.updateUser({
        password: data.newPassword.trim(),
      });
      if (pwdErr) {
        throw new ValidationError(`Password update failed: ${pwdErr.message}`);
      }
    }

    return successResponse(
      {
        id: context.user.id,
        email: context.user.email,
        fullName: updatedProfile?.full_name || context.user.email.split('@')[0],
        phone: updatedProfile?.phone || '',
        avatarUrl: updatedProfile?.avatar_url || '',
        organizationName: context.organization.name,
        role: context.membership.role,
      },
      200,
      undefined,
      requestId
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
