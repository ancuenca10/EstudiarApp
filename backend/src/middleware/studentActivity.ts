import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';
import { query } from '../config/db';
import { ROLES } from '../constants/roles';
import { logActivity, type StudentActivityAction } from '../services/studentService';

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

export const optionalStudentAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.user?.id) return next();

    const token = getBearerToken(req.headers.authorization);
    if (!token) return next();

    const decoded = jwt.verify(token, getJwtSecret()) as { id?: string; role?: string };
    if (!decoded.id || decoded.role !== ROLES.STUDENT) return next();

    const result = await query(
      `SELECT id
       FROM users
       WHERE id = $1 AND (role = $2 OR tipo_usuario = 'student')
       LIMIT 1`,
      [decoded.id, ROLES.STUDENT]
    );

    if (result.rowCount) {
      req.user = {
        id: decoded.id,
        role: ROLES.STUDENT,
      };
    }
  } catch {
    // Public routes should remain public if an optional token is missing, invalid, or expired.
  }

  return next();
};

export const logStudentActivity = (
  action: StudentActivityAction,
  refId?: string | ((req: Request) => string | null | undefined),
  metadata?: Record<string, unknown> | ((req: Request) => Record<string, unknown>)
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.user?.role === ROLES.STUDENT) {
        const resolvedRefId = typeof refId === 'function' ? refId(req) : refId;
        const resolvedMetadata = typeof metadata === 'function' ? metadata(req) : metadata;
        await logActivity(req.user.id, action, resolvedRefId || null, resolvedMetadata || {});
      }
    } catch {
      // Tracking must never block product usage.
    }

    return next();
  };
};
