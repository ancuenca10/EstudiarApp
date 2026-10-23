import { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import { ROLES, type Role } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';

type BecaStatus = 'pendiente' | 'aprobado' | 'rechazado';
type BecaAction = 'creado' | 'aprobado' | 'rechazado' | 'reenviado_revision' | 'actualizado';

type BecaRow = {
  id: string;
  universidad_id: string | null;
  universidad_nombre?: string | null;
  nombre: string;
  descripcion: string;
  requisitos: string | null;
  beneficios: string | null;
  porcentaje_cobertura: string | null;
  monto: string | null;
  moneda: string | null;
  fecha_inicio: Date | string | null;
  fecha_cierre: Date | string | null;
  enlace: string | null;
  estado: BecaStatus;
  rechazo_motivo: string | null;
  creado_por: string | null;
  actualizado_por: string | null;
  aprobado_por: string | null;
  rechazado_por: string | null;
  fecha_creacion: Date;
  fecha_actualizacion: Date | null;
  fecha_aprobacion: Date | null;
  fecha_rechazo: Date | null;
  fuente_url: string | null;
  fuente_nombre: string | null;
  fecha_importacion: Date | null;
};

type BecaHistoryRow = {
  id: string;
  beca_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  motivo: string | null;
  actor_rol: string | null;
  accion: string;
  fecha: Date;
};

const ADMIN_ROLES: Role[] = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR];

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const parseNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parseDateOrNull = (value: unknown) => {
  const text = normalizeText(value);
  return text || null;
};

const parsePayload = (body: Record<string, unknown>) => {
  const nombre = normalizeText(body.nombre);
  const descripcion = normalizeText(body.descripcion);
  const requisitos = normalizeText(body.requisitos) || null;
  const beneficios = normalizeText(body.beneficios) || null;
  const porcentajeCobertura = parseNumberOrNull(body.porcentajeCobertura ?? body.porcentaje_cobertura);
  const monto = parseNumberOrNull(body.monto);
  const moneda = normalizeText(body.moneda) || 'COP';
  const fechaInicio = parseDateOrNull(body.fechaInicio ?? body.fecha_inicio);
  const fechaCierre = parseDateOrNull(body.fechaCierre ?? body.fecha_cierre);
  const enlace = normalizeText(body.enlace) || null;
  const fuenteUrl = normalizeText(body.fuenteUrl ?? body.fuente_url) || null;
  const fuenteNombre = normalizeText(body.fuenteNombre ?? body.fuente_nombre) || null;

  if (!nombre || !descripcion) {
    throw new AppError('nombre y descripcion son obligatorios', 400);
  }

  if (porcentajeCobertura !== null && (!Number.isFinite(porcentajeCobertura) || porcentajeCobertura < 0 || porcentajeCobertura > 100)) {
    throw new AppError('porcentaje_cobertura debe estar entre 0 y 100', 400);
  }

  if (monto !== null && (!Number.isFinite(monto) || monto < 0)) {
    throw new AppError('monto debe ser mayor o igual a 0', 400);
  }

  if (fechaInicio && fechaCierre && new Date(fechaCierre) < new Date(fechaInicio)) {
    throw new AppError('fecha_cierre no puede ser menor a fecha_inicio', 400);
  }

  if (enlace) {
    try {
      new URL(enlace);
    } catch {
      throw new AppError('enlace debe ser una URL valida', 400);
    }
  }

  return {
    nombre,
    descripcion,
    requisitos,
    beneficios,
    porcentajeCobertura,
    monto,
    moneda,
    fechaInicio,
    fechaCierre,
    enlace,
    fuenteUrl,
    fuenteNombre,
    fechaImportacion: fuenteUrl ? new Date() : null,
  };
};

const publicBecaFields = (beca: BecaRow) => ({
  id: beca.id,
  universidadId: beca.universidad_id,
  universidadNombre: beca.universidad_nombre,
  nombre: beca.nombre,
  descripcion: beca.descripcion,
  requisitos: beca.requisitos,
  beneficios: beca.beneficios,
  porcentajeCobertura: beca.porcentaje_cobertura === null ? null : Number(beca.porcentaje_cobertura),
  monto: beca.monto === null ? null : Number(beca.monto),
  moneda: beca.moneda || 'COP',
  fechaInicio: beca.fecha_inicio,
  fechaCierre: beca.fecha_cierre,
  enlace: beca.enlace,
  estado: beca.estado,
  rechazoMotivo: beca.rechazo_motivo,
  fechaCreacion: beca.fecha_creacion,
  fechaActualizacion: beca.fecha_actualizacion,
  fechaAprobacion: beca.fecha_aprobacion,
  fechaRechazo: beca.fecha_rechazo,
  fuenteUrl: beca.fuente_url,
  fuenteNombre: beca.fuente_nombre,
  fechaImportacion: beca.fecha_importacion,
});

