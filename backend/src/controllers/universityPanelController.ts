import { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import {
  getDynamicFieldSelect,
  mapDynamicFields,
  parseDynamicFields,
  syncDynamicFieldValues,
} from '../utils/dynamicFields';

type UniversityRow = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  user_id: string;
  estado: 'pendiente' | 'aprobado';
  dynamic_fields?: unknown;
  creado_en: Date;
  actualizado_en: Date;
};

type ProgramRow = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  modalidad: string;
  duracion: string;
  universidad_id: string;
  creado_por: string;
  actualizado_por?: string | null;
  fecha_actualizacion?: Date | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  aprobado_por: string | null;
  fecha_aprobacion: Date | null;
  rechazo_motivo?: string | null;
  rechazado_por?: string | null;
  fecha_rechazo?: Date | null;
  fuente_url?: string | null;
  fuente_nombre?: string | null;
  fecha_importacion?: Date | null;
  dynamic_fields?: unknown;
  creado_en: Date;
  actualizado_en: Date;
};

type ModerationAction = 'creado' | 'reenviado_revision' | 'actualizado';

const normalizeText = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizePrice = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
};

const publicUniversityFields = (university: UniversityRow) => ({
  id: university.id,
  nombre: university.nombre,
  descripcion: university.descripcion,
  ciudad: university.ciudad,
  userId: university.user_id,
  estado: university.estado,
  dynamicFields: mapDynamicFields(university.dynamic_fields),
  creadoEn: university.creado_en,
  actualizadoEn: university.actualizado_en,
});

const publicProgramFields = (program: ProgramRow) => ({
  id: program.id,
  nombre: program.nombre,
  descripcion: program.descripcion,
  precio: Number(program.precio),
  modalidad: program.modalidad,
  duracion: program.duracion,
  universidadId: program.universidad_id,
  creadoPor: program.creado_por,
  actualizadoPor: program.actualizado_por,
  fechaActualizacion: program.fecha_actualizacion,
  estado: program.estado,
  aprobadoPor: program.aprobado_por,
  fechaAprobacion: program.fecha_aprobacion,
  rechazoMotivo: program.rechazo_motivo,
  fechaRechazo: program.fecha_rechazo,
  fuenteUrl: program.fuente_url,
  fuenteNombre: program.fuente_nombre,
  fechaImportacion: program.fecha_importacion,
  dynamicFields: mapDynamicFields(program.dynamic_fields),
  creadoEn: program.creado_en,
  actualizadoEn: program.actualizado_en,
});

const insertProgramModerationHistory = async (
  client: PoolClient,
  payload: {
    programaId: string;
    estadoAnterior: ProgramRow['estado'] | null;
    estadoNuevo: ProgramRow['estado'];
    accion: ModerationAction;
    moderadoPor: string;
    actorRol?: string | null;
  }
) => {
  await client.query(
    `INSERT INTO program_moderation_history (
       programa_id,
       estado_anterior,
       estado_nuevo,
       motivo,
       moderado_por,
       actor_rol,
       accion
     )
     VALUES ($1, $2, $3, NULL, $4, $5, $6)`,
    [
      payload.programaId,
      payload.estadoAnterior,
      payload.estadoNuevo,
      payload.moderadoPor,
      payload.actorRol || null,
      payload.accion,
    ]
  );
};

