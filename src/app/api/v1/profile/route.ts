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
    // Phone must strictly load from profiles.phone and NEVER fallback to email
    const phone = profile?.phone || '';
    let avatarUrl = profile?.avatar_url || '';

    // Safety check: sanitize any legacy base64 data URL if present
    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
      avatarUrl = '';
    }

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

    const parseResult = profileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const data = parseResult.data;

    // Server-side safe diagnostic log (never logs passwords or base64 data)
    console.log(`[PATCH /api/v1/profile] Payload diagnostic:`, {
      fullName: data.fullName,
      phone: data.phone,
      avatarUrlPresent: Boolean(data.avatarUrl),
      passwordRequested: Boolean(data.newPassword && data.newPassword.trim().length >= 6),
    });

    // 1. Update Profile table
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.phone !== undefined) updatePayload.phone = data.phone ? data.phone.trim() : null;
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl || null;

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

    // 2. Sync ONLY small full_name to Supabase Auth metadata (keep avatar_url out of auth metadata)
    const authDataUpdate: Record<string, any> = {
      avatar_url: null, // Keep auth metadata small to avoid HTTP 431
    };
    if (data.fullName !== undefined) {
      authDataUpdate.full_name = data.fullName;
    }

    const authUpdatePayload: Record<string, any> = {
      data: authDataUpdate,
    };

    if (data.newPassword && data.newPassword.trim().length >= 6) {
      authUpdatePayload.password = data.newPassword.trim();
    }

    const { error: authErr } = await supabase.auth.updateUser(authUpdatePayload);
    if (authErr) {
      console.warn(`[PATCH /api/v1/profile] Supabase auth updateUser warning:`, authErr.message);
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
