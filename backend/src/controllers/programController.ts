import { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { ROLES } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';
import {
  getDynamicFieldSelect,
  mapDynamicFields,
  parseDynamicFields,
  syncDynamicFieldValues,
} from '../utils/dynamicFields';

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

type ProgramStatus = 'pendiente' | 'aprobado' | 'rechazado';
type ModerationAction =
  | 'creado'
  | 'enviado_revision'
  | 'aprobado'
  | 'rechazado'
  | 'reenviado_revision'
  | 'actualizado';

type ProgramModerationHistoryRow = {
  id: string;
  programa_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  motivo: string | null;
  actor_rol: string | null;
  accion: string;
  fecha: Date;
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeNameForLookup = (value: unknown) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, ' ');

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizePrice = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
};

const parseSourceFields = (body: Record<string, unknown>) => {
  const fuenteUrl = normalizeText(body.fuente_url || body.fuenteUrl);
  const fuenteNombre = normalizeText(body.fuente_nombre || body.fuenteNombre);

  return {
    fuenteUrl,
    fuenteNombre,
    fechaImportacion: fuenteUrl ? new Date() : null,
  };
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

const publicModerationHistoryFields = (entry: ProgramModerationHistoryRow) => ({
  id: entry.id,
  programaId: entry.programa_id,
  estadoAnterior: entry.estado_anterior,
  estadoNuevo: entry.estado_nuevo,
  accion: entry.accion,
  motivo: entry.motivo,
  actorRol: entry.actor_rol,
  fecha: entry.fecha,
});

const insertProgramModerationHistory = async (
  client: PoolClient,
  payload: {
    programaId: string;
    estadoAnterior: ProgramStatus | string | null;
    estadoNuevo: ProgramStatus | string;
    accion: ModerationAction;
    motivo?: string | null;
    moderadoPor?: string | null;
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
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      payload.programaId,
      payload.estadoAnterior,
      payload.estadoNuevo,
      payload.motivo || null,
      payload.moderadoPor || null,
      payload.actorRol || null,
      payload.accion,
    ]
  );
};

const createProgramStatusNotification = async (
  client: PoolClient,
  program: ProgramRow,
  status: 'aprobado' | 'rechazado',
  rejectionReason?: string | null
) => {
  const ownerResult = await client.query(
    `SELECT user_id
     FROM universidades
     WHERE id = $1
     LIMIT 1`,
    [program.universidad_id]
  );

  const ownerUserId = ownerResult.rows[0]?.user_id as string | null | undefined;
  if (!ownerUserId) {
    return;
  }

  const isApproved = status === 'aprobado';
  const titulo = isApproved ? 'Programa aprobado' : 'Programa rechazado';
  const tipo = isApproved ? 'programa_aprobado' : 'programa_rechazado';
  const mensaje = isApproved
    ? `Tu programa "${program.nombre}" fue aprobado y ya puede aparecer publicado.`
    : `Tu programa "${program.nombre}" fue rechazado. Motivo: ${rejectionReason || 'No especificado'}`;

  await client.query(
    `INSERT INTO notifications (
       user_id,
       titulo,
       mensaje,
       tipo,
       entidad_tipo,
       entidad_id
     )
     VALUES ($1, $2, $3, $4, 'programa', $5)`,
    [ownerUserId, titulo, mensaje, tipo, program.id]
  );
};