const getOwnedUniversity = async (userId: string) => {
  const result = await query(
    `SELECT
       u.id,
       u.nombre,
       u.descripcion,
       u.ciudad,
       u.user_id,
       u.estado,
       u.creado_en,
       u.actualizado_en,
       ${getDynamicFieldSelect('universidad', 'u')} AS dynamic_fields
     FROM universidades u
     WHERE u.user_id = $1
     ORDER BY u.creado_en DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new AppError('No tienes una universidad asociada a tu cuenta', 404);
  }

  return result.rows[0] as UniversityRow;
};

const validateProgramPayload = (body: Record<string, unknown>) => {
  const nombre = normalizeText(body.nombre);
  const descripcion = normalizeText(body.descripcion);
  const modalidad = normalizeText(body.modalidad);
  const duracion = normalizeText(body.duracion);
  const precio = normalizePrice(body.precio);

  if (!nombre || !descripcion || !modalidad || !duracion) {
    throw new AppError('nombre, descripcion, modalidad y duracion son obligatorios', 400);
  }

  if (!Number.isFinite(precio) || precio < 0) {
    throw new AppError('precio debe ser un numero mayor o igual a 0', 400);
  }

  return {
    nombre,
    descripcion,
    modalidad,
    duracion,
    precio,
  };
};

export const getMyUniversity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const university = await getOwnedUniversity(req.user.id);

    return res.json({
      success: true,
      data: publicUniversityFields(university),
      university: publicUniversityFields(university),
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const university = await getOwnedUniversity(req.user.id);
    const result = await query(
      `SELECT
         p.id,
         p.nombre,
         p.descripcion,
         p.precio,
         p.modalidad,
         p.duracion,
         p.universidad_id,
         p.creado_por,
         p.actualizado_por,
         p.fecha_actualizacion,
         p.estado,
         p.aprobado_por,
         p.fecha_aprobacion,
         p.rechazo_motivo,
         p.fecha_rechazo,
         p.fuente_url,
         p.fuente_nombre,
         p.fecha_importacion,
         p.creado_en,
         p.actualizado_en,
         ${getDynamicFieldSelect('programa', 'p')} AS dynamic_fields
       FROM programas p
       INNER JOIN universidades u ON u.id = p.universidad_id
       WHERE u.user_id = $1
       ORDER BY
         CASE p.estado
           WHEN 'pendiente' THEN 1
           WHEN 'rechazado' THEN 2
           ELSE 3
         END,
         p.actualizado_en DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      university: publicUniversityFields(university),
      data: result.rows.map((program) => publicProgramFields(program as ProgramRow)),
      programas: result.rows.map((program) => publicProgramFields(program as ProgramRow)),
    });
  } catch (error) {
    return next(error);
  }
};

