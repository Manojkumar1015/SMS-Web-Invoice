import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/api/auth-context';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ValidationError, DatabaseError } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    const context = await getAuthContext();
    const supabase = createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Only JPG, PNG, or WebP image files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ValidationError('File size must be 5MB or less');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `profiles/${context.user.id}/avatar-${Date.now()}.${fileExt}`;

    // Ensure avatars bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucket = buckets?.find((b) => b.name === 'avatars');
    if (!avatarBucket) {
      await supabase.storage.createBucket('avatars', { public: true }).catch(() => null);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error(`[POST /api/v1/profile/avatar Upload Error]:`, uploadErr);
      throw new DatabaseError(`Failed to upload avatar to storage: ${uploadErr.message}`);
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    return successResponse(
      {
        avatarUrl: publicUrl,
      },
      200,
      undefined,
      requestId
    );
  } catch (error) {
    console.error(`[POST /api/v1/profile/avatar Error]:`, error);
    return errorResponse(error, requestId);
  }
}
