import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';
import { FIXED_ROLES, ROLES, type Role } from '../constants/roles';

type JwtPayload = {
  id: string;
  role: Role;
};

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const verificarToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    if (!decoded.id || !FIXED_ROLES.includes(decoded.role)) {
      return res.status(401).json({ error: 'Token invalido' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token invalido' });
    }

    return res.status(500).json({ error: 'Error validando token' });
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }

    return next();
  };
};

export const authenticateToken = verificarToken;

export const requireAdmin = authorizeRoles(
  ROLES.ADMIN,
  ROLES.SUPERADMIN
);