const publicHistoryFields = (entry: BecaHistoryRow) => ({
  id: entry.id,
  becaId: entry.beca_id,
  estadoAnterior: entry.estado_anterior,
  estadoNuevo: entry.estado_nuevo,
  accion: entry.accion,
  motivo: entry.motivo,
  actorRol: entry.actor_rol,
  fecha: entry.fecha,
});

const selectBecaSql = `
  SELECT
    b.id,
    b.universidad_id,
    u.nombre AS universidad_nombre,
    b.nombre,
    b.descripcion,
    b.requisitos,
    b.beneficios,
    b.porcentaje_cobertura,
    b.monto,
    b.moneda,
    b.fecha_inicio,
    b.fecha_cierre,
    b.enlace,
    b.estado,
    b.rechazo_motivo,
    b.creado_por,
    b.actualizado_por,
    b.aprobado_por,
    b.rechazado_por,
    b.fecha_creacion,
    b.fecha_actualizacion,
    b.fecha_aprobacion,
    b.fecha_rechazo,
    b.fuente_url,
    b.fuente_nombre,
    b.fecha_importacion
  FROM becas b
  LEFT JOIN universidades u ON u.id = b.universidad_id
`;

const getOwnedUniversityId = async (userId: string, client?: PoolClient) => {
  const executor = client || pool;
  const result = await executor.query(
    `SELECT id
     FROM universidades
     WHERE user_id = $1
     ORDER BY creado_en DESC
     LIMIT 1`,
    [userId]
  );

  if (!result.rowCount) {
    throw new AppError('No tienes una universidad asociada a tu cuenta', 404);
  }

  return result.rows[0].id as string;
};

const insertHistory = async (
  client: PoolClient,
  payload: {
    becaId: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    accion: BecaAction;
    motivo?: string | null;
    moderadoPor?: string | null;
    actorRol?: string | null;
  }
) => {
  await client.query(
    `INSERT INTO beca_moderation_history (
       beca_id, estado_anterior, estado_nuevo, motivo, moderado_por, actor_rol, accion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      payload.becaId,
      payload.estadoAnterior,
      payload.estadoNuevo,
      payload.motivo || null,
      payload.moderadoPor || null,
      payload.actorRol || null,
      payload.accion,
    ]
  );
};

const createBecaStatusNotification = async (
  client: PoolClient,
  beca: BecaRow,
  status: 'aprobado' | 'rechazado',
  rejectionReason?: string | null
) => {
  if (!beca.universidad_id) return;

  const ownerResult = await client.query(
    `SELECT user_id
     FROM universidades
     WHERE id = $1
     LIMIT 1`,
    [beca.universidad_id]
  );

  const ownerUserId = ownerResult.rows[0]?.user_id as string | null | undefined;
  if (!ownerUserId) return;

  const approved = status === 'aprobado';
  await client.query(
    `INSERT INTO notifications (
       user_id, titulo, mensaje, tipo, entidad_tipo, entidad_id
     )
     VALUES ($1, $2, $3, $4, 'beca', $5)`,
    [
      ownerUserId,
      approved ? 'Beca aprobada' : 'Beca rechazada',
      approved
        ? `Tu beca "${beca.nombre}" fue aprobada y ya puede aparecer publicada.`
        : `Tu beca "${beca.nombre}" fue rechazada. Motivo: ${rejectionReason || 'No especificado'}`,
      approved ? 'beca_aprobada' : 'beca_rechazada',
      beca.id,
    ]
  );
};

export const getPublicBecas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = normalizeText(req.query.search);
    const universidadId = normalizeText(req.query.universidadId);
    const vigente = String(req.query.vigente || '').toLowerCase() === 'true';
    const params: unknown[] = [];
    const where = [`b.estado = 'aprobado'`];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(b.nombre ILIKE $${params.length} OR b.descripcion ILIKE $${params.length})`);
    }

    if (universidadId) {
      if (!isUuid(universidadId)) throw new AppError('universidadId invalido', 400);
      params.push(universidadId);
      where.push(`b.universidad_id = $${params.length}`);
    }

    if (vigente) {
      where.push(`(b.fecha_cierre IS NULL OR b.fecha_cierre >= CURRENT_DATE)`);
    }

    const result = await query(
      `${selectBecaSql}
       WHERE ${where.join(' AND ')}
       ORDER BY b.fecha_cierre ASC NULLS LAST, b.fecha_creacion DESC`,
      params
    );

    const becas = result.rows.map((row) => publicBecaFields(row as BecaRow));
    return res.json({ success: true, data: becas, becas });
  } catch (error) {
    return next(error);
  }
};

