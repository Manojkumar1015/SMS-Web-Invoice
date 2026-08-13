'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getURL } from '@/lib/utils/url';
import { ensureUserOrganization } from '@/lib/api/auth-context';


export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await ensureUserOrganization(supabase, data.user);
  }

  return { success: true };
}

export async function signupAction(formData: FormData) {
  const companyName = formData.get('companyName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!companyName || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }

  const supabase = createClient();
  const confirmationRedirectUrl = `${getURL()}/auth/confirm?next=/app/home`;

  // 1. Sign up user via Supabase Auth with company metadata & confirmation redirect
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        full_name: email.split('@')[0],
      },
      emailRedirectTo: confirmationRedirectUrl,
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create user account.' };
  }

  const userId = authData.user.id;
  const hasSession = !!authData.session;

  // 2. If email confirmation is disabled or immediate session exists, perform initial setup
  if (hasSession) {
    // Create Profile
    await (supabase.from('profiles' as any) as any).upsert({
      id: userId,
      full_name: email.split('@')[0],
      updated_at: new Date().toISOString(),
    });

    // Create Organization & Owner Membership
    const { data: existingMembership } = await (supabase
      .from('organization_members' as any) as any)
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingMembership) {
      const { data: orgData } = await (supabase.from('organizations' as any) as any)
        .insert({
          name: companyName,
          email: email,
        })
        .select('id')
        .single();

      if (orgData?.id) {
        await (supabase.from('organization_members' as any) as any).insert({
          organization_id: orgData.id,
          user_id: userId,
          role: 'owner',
          status: 'active',
        });
      }
    }

    return { success: true, requiresConfirmation: false };
  }

  // If email confirmation is required, setup will be completed instantaneously by /auth/confirm upon clicking email link
  return { success: true, requiresConfirmation: true };
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