export const createMyProgram = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const university = await getOwnedUniversity(req.user.id);
    const payload = validateProgramPayload(req.body);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields) || [];

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `INSERT INTO programas (
         nombre, descripcion, precio, modalidad, duracion, universidad_id, creado_por, estado
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
         actualizado_por,
         fecha_actualizacion,
         estado,
         aprobado_por,
         fecha_aprobacion,
         rechazo_motivo,
         rechazado_por,
         fecha_rechazo,
         fuente_url,
         fuente_nombre,
         fecha_importacion,
         creado_en,
         actualizado_en`,
      [
        payload.nombre,
        payload.descripcion,
        payload.precio,
        payload.modalidad,
        payload.duracion,
        university.id,
        req.user.id,
      ]
    );

    const program = result.rows[0] as ProgramRow;
    await insertProgramModerationHistory(client, {
      programaId: program.id,
      estadoAnterior: null,
      estadoNuevo: program.estado,
      accion: 'creado',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    await syncDynamicFieldValues(client, 'programa', program.id, dynamicFields, 'university');

    const hydrated = await client.query(
      `SELECT
         p.id,
         p.nombre,
         p.descripcion,
         p.precio,
         p.modalidad,
         p.duracion,
         p.universidad_id,
         p.creado_por,
         p.actualizado_por,
         p.fecha_actualizacion,
         p.estado,
         p.aprobado_por,
         p.fecha_aprobacion,
         p.rechazo_motivo,
         p.rechazado_por,
         p.fecha_rechazo,
         p.fuente_url,
         p.fuente_nombre,
         p.fecha_importacion,
         p.creado_en,
         p.actualizado_en,
         ${getDynamicFieldSelect('programa', 'p')} AS dynamic_fields
       FROM programas p
       WHERE p.id = $1`,
      [program.id]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: 'Programa creado y enviado a revision',
      data: publicProgramFields(hydrated.rows[0] as ProgramRow),
      programa: publicProgramFields(hydrated.rows[0] as ProgramRow),
    });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const updateMyProgram = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const { id } = req.params;
    const payload = validateProgramPayload(req.body);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields);

    if (!isUuid(id)) {
      throw new AppError('id de programa invalido', 400);
    }

    const ownership = await query(
      `SELECT p.id, p.estado
       FROM programas p
       INNER JOIN universidades u ON u.id = p.universidad_id
       WHERE p.id = $1 AND u.user_id = $2
       LIMIT 1`,
      [id, req.user.id]
    );

    if (ownership.rowCount === 0) {
      throw new AppError('No tienes permisos para modificar este programa', 403);
    }

    const previousStatus = ownership.rows[0].estado as ProgramRow['estado'];

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `UPDATE programas
       SET nombre = $1,
           descripcion = $2,
           precio = $3,
           modalidad = $4,
           duracion = $5,
           estado = 'pendiente',
           aprobado_por = NULL,
           fecha_aprobacion = NULL,
           rechazo_motivo = NULL,
           rechazado_por = NULL,
           fecha_rechazo = NULL,
           actualizado_por = $7,
           fecha_actualizacion = NOW(),
           actualizado_en = NOW()
       WHERE id = $6
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         actualizado_por,
         fecha_actualizacion,
         estado,
         aprobado_por,
         fecha_aprobacion,
         rechazo_motivo,
         rechazado_por,
         fecha_rechazo,
         fuente_url,
         fuente_nombre,
         fecha_importacion,
         creado_en,
         actualizado_en`,
      [
        payload.nombre,
        payload.descripcion,
        payload.precio,
        payload.modalidad,
        payload.duracion,
        id,
        req.user.id,
      ]
    );

    if (result.rowCount === 0) {
      throw new AppError('Programa no encontrado', 404);
    }

    const updatedProgram = result.rows[0] as ProgramRow;
    await insertProgramModerationHistory(client, {
      programaId: updatedProgram.id,
      estadoAnterior: previousStatus,
      estadoNuevo: updatedProgram.estado,
      accion: previousStatus === 'pendiente' ? 'actualizado' : 'reenviado_revision',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    if (dynamicFields) {
      await syncDynamicFieldValues(client, 'programa', id, dynamicFields, 'university');
    }

    const hydrated = await client.query(
      `SELECT
         p.id,
         p.nombre,
         p.descripcion,
         p.precio,
         p.modalidad,
         p.duracion,
         p.universidad_id,
         p.creado_por,
         p.actualizado_por,
         p.fecha_actualizacion,
         p.estado,
         p.aprobado_por,
         p.fecha_aprobacion,
         p.rechazo_motivo,
         p.rechazado_por,
         p.fecha_rechazo,
         p.fuente_url,
         p.fuente_nombre,
         p.fecha_importacion,
         p.creado_en,
         p.actualizado_en,
         ${getDynamicFieldSelect('programa', 'p')} AS dynamic_fields
       FROM programas p
       WHERE p.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      success: true,
      message: 'Programa actualizado y enviado a revision',
      data: publicProgramFields(hydrated.rows[0] as ProgramRow),
      programa: publicProgramFields(hydrated.rows[0] as ProgramRow),
    });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const deleteMyProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const { id } = req.params;
    if (!isUuid(id)) {
      throw new AppError('id de programa invalido', 400);
    }

    const existing = await query('SELECT id FROM programas WHERE id = $1 LIMIT 1', [id]);
    if (existing.rowCount === 0) {
      throw new AppError('Programa no encontrado', 404);
    }

    const result = await query(
      `DELETE FROM programas p
       USING universidades u
       WHERE p.id = $1
         AND p.universidad_id = u.id
         AND u.user_id = $2
       RETURNING
         p.id,
         p.nombre,
         p.descripcion,
         p.precio,
         p.modalidad,
         p.duracion,
         p.universidad_id,
         p.creado_por,
         p.actualizado_por,
         p.fecha_actualizacion,
         p.estado,
         p.aprobado_por,
         p.fecha_aprobacion,
         p.rechazo_motivo,
         p.rechazado_por,
         p.fecha_rechazo,
         p.fuente_url,
         p.fuente_nombre,
         p.fecha_importacion,
         p.creado_en,
         p.actualizado_en`,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('No tienes permisos para eliminar este programa', 403);
    }

    return res.json({
      success: true,
      message: 'Programa eliminado',
      data: publicProgramFields(result.rows[0] as ProgramRow),
      programa: publicProgramFields(result.rows[0] as ProgramRow),
    });
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === '23503') {
      return next(new AppError('No se pudo eliminar el programa porque tiene informacion relacionada', 409));
    }
    return next(error);
  }
};
