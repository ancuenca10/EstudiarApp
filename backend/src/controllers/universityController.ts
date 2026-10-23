import { NextFunction, Request, Response } from 'express';
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
  user_id: string | null;
  estado: 'pendiente' | 'aprobado';
  fuente_url?: string | null;
  fuente_nombre?: string | null;
  fecha_importacion?: Date | null;
  programas?: unknown;
  dynamic_fields?: unknown;
  programas_count?: string;
  creado_en: Date;
  actualizado_en: Date;
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const resolveUniversityOwnerId = async (value: unknown, fallbackUserId: string | null) => {
  const requestedUserId = normalizeText(value);
  if (!requestedUserId) return fallbackUserId;

  if (!isUuid(requestedUserId)) {
    throw new AppError('userId de universidad invalido', 400);
  }

  const result = await query('SELECT id, role FROM users WHERE id = $1 LIMIT 1', [requestedUserId]);
  if (result.rowCount === 0) {
    throw new AppError('El usuario indicado para la universidad no existe', 400);
  }

  if (result.rows[0].role !== 'UNIVERSITY') {
    throw new AppError('El usuario asociado a la universidad debe tener rol UNIVERSITY', 400);
  }

  return requestedUserId;
};

const normalizeDuplicateName = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const ensureUniversityIsUnique = async (nombre: string, excludeId?: string) => {
  const normalized = normalizeDuplicateName(nombre);
  const params: unknown[] = [normalized];
  const excludeClause = excludeId ? 'AND id <> $2' : '';
  if (excludeId) params.push(excludeId);

  const result = await query(
    `SELECT id, nombre
     FROM universidades
     WHERE LOWER(REGEXP_REPLACE(TRIM(nombre), '\\s+', ' ', 'g')) = $1
       ${excludeClause}
     LIMIT 1`,
    params
  );

  if (result.rowCount) {
    throw new AppError('Ya existe una universidad con este nombre', 409);
  }
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

const handleUniversityError = (error: unknown, next: NextFunction) => {
  const pgError = error as { code?: string };
  if (pgError.code === '23505') {
    return next(new AppError('Ya existe una universidad con estos datos', 409));
  }
  if (pgError.code === '23503') {
    return next(new AppError('No se puede eliminar la universidad porque tiene programas o informacion relacionada', 409));
  }
  return next(error);
};

const publicUniversityFields = (university: UniversityRow) => ({
  id: university.id,
  nombre: university.nombre,
  descripcion: university.descripcion,
  ciudad: university.ciudad,
  userId: university.user_id,
  estado: university.estado,
  fuenteUrl: university.fuente_url,
  fuenteNombre: university.fuente_nombre,
  fechaImportacion: university.fecha_importacion,
  programas: university.programas || [],
  dynamicFields: mapDynamicFields(university.dynamic_fields),
  programasCount: Number(university.programas_count || 0),
  creadoEn: university.creado_en,
  actualizadoEn: university.actualizado_en,
});

export const createUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const nombre = normalizeText(req.body.nombre || req.body.name);
    const descripcion = normalizeText(req.body.descripcion || req.body.description);
    const ciudad = normalizeText(req.body.ciudad || req.body.city);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields) || [];
    const sourceFields = parseSourceFields(req.body);

    if (!nombre || !descripcion || !ciudad) {
      throw new AppError('nombre, descripcion y ciudad son obligatorios', 400);
    }

    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const ownerUserId = await resolveUniversityOwnerId(
      req.body.userId || req.body.user_id,
      null
    );
    await ensureUniversityIsUnique(nombre);

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `INSERT INTO universidades (
         nombre, descripcion, ciudad, user_id, estado, fuente_url, fuente_nombre, fecha_importacion
       )
       VALUES ($1, $2, $3, $4, 'pendiente', $5, $6, $7)
       RETURNING
         id, nombre, descripcion, ciudad, user_id, estado,
         fuente_url, fuente_nombre, fecha_importacion,
         creado_en, actualizado_en`,
      [
        nombre,
        descripcion,
        ciudad,
        ownerUserId,
        sourceFields.fuenteUrl || null,
        sourceFields.fuenteNombre || null,
        sourceFields.fechaImportacion,
      ]
    );

    const university = result.rows[0] as UniversityRow;
    await syncDynamicFieldValues(client, 'universidad', university.id, dynamicFields);

    const hydratedResult = await client.query(
      `SELECT
         u.id,
         u.nombre,
         u.descripcion,
         u.ciudad,
         u.user_id,
         u.estado,
         u.fuente_url,
         u.fuente_nombre,
         u.fecha_importacion,
         u.creado_en,
         u.actualizado_en,
         ${getDynamicFieldSelect('universidad', 'u')} AS dynamic_fields
       FROM universidades u
       WHERE u.id = $1`,
      [university.id]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'Universidad creada exitosamente',
      universidad: publicUniversityFields(hydratedResult.rows[0] as UniversityRow),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return handleUniversityError(error, next);
  } finally {
    client.release();
  }
};

