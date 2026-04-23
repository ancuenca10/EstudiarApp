import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

type FavoriteType = 'programa' | 'universidad';

type FavoriteRow = {
  id: string;
  user_id: string;
  tipo: FavoriteType;
  referencia_id: string;
  creado_en: Date;
  referencia_nombre: string | null;
  referencia_descripcion: string | null;
};

const normalizeFavoriteType = (tipo: unknown): FavoriteType | null => {
  if (tipo === 'programa' || tipo === 'program') {
    return 'programa';
  }

  if (tipo === 'universidad' || tipo === 'university') {
    return 'universidad';
  }

  return null;
};

const publicFavoriteFields = (favorite: FavoriteRow) => ({
  id: favorite.id,
  userId: favorite.user_id,
  tipo: favorite.tipo,
  referenciaId: favorite.referencia_id,
  creadoEn: favorite.creado_en,
  referencia: {
    id: favorite.referencia_id,
    nombre: favorite.referencia_nombre,
    descripcion: favorite.referencia_descripcion,
  },
});

const favoritesSelect = `
  SELECT
    f.id,
    f.user_id,
    f.tipo,
    f.referencia_id,
    f.creado_en,
    CASE
      WHEN f.tipo = 'programa' THEN p.nombre
      WHEN f.tipo = 'universidad' THEN u.nombre
    END AS referencia_nombre,
    CASE
      WHEN f.tipo = 'programa' THEN p.descripcion
      WHEN f.tipo = 'universidad' THEN u.descripcion
    END AS referencia_descripcion
  FROM favoritos f
  LEFT JOIN programas p ON f.tipo = 'programa' AND f.referencia_id = p.id
  LEFT JOIN universidades u ON f.tipo = 'universidad' AND f.referencia_id = u.id
`;

export const createFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tipo = normalizeFavoriteType(req.body.tipo);
    const referenciaId = req.body.referencia_id || req.body.referenciaId;

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    if (!tipo || !referenciaId) {
      throw new AppError('tipo y referencia_id son obligatorios', 400);
    }

    const existsResult = await query(
      tipo === 'programa'
        ? 'SELECT id FROM programas WHERE id = $1 LIMIT 1'
        : 'SELECT id FROM universidades WHERE id = $1 LIMIT 1',
      [referenciaId]
    );

    if (!existsResult.rowCount) {
      throw new AppError('La referencia no existe', 404);
    }

    const insertResult = await query(
      `INSERT INTO favoritos (user_id, tipo, referencia_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tipo, referencia_id)
       DO UPDATE SET creado_en = favoritos.creado_en
       RETURNING id`,
      [req.user.id, tipo, referenciaId]
    );

    const result = await query(
      `${favoritesSelect}
       WHERE f.id = $1
       LIMIT 1`,
      [insertResult.rows[0].id]
    );

    return res.status(201).json({
      message: 'Favorito guardado exitosamente',
      favorito: publicFavoriteFields(result.rows[0] as FavoriteRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `${favoritesSelect}
       WHERE f.user_id = $1
       ORDER BY f.creado_en DESC`,
      [req.user.id]
    );

    return res.json({
      favoritos: result.rows.map((favorite) =>
        publicFavoriteFields(favorite as FavoriteRow)
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `DELETE FROM favoritos
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rowCount) {
      throw new AppError('Favorito no encontrado', 404);
    }

    return res.json({ message: 'Favorito eliminado exitosamente' });
  } catch (error) {
    return next(error);
  }
};
