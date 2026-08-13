import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError, DatabaseError, NotFoundError } from './errors';
import { UserRole } from '@/types/settings';

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    legalName?: string;
    email?: string;
    gstin?: string;
    pan?: string;
    currency: string;
  };
  membership: {
    id: string;
    role: UserRole;
    status: string;
  };
}

export async function ensureUserOrganization(supabase: ReturnType<typeof createClient>, user: any) {
  if (!user) return null;

  // 1. Ensure Profile exists
  const { error: profileErr } = await (supabase.from('profiles' as any) as any).upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
    updated_at: new Date().toISOString(),
  });

  if (profileErr) {
    console.error('Diagnostic [ensureUserOrganization profileErr]:', {
      message: profileErr.message,
      code: profileErr.code,
      details: profileErr.details,
      hint: profileErr.hint,
    });
  }

  // 2. Check existing membership
  const { data: existingMembers, error: checkErr } = await (supabase
    .from('organization_members' as any) as any)
    .select('id, organization_id, role, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (checkErr) {
    console.error('Diagnostic [ensureUserOrganization checkErr]:', {
      message: checkErr.message,
      code: checkErr.code,
      details: checkErr.details,
      hint: checkErr.hint,
    });
    throw new DatabaseError('Failed to verify organization membership.');
  }

  if (existingMembers && existingMembers.length > 0) {
    return existingMembers[0];
  }

  // 3. Create default organization if user genuinely has no membership
  const companyName =
    user.user_metadata?.company_name || `${user.email?.split('@')[0] || 'My'} Company`;

  const orgId = crypto.randomUUID();

  // Insert organization with pre-generated UUID without .select() to avoid RLS SELECT policy check before membership exists
  const { error: orgInsertErr } = await (supabase
    .from('organizations' as any) as any)
    .insert({
      id: orgId,
      name: companyName,
      email: user.email,
    });

  if (orgInsertErr) {
    console.error('Diagnostic [ensureUserOrganization orgInsertErr]:', {
      message: orgInsertErr.message,
      code: orgInsertErr.code,
      details: orgInsertErr.details,
      hint: orgInsertErr.hint,
    });
    throw new DatabaseError('Failed to create organization.');
  }

  // Insert owner membership
  const { data: newMember, error: memberInsertErr } = await (supabase.from('organization_members' as any) as any)
    .insert({
      organization_id: orgId,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    })
    .select('id, organization_id, role, status')
    .single();

  if (memberInsertErr) {
    console.error('Diagnostic [ensureUserOrganization memberInsertErr]:', {
      message: memberInsertErr.message,
      code: memberInsertErr.code,
      details: memberInsertErr.details,
      hint: memberInsertErr.hint,
    });
    throw new DatabaseError('Failed to create owner membership.');
  }

  return newMember || null;

  return null;
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Active authentication session required.');
  }

  // 1. Query membership using robust limit(1) array check
  const { data: members, error: memberError } = await (supabase
    .from('organization_members' as any) as any)
    .select('id, organization_id, role, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (memberError) {
    console.error('Diagnostic [getAuthContext memberError]:', {
      message: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
    });
    throw new DatabaseError('Failed to fetch organization membership.');
  }

  let member = members && members.length > 0 ? members[0] : null;

  // If authenticated user does not have an organization membership, auto-provision default organization
  if (!member) {
    member = await ensureUserOrganization(supabase, user);
  }

  if (!member) {
    throw new AuthorizationError('User does not belong to an active organization.');
  }

  // 2. Query organization
  const { data: org, error: orgError } = await (supabase
    .from('organizations' as any) as any)
    .select('id, name, legal_name, email, gstin, pan, currency')
    .eq('id', member.organization_id)
    .single();

  if (orgError) {
    console.error('Diagnostic [getAuthContext orgError]:', {
      message: orgError.message,
      code: orgError.code,
      details: orgError.details,
      hint: orgError.hint,
    });
    throw new DatabaseError('Failed to fetch associated organization record.');
  }

  if (!org) {
    throw new NotFoundError('Associated organization record not found.');
  }

  // Normalize role
  const roleMap: Record<string, UserRole> = {
    owner: 'Owner',
    admin: 'Admin',
    accountant: 'Accountant',
    staff: 'Staff',
    viewer: 'Viewer',
  };

  const normalizedRole: UserRole = roleMap[member.role] || 'Viewer';

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    organization: {
      id: org.id,
      name: org.name,
      legalName: org.legal_name || org.name,
      email: org.email || '',
      gstin: org.gstin || '',
      pan: org.pan || '',
      currency: org.currency || 'INR',
    },
    membership: {
      id: member.id,
      role: normalizedRole,
      status: member.status,
    },
  };
}

export function requireRole(allowedRoles: UserRole[], currentRole: UserRole) {
  if (!allowedRoles.includes(currentRole)) {
    throw new AuthorizationError(
      `Role '${currentRole}' is not authorized to perform this operation. Allowed roles: [${allowedRoles.join(
        ', '
      )}].`
    );
  }
}
