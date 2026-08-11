export interface AuditEvent {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type AuditAction =
  | 'ORGANIZATION_UPDATED'
  | 'USER_INVITED'
  | 'USER_ROLE_CHANGED'
  | 'USER_REMOVED'
  | 'LOGIN_SUCCESSFUL'
  | 'LOGIN_FAILED';
