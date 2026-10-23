import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

type NotificationRow = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  entidad_tipo: string | null;
  entidad_id: string | null;
  leida: boolean;
  fecha: Date;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const publicNotificationFields = (notification: NotificationRow) => ({
  id: notification.id,
  titulo: notification.titulo,
  mensaje: notification.mensaje,
  tipo: notification.tipo,
  entidadTipo: notification.entidad_tipo,
  entidadId: notification.entidad_id,
  leida: notification.leida,
  fecha: notification.fecha,
});

const parseLimit = (value: unknown) => {
  const parsed = Number(value || 20);
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
    const limit = parseLimit(req.query.limit);
    const params: unknown[] = [req.user.id];
    const conditions = ['user_id = $1'];

    if (unreadOnly) {
      conditions.push('leida = FALSE');
    }

    params.push(limit);
    const result = await query(
      `SELECT
         id,
         titulo,
         mensaje,
         tipo,
         entidad_tipo,
         entidad_id,
         leida,
         fecha
       FROM notifications
       WHERE ${conditions.join(' AND ')}
       ORDER BY fecha DESC
       LIMIT $${params.length}`,
      params
    );

    const notifications = result.rows.map((notification) =>
      publicNotificationFields(notification as NotificationRow)
    );

    return res.json({
      success: true,
      data: notifications,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND leida = FALSE`,
      [req.user.id]
    );

    return res.json({
      count: result.rows[0]?.count || 0,
    });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const { id } = req.params;
    if (!id || !isUuid(id)) {
      throw new AppError('id de notificacion invalido', 400);
    }

    const result = await query(
      `UPDATE notifications
       SET leida = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING
         id,
         titulo,
         mensaje,
         tipo,
         entidad_tipo,
         entidad_id,
         leida,
         fecha`,
      [id, req.user.id]
    );

    if (!result.rowCount) {
      throw new AppError('Notificacion no encontrada', 404);
    }

    const notification = publicNotificationFields(result.rows[0] as NotificationRow);
    return res.json({
      success: true,
      data: notification,
      notification,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `UPDATE notifications
       SET leida = TRUE
       WHERE user_id = $1 AND leida = FALSE`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rowCount || 0,
    });
  } catch (error) {
    return next(error);
  }
};
