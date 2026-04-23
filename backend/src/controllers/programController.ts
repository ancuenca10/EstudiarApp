import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

type ProgramRow = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  modalidad: string;
  duracion: string;
  universidad_id: string;
  creado_por: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  aprobado_por: string | null;
  fecha_aprobacion: Date | null;
  creado_en: Date;
  actualizado_en: Date;
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizePrice = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
};

const publicProgramFields = (program: ProgramRow) => ({
  id: program.id,
  nombre: program.nombre,
  descripcion: program.descripcion,
  precio: Number(program.precio),
  modalidad: program.modalidad,
  duracion: program.duracion,
  universidadId: program.universidad_id,
  creadoPor: program.creado_por,
  estado: program.estado,
  aprobadoPor: program.aprobado_por,
  fechaAprobacion: program.fecha_aprobacion,
  creadoEn: program.creado_en,
  actualizadoEn: program.actualizado_en,
});

export const createProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nombre = normalizeText(req.body.nombre);
    const descripcion = normalizeText(req.body.descripcion);
    const modalidad = normalizeText(req.body.modalidad);
    const duracion = normalizeText(req.body.duracion);
    const universidadId = normalizeText(req.body.universidad_id || req.body.universidadId);
    const precio = normalizePrice(req.body.precio);

    if (!nombre || !descripcion || !modalidad || !duracion || !universidadId) {
      throw new AppError('nombre, descripcion, modalidad, duracion y universidad_id son obligatorios', 400);
    }

    if (!Number.isFinite(precio) || precio < 0) {
      throw new AppError('precio debe ser un numero mayor o igual a 0', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `INSERT INTO programas (
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en`,
      [
        nombre,
        descripcion,
        precio,
        modalidad,
        duracion,
        universidadId,
        req.user.id,
      ]
    );

    return res.status(201).json({
      message: 'Programa creado exitosamente y pendiente de aprobacion',
      programa: publicProgramFields(result.rows[0] as ProgramRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const getApprovedPrograms = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en
       FROM programas
       WHERE estado = 'aprobado'
       ORDER BY fecha_aprobacion DESC NULLS LAST, creado_en DESC`
    );

    return res.json({
      programas: result.rows.map((program) => publicProgramFields(program as ProgramRow)),
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllProgramsForAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en
       FROM programas
       ORDER BY
         CASE estado
           WHEN 'pendiente' THEN 1
           WHEN 'aprobado' THEN 2
           ELSE 3
         END,
         creado_en DESC`
    );

    return res.json({
      programas: result.rows.map((program) => publicProgramFields(program as ProgramRow)),
    });
  } catch (error) {
    return next(error);
  }
};

export const approveProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('id de programa requerido', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const result = await query(
      `UPDATE programas
       SET
         estado = 'aprobado',
         aprobado_por = $1,
         fecha_aprobacion = NOW(),
         actualizado_en = NOW()
       WHERE id = $2
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en`,
      [req.user.id, id]
    );

    if (!result.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    return res.json({
      message: 'Programa aprobado exitosamente',
      programa: publicProgramFields(result.rows[0] as ProgramRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const nombre = normalizeText(req.body.nombre);
    const descripcion = normalizeText(req.body.descripcion);
    const modalidad = normalizeText(req.body.modalidad);
    const duracion = normalizeText(req.body.duracion);
    const universidadId = normalizeText(req.body.universidad_id || req.body.universidadId);
    const estado = normalizeText(req.body.estado);
    const precio = normalizePrice(req.body.precio);

    if (!nombre || !descripcion || !modalidad || !duracion || !universidadId) {
      throw new AppError('nombre, descripcion, modalidad, duracion y universidad_id son obligatorios', 400);
    }

    if (!Number.isFinite(precio) || precio < 0) {
      throw new AppError('precio debe ser un numero mayor o igual a 0', 400);
    }

    if (estado && !['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      throw new AppError('estado invalido', 400);
    }

    const result = await query(
      `UPDATE programas
       SET nombre = $1,
           descripcion = $2,
           precio = $3,
           modalidad = $4,
           duracion = $5,
           universidad_id = $6,
           estado = COALESCE(NULLIF($7, ''), estado),
           actualizado_en = NOW()
       WHERE id = $8
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en`,
      [nombre, descripcion, precio, modalidad, duracion, universidadId, estado, id]
    );

    if (!result.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    return res.json({
      message: 'Programa actualizado exitosamente',
      programa: publicProgramFields(result.rows[0] as ProgramRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM programas
       WHERE id = $1
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         aprobado_por,
         fecha_aprobacion,
         creado_en,
         actualizado_en`,
      [id]
    );

    if (!result.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    return res.json({
      message: 'Programa eliminado exitosamente',
      programa: publicProgramFields(result.rows[0] as ProgramRow),
    });
  } catch (error) {
    return next(error);
  }
};