export const createProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const nombre = normalizeText(req.body.nombre);
    const descripcion = normalizeText(req.body.descripcion);
    const modalidad = normalizeText(req.body.modalidad);
    const duracion = normalizeText(req.body.duracion);
    const universidadId = normalizeText(req.body.universidad_id || req.body.universidadId);
    const precio = normalizePrice(req.body.precio);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields) || [];
    const sourceFields = parseSourceFields(req.body);

    if (!nombre || !descripcion || !modalidad || !duracion || !universidadId) {
      throw new AppError('nombre, descripcion, modalidad, duracion y universidad_id son obligatorios', 400);
    }

    if (!Number.isFinite(precio) || precio < 0) {
      throw new AppError('precio debe ser un numero mayor o igual a 0', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const universityExists = await client.query('SELECT id FROM universidades WHERE id = $1 LIMIT 1', [universidadId]);
    if (universityExists.rowCount === 0) {
      throw new AppError('Universidad no encontrada', 404);
    }

    const duplicateResult = await client.query(
      `SELECT id, nombre
       FROM programas
       WHERE universidad_id = $1
         AND LOWER(REGEXP_REPLACE(TRIM(nombre), '\\s+', ' ', 'g')) = $2
       LIMIT 1`,
      [universidadId, normalizeNameForLookup(nombre)]
    );
    if (duplicateResult.rowCount && duplicateResult.rows[0]?.id) {
      throw new AppError(`Ya existe un programa con ese nombre para esta universidad: ${duplicateResult.rows[0].nombre}`, 409);
    }

    const result = await client.query(
      `INSERT INTO programas (
         nombre,
         descripcion,
         precio,
         modalidad,
         duracion,
         universidad_id,
         creado_por,
         estado,
         fuente_url,
         fuente_nombre,
         fecha_importacion
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8, $9, $10)
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
        nombre,
        descripcion,
        precio,
        modalidad,
        duracion,
        universidadId,
        req.user.id,
        sourceFields.fuenteUrl || null,
        sourceFields.fuenteNombre || null,
        sourceFields.fechaImportacion,
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

    await syncDynamicFieldValues(client, 'programa', program.id, dynamicFields);

    const hydratedResult = await client.query(
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
      message: 'Programa creado exitosamente y pendiente de aprobacion',
      programa: publicProgramFields(hydratedResult.rows[0] as ProgramRow),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return next(error);
  } finally {
    client.release();
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
         ${getDynamicFieldSelect('programa', 'programas')} AS dynamic_fields,
         creado_en,
         actualizado_en
       FROM programas AS programas
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

export const getApprovedProgramById = async (
  req: Request,
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
         ${getDynamicFieldSelect('programa', 'programas')} AS dynamic_fields,
         creado_en,
         actualizado_en
       FROM programas AS programas
       WHERE id = $1 AND estado = 'aprobado'
       LIMIT 1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    return res.json({
      programa: publicProgramFields(result.rows[0] as ProgramRow),
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
         ${getDynamicFieldSelect('programa', 'programas')} AS dynamic_fields,
         creado_en,
         actualizado_en
       FROM programas AS programas
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
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('id de programa requerido', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const currentResult = await client.query(
      `SELECT id, estado
       FROM programas
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!currentResult.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    const estadoAnterior = currentResult.rows[0].estado as ProgramStatus;
    const result = await client.query(
      `UPDATE programas
       SET
         estado = 'aprobado',
         aprobado_por = $1,
         fecha_aprobacion = NOW(),
         rechazo_motivo = NULL,
         rechazado_por = NULL,
         fecha_rechazo = NULL,
         actualizado_por = $1,
         fecha_actualizacion = NOW(),
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
      [req.user.id, id]
    );

    const program = result.rows[0] as ProgramRow;
    await insertProgramModerationHistory(client, {
      programaId: program.id,
      estadoAnterior,
      estadoNuevo: program.estado,
      accion: 'aprobado',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });
    await createProgramStatusNotification(client, program, 'aprobado');

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      message: 'Programa aprobado exitosamente',
      programa: publicProgramFields(program),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return next(error);
  } finally {
    client.release();
  }
};

export const changeProgramStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const estado = normalizeText(req.body.estado || req.body.status);
    const rechazoMotivo = normalizeText(req.body.rechazo_motivo || req.body.rechazoMotivo);

    if (!id) {
      throw new AppError('id de programa requerido', 400);
    }

    if (!['aprobado', 'rechazado'].includes(estado)) {
      throw new AppError('estado debe ser aprobado o rechazado', 400);
    }

    if (estado === 'rechazado' && !rechazoMotivo) {
      throw new AppError('rechazo_motivo es obligatorio al rechazar un programa', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const currentResult = await client.query(
      `SELECT id, estado
       FROM programas
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!currentResult.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    const estadoAnterior = currentResult.rows[0].estado as ProgramStatus;
    const result = await client.query(
      `UPDATE programas
       SET
         estado = $1,
         aprobado_por = CASE WHEN $1 = 'aprobado' THEN $2 ELSE NULL END,
         fecha_aprobacion = CASE WHEN $1 = 'aprobado' THEN NOW() ELSE NULL END,
         rechazo_motivo = CASE WHEN $1 = 'rechazado' THEN $4 ELSE NULL END,
         rechazado_por = CASE WHEN $1 = 'rechazado' THEN $2 ELSE NULL END,
         fecha_rechazo = CASE WHEN $1 = 'rechazado' THEN NOW() ELSE NULL END,
         actualizado_por = $2,
         fecha_actualizacion = NOW(),
         actualizado_en = NOW()
       WHERE id = $3
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
      [estado, req.user.id, id, rechazoMotivo]
    );

    const program = result.rows[0] as ProgramRow;
    await insertProgramModerationHistory(client, {
      programaId: program.id,
      estadoAnterior,
      estadoNuevo: program.estado,
      accion: estado === 'aprobado' ? 'aprobado' : 'rechazado',
      motivo: estado === 'rechazado' ? rechazoMotivo : null,
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });
    await createProgramStatusNotification(
      client,
      program,
      estado as 'aprobado' | 'rechazado',
      estado === 'rechazado' ? rechazoMotivo : null
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      message: 'Estado de programa actualizado',
      programa: publicProgramFields(program),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return next(error);
  } finally {
    client.release();
  }
};

export const updateProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const nombre = normalizeText(req.body.nombre);
    const descripcion = normalizeText(req.body.descripcion);
    const modalidad = normalizeText(req.body.modalidad);
    const duracion = normalizeText(req.body.duracion);
    const universidadId = normalizeText(req.body.universidad_id || req.body.universidadId);
    const estado = normalizeText(req.body.estado);
    const precio = normalizePrice(req.body.precio);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields);
    const sourceFields = parseSourceFields(req.body);
    const rechazoMotivo = normalizeText(req.body.rechazo_motivo || req.body.rechazoMotivo);

    if (!nombre || !descripcion || !modalidad || !duracion || !universidadId) {
      throw new AppError('nombre, descripcion, modalidad, duracion y universidad_id son obligatorios', 400);
    }

    if (!Number.isFinite(precio) || precio < 0) {
      throw new AppError('precio debe ser un numero mayor o igual a 0', 400);
    }

    if (estado && !['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      throw new AppError('estado invalido', 400);
    }

    if (estado === 'rechazado' && !rechazoMotivo) {
      throw new AppError('rechazo_motivo es obligatorio al rechazar un programa', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    await client.query('BEGIN');
    transactionStarted = true;

    const currentResult = await client.query(
      `SELECT id, estado
       FROM programas
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!currentResult.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    const estadoAnterior = currentResult.rows[0].estado as ProgramStatus;

    const result = await client.query(
      `UPDATE programas
       SET nombre = $1,
           descripcion = $2,
           precio = $3,
           modalidad = $4,
           duracion = $5,
           universidad_id = $6,
           estado = COALESCE(NULLIF($7, ''), estado),
           fuente_url = COALESCE($8, fuente_url),
           fuente_nombre = COALESCE($9, fuente_nombre),
           fecha_importacion = COALESCE($10, fecha_importacion),
           aprobado_por = CASE
             WHEN $7 = 'aprobado' THEN $12
             WHEN $7 IN ('rechazado', 'pendiente') THEN NULL
             ELSE aprobado_por
           END,
           fecha_aprobacion = CASE
             WHEN $7 = 'aprobado' THEN NOW()
             WHEN $7 IN ('rechazado', 'pendiente') THEN NULL
             ELSE fecha_aprobacion
           END,
           rechazo_motivo = CASE
             WHEN $7 = 'rechazado' THEN $11
             WHEN $7 IN ('aprobado', 'pendiente') THEN NULL
             ELSE rechazo_motivo
           END,
           rechazado_por = CASE
             WHEN $7 = 'rechazado' THEN $12
             WHEN $7 IN ('aprobado', 'pendiente') THEN NULL
             ELSE rechazado_por
           END,
           fecha_rechazo = CASE
             WHEN $7 = 'rechazado' THEN NOW()
             WHEN $7 IN ('aprobado', 'pendiente') THEN NULL
             ELSE fecha_rechazo
           END,
           actualizado_por = $12,
           fecha_actualizacion = NOW(),
           actualizado_en = NOW()
       WHERE id = $13
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
        nombre,
        descripcion,
        precio,
        modalidad,
        duracion,
        universidadId,
        estado,
        sourceFields.fuenteUrl || null,
        sourceFields.fuenteNombre || null,
        sourceFields.fechaImportacion,
        rechazoMotivo || null,
        req.user?.id || null,
        id,
      ]
    );

    if (!result.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    const updatedProgram = result.rows[0] as ProgramRow;
    const accion: ModerationAction =
      updatedProgram.estado === 'aprobado'
        ? 'aprobado'
        : updatedProgram.estado === 'rechazado'
          ? 'rechazado'
          : estadoAnterior !== 'pendiente'
            ? 'reenviado_revision'
            : 'actualizado';

    await insertProgramModerationHistory(client, {
      programaId: updatedProgram.id,
      estadoAnterior,
      estadoNuevo: updatedProgram.estado,
      accion,
      motivo: updatedProgram.estado === 'rechazado' ? updatedProgram.rechazo_motivo : null,
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    if (
      estadoAnterior !== updatedProgram.estado &&
      (updatedProgram.estado === 'aprobado' || updatedProgram.estado === 'rechazado')
    ) {
      await createProgramStatusNotification(
        client,
        updatedProgram,
        updatedProgram.estado,
        updatedProgram.rechazo_motivo
      );
    }

    if (dynamicFields) {
      await syncDynamicFieldValues(client, 'programa', id, dynamicFields);
    }

    const hydratedResult = await client.query(
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
      message: 'Programa actualizado exitosamente',
      programa: publicProgramFields(hydratedResult.rows[0] as ProgramRow),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return next(error);
  } finally {
    client.release();
  }
};

export const getProgramModerationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id || !isUuid(id)) {
      throw new AppError('id de programa invalido', 400);
    }

    if (!req.user?.id || !req.user.role) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const programExists = await query(
      `SELECT id
       FROM programas
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!programExists.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    if (req.user.role === ROLES.UNIVERSITY) {
      const ownership = await query(
        `SELECT p.id
         FROM programas p
         INNER JOIN universidades u ON u.id = p.universidad_id
         WHERE p.id = $1 AND u.user_id = $2
         LIMIT 1`,
        [id, req.user.id]
      );

      if (!ownership.rowCount) {
        throw new AppError('No tienes permisos para ver el historial de este programa', 403);
      }
    }

    const result = await query(
      `SELECT
         id,
         programa_id,
         estado_anterior,
         estado_nuevo,
         motivo,
         actor_rol,
         accion,
         fecha
       FROM program_moderation_history
       WHERE programa_id = $1
       ORDER BY fecha DESC`,
      [id]
    );

    const history = result.rows.map((entry) =>
      publicModerationHistoryFields(entry as ProgramModerationHistoryRow)
    );

    return res.json({
      success: true,
      data: history,
      history,
      historial: history,
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
