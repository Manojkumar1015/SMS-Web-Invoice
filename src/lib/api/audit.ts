import { AuditEvent, AuditAction } from '@/types/audit';
import { logger } from './logger';

export function logAuditEvent(
  organizationId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
): AuditEvent {
  const event: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  };

  logger.info(`[AUDIT] ${action} on ${entityType}:${entityId}`, {
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    metadata,
  });

  return event;
}