export const getUniversities = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.nombre,
         u.descripcion,
         u.ciudad,
         u.user_id,
         u.estado,
         u.fuente_url,
         u.fuente_nombre,
         u.fecha_importacion,
         u.creado_en,
         u.actualizado_en,
         ${getDynamicFieldSelect('universidad', 'u')} AS dynamic_fields,
         COUNT(p.id) FILTER (WHERE p.estado = 'aprobado') AS programas_count,
         COALESCE(
           json_agg(
             json_build_object(
               'id', p.id,
               'nombre', p.nombre,
               'descripcion', p.descripcion,
               'precio', p.precio,
               'modalidad', p.modalidad,
               'duracion', p.duracion,
               'estado', p.estado,
               'dynamicFields', ${getDynamicFieldSelect('programa', 'p')}
             )
             ORDER BY p.nombre
           ) FILTER (WHERE p.id IS NOT NULL AND p.estado = 'aprobado'),
           '[]'::json
         ) AS programas
       FROM universidades u
       LEFT JOIN programas p ON p.universidad_id = u.id
       GROUP BY u.id
       ORDER BY u.creado_en DESC`
    );

    return res.json({
      universidades: result.rows.map((university) =>
        publicUniversityFields(university as UniversityRow)
      ),
    });
  } catch (error) {
    return handleUniversityError(error, next);
  }
};

export const getUniversityById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.nombre,
         u.descripcion,
         u.ciudad,
         u.user_id,
         u.estado,
         u.fuente_url,
         u.fuente_nombre,
         u.fecha_importacion,
         u.creado_en,
         u.actualizado_en,
         ${getDynamicFieldSelect('universidad', 'u')} AS dynamic_fields,
         COUNT(p.id) FILTER (WHERE p.estado = 'aprobado') AS programas_count,
         COALESCE(
           json_agg(
             json_build_object(
               'id', p.id,
               'nombre', p.nombre,
               'descripcion', p.descripcion,
               'precio', p.precio,
               'modalidad', p.modalidad,
               'duracion', p.duracion,
               'estado', p.estado,
               'dynamicFields', ${getDynamicFieldSelect('programa', 'p')}
             )
             ORDER BY p.nombre
           ) FILTER (WHERE p.id IS NOT NULL AND p.estado = 'aprobado'),
           '[]'::json
         ) AS programas
       FROM universidades u
       LEFT JOIN programas p ON p.universidad_id = u.id
       WHERE u.id = $1 AND u.estado = 'aprobado'
       GROUP BY u.id
       LIMIT 1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      throw new AppError('Universidad no encontrada', 404);
    }

    return res.json({
      universidad: publicUniversityFields(result.rows[0] as UniversityRow),
    });
  } catch (error) {
    return handleUniversityError(error, next);
  }
};

export const updateUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const nombre = normalizeText(req.body.nombre || req.body.name);
    const descripcion = normalizeText(req.body.descripcion || req.body.description);
    const ciudad = normalizeText(req.body.ciudad || req.body.city);
    const estado = normalizeText(req.body.estado);
    const dynamicFields = parseDynamicFields(req.body.dynamicFields);
    const sourceFields = parseSourceFields(req.body);
    const ownerUserId = req.body.userId !== undefined || req.body.user_id !== undefined
      ? await resolveUniversityOwnerId(req.body.userId || req.body.user_id, null)
      : null;

    if (!nombre || !descripcion || !ciudad) {
      throw new AppError('nombre, descripcion y ciudad son obligatorios', 400);
    }

    if (estado && !['pendiente', 'aprobado'].includes(estado)) {
      throw new AppError('estado invalido', 400);
    }
    await ensureUniversityIsUnique(nombre, id);

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `UPDATE universidades
       SET nombre = $1,
           descripcion = $2,
           ciudad = $3,
           estado = COALESCE(NULLIF($4, ''), estado),
           user_id = COALESCE($5, user_id),
           fuente_url = COALESCE($6, fuente_url),
           fuente_nombre = COALESCE($7, fuente_nombre),
           fecha_importacion = COALESCE($8, fecha_importacion),
           actualizado_en = NOW()
       WHERE id = $9
       RETURNING
         id, nombre, descripcion, ciudad, user_id, estado,
         fuente_url, fuente_nombre, fecha_importacion,
         creado_en, actualizado_en`,
      [
        nombre,
        descripcion,
        ciudad,
        estado,
        ownerUserId,
        sourceFields.fuenteUrl || null,
        sourceFields.fuenteNombre || null,
        sourceFields.fechaImportacion,
        id,
      ]
    );

    if (!result.rowCount) {
      throw new AppError('Universidad no encontrada', 404);
    }

    if (dynamicFields) {
      await syncDynamicFieldValues(client, 'universidad', id, dynamicFields);
    }

    const hydratedResult = await client.query(
      `SELECT
         u.id,
         u.nombre,
         u.descripcion,
         u.ciudad,
         u.user_id,
         u.estado,
         u.fuente_url,
         u.fuente_nombre,
         u.fecha_importacion,
         u.creado_en,
         u.actualizado_en,
         ${getDynamicFieldSelect('universidad', 'u')} AS dynamic_fields
       FROM universidades u
       WHERE u.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      message: 'Universidad actualizada exitosamente',
      universidad: publicUniversityFields(hydratedResult.rows[0] as UniversityRow),
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    return handleUniversityError(error, next);
  } finally {
    client.release();
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

    const relatedPrograms = await query(
      'SELECT COUNT(*)::int AS total FROM programas WHERE universidad_id = $1',
      [id]
    );

    if (Number(relatedPrograms.rows[0]?.total || 0) > 0) {
      throw new AppError('No se puede eliminar la universidad porque tiene programas asociados', 409);
    }

    const result = await query(
      `DELETE FROM universidades
       WHERE id = $1
       RETURNING
         id, nombre, descripcion, ciudad, user_id, estado,
         fuente_url, fuente_nombre, fecha_importacion,
         creado_en, actualizado_en`,
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
    return handleUniversityError(error, next);
  }
};
