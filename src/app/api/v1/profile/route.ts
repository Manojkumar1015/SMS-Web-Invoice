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

    console.log(`[GET /api/v1/profile] User ID: ${context.user.id}, Profile fetched:`, profile);

    const username = context.user.email.split('@')[0];
    const fullName = profile?.full_name || '';
    const phone = profile?.phone || '';
    const avatarUrl = profile?.avatar_url || '';

    return successResponse(
      {
        id: context.user.id,
        email: context.user.email,
        username,
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
    console.error(`[GET /api/v1/profile Error]:`, error);
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const supabase = createClient();
    const body = await request.json();

    console.log(`[PATCH /api/v1/profile] User ID: ${context.user.id}, Body:`, body);

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

    console.log(`[PATCH /api/v1/profile] Executing update for user ${context.user.id} with payload:`, updatePayload);

    let { data: updatedProfile, error: profileErr } = await (supabase.from('profiles' as any) as any)
      .update(updatePayload)
      .eq('id', context.user.id)
      .select()
      .maybeSingle();

    if (!updatedProfile && !profileErr) {
      console.log(`[PATCH /api/v1/profile] Profile row not found for update, executing upsert...`);
      const upsertRes = await (supabase.from('profiles' as any) as any)
        .upsert({
          id: context.user.id,
          ...updatePayload,
        })
        .select()
        .single();
      updatedProfile = upsertRes.data;
      profileErr = upsertRes.error;
    }

    if (profileErr) {
      console.error(`[PATCH /api/v1/profile] Supabase error:`, profileErr);
      throw new DatabaseError(`Failed to update profile: ${profileErr.message}`);
    }

    console.log(`[PATCH /api/v1/profile] Update success, result:`, updatedProfile);

    // 2. Update Auth Password if requested
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      const { error: pwdErr } = await supabase.auth.updateUser({
        password: data.newPassword.trim(),
      });
      if (pwdErr) {
        throw new ValidationError(`Password update failed: ${pwdErr.message}`);
      }
    }

    const username = context.user.email.split('@')[0];

    return successResponse(
      {
        id: context.user.id,
        email: context.user.email,
        username,
        fullName: updatedProfile?.full_name || '',
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
