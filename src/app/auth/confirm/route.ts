import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function ensureUserOrganization(supabase: ReturnType<typeof createClient>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Ensure Profile exists
    await (supabase.from('profiles' as any) as any).upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
      updated_at: new Date().toISOString(),
    });

    // 2. Check existing membership
    const { data: existingMember } = await (supabase
      .from('organization_members' as any) as any)
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingMember) {
      // 3. Create default organization from metadata or fallback
      const companyName =
        user.user_metadata?.company_name || `${user.email?.split('@')[0] || 'My'} Company`;

      const orgId = crypto.randomUUID();

      const { error: orgErr } = await (supabase
        .from('organizations' as any) as any)
        .insert({
          id: orgId,
          name: companyName,
          email: user.email,
        });

      if (!orgErr) {
        await (supabase.from('organization_members' as any) as any).insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });
      }
    }
  } catch (err) {
    console.error('Error during post-confirmation organization setup:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/home';

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('code');

  const supabase = createClient();

  // Handle Token Hash OTP Verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      await ensureUserOrganization(supabase);
      return NextResponse.redirect(redirectTo);
    }
  }

  // Handle PKCE Code Exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      await ensureUserOrganization(supabase);
      return NextResponse.redirect(redirectTo);
    }
  }

  // Invalid or expired token -> Redirect gracefully to login page with clear error message
  const errorRedirect = request.nextUrl.clone();
  errorRedirect.pathname = '/login';
  errorRedirect.searchParams.set('error', 'Confirmation link is invalid or expired. Please sign in.');
  return NextResponse.redirect(errorRedirect);
}