export const getPublicBecaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);

    const result = await query(
      `${selectBecaSql}
       WHERE b.id = $1 AND b.estado = 'aprobado'
       LIMIT 1`,
      [id]
    );

    if (!result.rowCount) throw new AppError('Beca no encontrada', 404);

    return res.json({ success: true, data: publicBecaFields(result.rows[0] as BecaRow), beca: publicBecaFields(result.rows[0] as BecaRow) });
  } catch (error) {
    return next(error);
  }
};

export const getAdminBecas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `${selectBecaSql}
       ORDER BY
         CASE b.estado WHEN 'pendiente' THEN 1 WHEN 'rechazado' THEN 2 ELSE 3 END,
         b.fecha_actualizacion DESC NULLS LAST,
         b.fecha_creacion DESC`
    );
    const becas = result.rows.map((row) => publicBecaFields(row as BecaRow));
    return res.json({ success: true, data: becas, becas });
  } catch (error) {
    return next(error);
  }
};

export const createAdminBeca = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const payload = parsePayload(req.body);
    const universidadId = normalizeText(req.body.universidadId ?? req.body.universidad_id) || null;
    const estado = normalizeText(req.body.estado) || 'pendiente';

    if (universidadId && !isUuid(universidadId)) throw new AppError('universidadId invalido', 400);
    if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) throw new AppError('estado invalido', 400);

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `INSERT INTO becas (
         universidad_id, nombre, descripcion, requisitos, beneficios, porcentaje_cobertura,
         monto, moneda, fecha_inicio, fecha_cierre, enlace, estado, creado_por,
         aprobado_por, fecha_aprobacion, fuente_url, fuente_nombre, fecha_importacion
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
         CASE WHEN $12 = 'aprobado' THEN $13 ELSE NULL END,
         CASE WHEN $12 = 'aprobado' THEN NOW() ELSE NULL END,
         $14, $15, $16)
       RETURNING *`,
      [
        universidadId,
        payload.nombre,
        payload.descripcion,
        payload.requisitos,
        payload.beneficios,
        payload.porcentajeCobertura,
        payload.monto,
        payload.moneda,
        payload.fechaInicio,
        payload.fechaCierre,
        payload.enlace,
        estado,
        req.user.id,
        payload.fuenteUrl,
        payload.fuenteNombre,
        payload.fechaImportacion,
      ]
    );

    const beca = result.rows[0] as BecaRow;
    await insertHistory(client, {
      becaId: beca.id,
      estadoAnterior: null,
      estadoNuevo: beca.estado,
      accion: 'creado',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    await client.query('COMMIT');
    transactionStarted = false;

    const hydrated = await query(`${selectBecaSql} WHERE b.id = $1`, [beca.id]);
    return res.status(201).json({ success: true, beca: publicBecaFields(hydrated.rows[0] as BecaRow) });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const updateAdminBeca = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    const payload = parsePayload(req.body);
    const universidadId = normalizeText(req.body.universidadId ?? req.body.universidad_id) || null;
    if (universidadId && !isUuid(universidadId)) throw new AppError('universidadId invalido', 400);

    const result = await query(
      `UPDATE becas
       SET universidad_id = $1,
           nombre = $2,
           descripcion = $3,
           requisitos = $4,
           beneficios = $5,
           porcentaje_cobertura = $6,
           monto = $7,
           moneda = $8,
           fecha_inicio = $9,
           fecha_cierre = $10,
           enlace = $11,
           fuente_url = COALESCE($12, fuente_url),
           fuente_nombre = COALESCE($13, fuente_nombre),
           fecha_importacion = COALESCE($14, fecha_importacion),
           actualizado_por = $15,
           fecha_actualizacion = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        universidadId,
        payload.nombre,
        payload.descripcion,
        payload.requisitos,
        payload.beneficios,
        payload.porcentajeCobertura,
        payload.monto,
        payload.moneda,
        payload.fechaInicio,
        payload.fechaCierre,
        payload.enlace,
        payload.fuenteUrl,
        payload.fuenteNombre,
        payload.fechaImportacion,
        req.user.id,
        id,
      ]
    );

    if (!result.rowCount) throw new AppError('Beca no encontrada', 404);
    const hydrated = await query(`${selectBecaSql} WHERE b.id = $1`, [id]);
    return res.json({ success: true, beca: publicBecaFields(hydrated.rows[0] as BecaRow) });
  } catch (error) {
    return next(error);
  }
};

export const changeAdminBecaStatus = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const estado = normalizeText(req.body.estado || req.body.status);
    const rechazoMotivo = normalizeText(req.body.rechazoMotivo ?? req.body.rechazo_motivo);

    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);
    if (!['aprobado', 'rechazado'].includes(estado)) throw new AppError('estado debe ser aprobado o rechazado', 400);
    if (estado === 'rechazado' && !rechazoMotivo) throw new AppError('rechazo_motivo es obligatorio al rechazar una beca', 400);
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);

    await client.query('BEGIN');
    transactionStarted = true;

    const current = await client.query(`${selectBecaSql} WHERE b.id = $1 LIMIT 1`, [id]);
    if (!current.rowCount) throw new AppError('Beca no encontrada', 404);
    const previous = current.rows[0] as BecaRow;

    const result = await client.query(
      `UPDATE becas
       SET estado = $1,
           aprobado_por = CASE WHEN $1 = 'aprobado' THEN $2 ELSE NULL END,
           fecha_aprobacion = CASE WHEN $1 = 'aprobado' THEN NOW() ELSE NULL END,
           rechazo_motivo = CASE WHEN $1 = 'rechazado' THEN $4 ELSE NULL END,
           rechazado_por = CASE WHEN $1 = 'rechazado' THEN $2 ELSE NULL END,
           fecha_rechazo = CASE WHEN $1 = 'rechazado' THEN NOW() ELSE NULL END,
           actualizado_por = $2,
           fecha_actualizacion = NOW()
       WHERE id = $3
       RETURNING *`,
      [estado, req.user.id, id, rechazoMotivo || null]
    );

    const beca = result.rows[0] as BecaRow;
    await insertHistory(client, {
      becaId: beca.id,
      estadoAnterior: previous.estado,
      estadoNuevo: beca.estado,
      accion: estado === 'aprobado' ? 'aprobado' : 'rechazado',
      motivo: estado === 'rechazado' ? rechazoMotivo : null,
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });
    await createBecaStatusNotification(client, { ...beca, universidad_id: previous.universidad_id }, estado as 'aprobado' | 'rechazado', rechazoMotivo);

    await client.query('COMMIT');
    transactionStarted = false;

    const hydrated = await query(`${selectBecaSql} WHERE b.id = $1`, [id]);
    return res.json({ success: true, beca: publicBecaFields(hydrated.rows[0] as BecaRow) });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const deleteAdminBeca = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);

    const result = await query('DELETE FROM becas WHERE id = $1 RETURNING *', [id]);
    if (!result.rowCount) throw new AppError('Beca no encontrada', 404);

    return res.json({ success: true, beca: publicBecaFields(result.rows[0] as BecaRow) });
  } catch (error) {
    return next(error);
  }
};

export const getMyBecas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const universityId = await getOwnedUniversityId(req.user.id);
    const result = await query(
      `${selectBecaSql}
       WHERE b.universidad_id = $1
       ORDER BY
         CASE b.estado WHEN 'pendiente' THEN 1 WHEN 'rechazado' THEN 2 ELSE 3 END,
         b.fecha_actualizacion DESC NULLS LAST,
         b.fecha_creacion DESC`,
      [universityId]
    );
    const becas = result.rows.map((row) => publicBecaFields(row as BecaRow));
    return res.json({ success: true, data: becas, becas });
  } catch (error) {
    return next(error);
  }
};

export const createMyBeca = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const universityId = await getOwnedUniversityId(req.user.id, client);
    const payload = parsePayload(req.body);

    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query(
      `INSERT INTO becas (
         universidad_id, nombre, descripcion, requisitos, beneficios, porcentaje_cobertura,
         monto, moneda, fecha_inicio, fecha_cierre, enlace, estado, creado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente', $12)
       RETURNING *`,
      [
        universityId,
        payload.nombre,
        payload.descripcion,
        payload.requisitos,
        payload.beneficios,
        payload.porcentajeCobertura,
        payload.monto,
        payload.moneda,
        payload.fechaInicio,
        payload.fechaCierre,
        payload.enlace,
        req.user.id,
      ]
    );

    const beca = result.rows[0] as BecaRow;
    await insertHistory(client, {
      becaId: beca.id,
      estadoAnterior: null,
      estadoNuevo: 'pendiente',
      accion: 'creado',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    await client.query('COMMIT');
    transactionStarted = false;

    const hydrated = await query(`${selectBecaSql} WHERE b.id = $1`, [beca.id]);
    return res.status(201).json({ success: true, beca: publicBecaFields(hydrated.rows[0] as BecaRow) });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const updateMyBeca = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const universityId = await getOwnedUniversityId(req.user.id, client);
    const payload = parsePayload(req.body);

    await client.query('BEGIN');
    transactionStarted = true;

    const current = await client.query(
      `SELECT id, estado
       FROM becas
       WHERE id = $1 AND universidad_id = $2
       LIMIT 1`,
      [id, universityId]
    );

    if (!current.rowCount) throw new AppError('No tienes permisos para editar esta beca', 403);
    const previousStatus = current.rows[0].estado as BecaStatus;

    const result = await client.query(
      `UPDATE becas
       SET nombre = $1,
           descripcion = $2,
           requisitos = $3,
           beneficios = $4,
           porcentaje_cobertura = $5,
           monto = $6,
           moneda = $7,
           fecha_inicio = $8,
           fecha_cierre = $9,
           enlace = $10,
           estado = 'pendiente',
           rechazo_motivo = NULL,
           rechazado_por = NULL,
           fecha_rechazo = NULL,
           aprobado_por = NULL,
           fecha_aprobacion = NULL,
           actualizado_por = $11,
           fecha_actualizacion = NOW()
       WHERE id = $12 AND universidad_id = $13
       RETURNING *`,
      [
        payload.nombre,
        payload.descripcion,
        payload.requisitos,
        payload.beneficios,
        payload.porcentajeCobertura,
        payload.monto,
        payload.moneda,
        payload.fechaInicio,
        payload.fechaCierre,
        payload.enlace,
        req.user.id,
        id,
        universityId,
      ]
    );

    const beca = result.rows[0] as BecaRow;
    await insertHistory(client, {
      becaId: beca.id,
      estadoAnterior: previousStatus,
      estadoNuevo: 'pendiente',
      accion: previousStatus === 'pendiente' ? 'actualizado' : 'reenviado_revision',
      moderadoPor: req.user.id,
      actorRol: req.user.role,
    });

    await client.query('COMMIT');
    transactionStarted = false;

    const hydrated = await query(`${selectBecaSql} WHERE b.id = $1`, [id]);
    return res.json({ success: true, beca: publicBecaFields(hydrated.rows[0] as BecaRow) });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

export const deleteMyBeca = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);
    if (!req.user?.id) throw new AppError('Usuario no autenticado', 401);
    const universityId = await getOwnedUniversityId(req.user.id);

    const current = await query(
      `SELECT id, estado
       FROM becas
       WHERE id = $1 AND universidad_id = $2
       LIMIT 1`,
      [id, universityId]
    );

    if (!current.rowCount) throw new AppError('No tienes permisos para eliminar esta beca', 403);
    if (current.rows[0].estado === 'aprobado') {
      throw new AppError('No puedes eliminar una beca aprobada desde el panel universidad', 409);
    }

    await query('DELETE FROM becas WHERE id = $1 AND universidad_id = $2', [id, universityId]);
    return res.json({ success: true, message: 'Beca eliminada' });
  } catch (error) {
    return next(error);
  }
};

export const getBecaModerationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) throw new AppError('id de beca invalido', 400);
    if (!req.user?.id || !req.user.role) throw new AppError('Usuario no autenticado', 401);

    const exists = await query('SELECT id, universidad_id FROM becas WHERE id = $1 LIMIT 1', [id]);
    if (!exists.rowCount) throw new AppError('Beca no encontrada', 404);

    if (req.user.role === ROLES.UNIVERSITY) {
      const ownership = await query(
        `SELECT b.id
         FROM becas b
         INNER JOIN universidades u ON u.id = b.universidad_id
         WHERE b.id = $1 AND u.user_id = $2
         LIMIT 1`,
        [id, req.user.id]
      );
      if (!ownership.rowCount) throw new AppError('No tienes permisos para ver el historial de esta beca', 403);
    } else if (!ADMIN_ROLES.includes(req.user.role)) {
      throw new AppError('No tienes permisos para ver el historial de esta beca', 403);
    }

    const result = await query(
      `SELECT id, beca_id, estado_anterior, estado_nuevo, motivo, actor_rol, accion, fecha
       FROM beca_moderation_history
       WHERE beca_id = $1
       ORDER BY fecha DESC`,
      [id]
    );
    const history = result.rows.map((row) => publicHistoryFields(row as BecaHistoryRow));
    return res.json({ success: true, data: history, history, historial: history });
  } catch (error) {
    return next(error);
  }
};
