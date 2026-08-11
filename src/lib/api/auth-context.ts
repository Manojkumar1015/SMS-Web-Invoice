import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError, NotFoundError } from './errors';
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

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Active authentication session required.');
  }

  // 1. Query membership
  const { data: member, error: memberError } = await (supabase
    .from('organization_members' as any) as any)
    .select('id, organization_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (memberError || !member) {
    throw new AuthorizationError('User does not belong to an active organization.');
  }

  // 2. Query organization
  const { data: org, error: orgError } = await (supabase
    .from('organizations' as any) as any)
    .select('id, name, legal_name, email, gstin, pan, currency')
    .eq('id', member.organization_id)
    .single();

  if (orgError || !org) {
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
