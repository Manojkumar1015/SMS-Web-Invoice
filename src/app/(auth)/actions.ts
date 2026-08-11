'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

  // 1. Sign up user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create user account.' };
  }

  const userId = authData.user.id;

  // 2. Create User Profile
  const { error: profileError } = await (supabase.from('profiles' as any) as any).upsert({
    id: userId,
    full_name: email.split('@')[0],
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error('Profile creation error:', profileError);
  }

  // 3. Check if user already owns an organization
  const { data: existingMembership } = await (supabase
    .from('organization_members' as any) as any)
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingMembership) {
    // 4. Create Organization
    const { data: orgData, error: orgError } = await (supabase
      .from('organizations' as any) as any)
      .insert({
        name: companyName,
        email: email,
      })
      .select('id')
      .single();

    if (orgError || !orgData) {
      return { success: false, error: 'Failed to create organization record.' };
    }

    // 5. Create Owner Membership
    const { error: memberError } = await (supabase.from('organization_members' as any) as any).insert({
      organization_id: (orgData as any).id,
      user_id: userId,
      role: 'owner',
      status: 'active',
    });

    if (memberError) {
      console.error('Membership creation error:', memberError);
    }
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
