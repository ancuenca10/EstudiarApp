import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

type UniversityRow = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  user_id: string;
  estado: 'pendiente' | 'aprobado';
  creado_en: Date;
  actualizado_en: Date;
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const publicUniversityFields = (university: UniversityRow) => ({
  id: university.id,
  nombre: university.nombre,
  descripcion: university.descripcion,
  ciudad: university.ciudad,
  userId: university.user_id,
  estado: university.estado,
  creadoEn: university.creado_en,
  actualizadoEn: university.actualizado_en,
});

export const createUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nombre = normalizeText(req.body.nombre || req.body.name);
    const descripcion = normalizeText(req.body.descripcion || req.body.description);
    const ciudad = normalizeText(req.body.ciudad || req.body.city);

    if (!nombre || !descripcion || !ciudad) {
      throw new AppError('nombre, descripcion y ciudad son obligatorios', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `INSERT INTO universidades (nombre, descripcion, ciudad, user_id, estado)
       VALUES ($1, $2, $3, $4, 'pendiente')
       RETURNING id, nombre, descripcion, ciudad, user_id, estado, creado_en, actualizado_en`,
      [nombre, descripcion, ciudad, req.user.id]
    );

    return res.status(201).json({
      message: 'Universidad creada exitosamente',
      universidad: publicUniversityFields(result.rows[0] as UniversityRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const getUniversities = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT id, nombre, descripcion, ciudad, user_id, estado, creado_en, actualizado_en
       FROM universidades
       ORDER BY creado_en DESC`
    );

    return res.json({
      universidades: result.rows.map((university) =>
        publicUniversityFields(university as UniversityRow)
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const nombre = normalizeText(req.body.nombre || req.body.name);
    const descripcion = normalizeText(req.body.descripcion || req.body.description);
    const ciudad = normalizeText(req.body.ciudad || req.body.city);
    const estado = normalizeText(req.body.estado);

    if (!nombre || !descripcion || !ciudad) {
      throw new AppError('nombre, descripcion y ciudad son obligatorios', 400);
    }

    if (estado && !['pendiente', 'aprobado'].includes(estado)) {
      throw new AppError('estado invalido', 400);
    }

    const result = await query(
      `UPDATE universidades
       SET nombre = $1,
           descripcion = $2,
           ciudad = $3,
           estado = COALESCE(NULLIF($4, ''), estado),
           actualizado_en = NOW()
       WHERE id = $5
       RETURNING id, nombre, descripcion, ciudad, user_id, estado, creado_en, actualizado_en`,
      [nombre, descripcion, ciudad, estado, id]
    );

    if (!result.rowCount) {
      throw new AppError('Universidad no encontrada', 404);
    }

    return res.json({
      message: 'Universidad actualizada exitosamente',
      universidad: publicUniversityFields(result.rows[0] as UniversityRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('id de universidad requerido', 400);
    }

    const result = await query(
      `DELETE FROM universidades
       WHERE id = $1
       RETURNING id, nombre, descripcion, ciudad, user_id, estado, creado_en, actualizado_en`,
      [id]
    );

    if (!result.rowCount) {
      throw new AppError('Universidad no encontrada', 404);
    }

    return res.json({
      message: 'Universidad eliminada exitosamente',
      universidad: publicUniversityFields(result.rows[0] as UniversityRow),
    });
  } catch (error) {
    return next(error);
  }
};
