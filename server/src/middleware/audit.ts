import type { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog.js';
import type { AuthRequest } from './auth.js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'CHECK_IN' | 'CHECK_OUT';
export type AuditEntity = 'Staff' | 'Leave' | 'Promotion' | 'Attendance' | 'User' | 'Payroll';

interface AuditOptions {
  action: AuditAction;
  entity: AuditEntity;
  getDocumentId: (req: AuthRequest) => string | null;
  getDescription: (req: AuthRequest) => string;
  getChanges?: (req: AuthRequest) => { before?: unknown; after?: unknown };
}

export function auditLog(options: AuditOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      res.json = originalJson;

      const documentId = options.getDocumentId(req) || 'unknown';
      const userId = req.user?.id;
      const description = options.getDescription(req);
      const changes = options.getChanges ? options.getChanges(req) : undefined;

      if (userId) {
        AuditLog.create({
          action: options.action,
          entity: options.entity,
          documentId, // Now accepts any string
          changedBy: userId,
          description,
          changes: changes || {},
          ipAddress: req.ip || req.socket.remoteAddress || '',
          timestamp: new Date(),
        }).catch(err => console.error('Audit log failed:', err));
      }

      return originalJson(body);
    };

    next();
  };
}

export async function createAuditEntry(
  action: AuditAction,
  entity: AuditEntity,
  documentId: string,
  userId: string,
  description: string,
  changes?: { before?: unknown; after?: unknown }
): Promise<void> {
  try {
    await AuditLog.create({
      action,
      entity,
      documentId, // Now accepts any string
      changedBy: userId,
      description,
      changes: changes || {},
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit entry:', error);
  }
}