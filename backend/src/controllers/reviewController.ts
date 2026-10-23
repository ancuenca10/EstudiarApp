import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { ROLES } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';

type ReviewStatus = 'pendiente' | 'aprobada' | 'rechazada';
type ReviewType = 'programa' | 'universidad';

type ReviewRow = {
  id: string;
  user_id: string;
  tipo: ReviewType;
  referencia_id: string;
  rating: number;
  titulo: string;
  contenido: string;
  pros: string;
  contras: string;
  estado: ReviewStatus;
  respuesta_universidad: string | null;
  created_at: Date;
  updated_at: Date;
  user_name: string | null;
  referencia_nombre: string | null;
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeReviewType = (value: unknown): ReviewType | null => {
  const text = normalizeText(value).toLowerCase();

  if (text === 'programa' || text === 'program') return 'programa';
  if (text === 'universidad' || text === 'university') return 'universidad';

  return null;
};

const normalizeStatus = (value: unknown): ReviewStatus | null => {
  const text = normalizeText(value).toLowerCase();

  if (text === 'pendiente' || text === 'pending') return 'pendiente';
  if (text === 'aprobada' || text === 'approved') return 'aprobada';
  if (text === 'rechazada' || text === 'rejected') return 'rechazada';

  return null;
};

const statusToLegacy = (status: ReviewStatus) => {
  const map: Record<ReviewStatus, 'pending' | 'approved' | 'rejected'> = {
    pendiente: 'pending',
    aprobada: 'approved',
    rechazada: 'rejected',
  };

  return map[status];
};

const typeToLegacy = (tipo: ReviewType) => {
  return tipo === 'universidad' ? 'university' : 'program';
};

const csvToArray = (value: string | null) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const arrayOrTextToCsv = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean).join(', ');
  }

  return normalizeText(value);
};

const mapReview = (review: ReviewRow) => ({
  id: review.id,
  userId: review.user_id,
  userName: review.user_name || 'Usuario',
  tipo: review.tipo,
  entityType: typeToLegacy(review.tipo),
  referenciaId: review.referencia_id,
  entityId: review.referencia_id,
  programId: review.tipo === 'programa' ? review.referencia_id : undefined,
  universityId: review.tipo === 'universidad' ? review.referencia_id : undefined,
  referenciaNombre: review.referencia_nombre,
  rating: Number(review.rating),
  titulo: review.titulo,
  title: review.titulo,
  contenido: review.contenido,
  content: review.contenido,
  pros: csvToArray(review.pros),
  contras: csvToArray(review.contras),
  cons: csvToArray(review.contras),
  estado: review.estado,
  status: statusToLegacy(review.estado),
  respuestaUniversidad: review.respuesta_universidad,
  universityReply: review.respuesta_universidad,
  helpfulCount: 0,
  notHelpfulCount: 0,
  wouldRecommend: Number(review.rating) >= 4,
  isVerifiedStudent: true,
  createdAt: review.created_at,
  updatedAt: review.updated_at,
});

const selectReviewsSql = `
  SELECT
    r.id,
    r.user_id,
    r.tipo,
    r.referencia_id,
    r.rating,
    r.titulo,
    r.contenido,
    r.pros,
    r.contras,
    r.estado,
    r.respuesta_universidad,
    r.created_at,
    r.updated_at,
    u.name AS user_name,
    CASE
      WHEN r.tipo = 'programa' THEN p.nombre
      WHEN r.tipo = 'universidad' THEN uni.nombre
      ELSE NULL
    END AS referencia_nombre
  FROM reviews r
  LEFT JOIN users u ON u.id = r.user_id
  LEFT JOIN programas p ON r.tipo = 'programa' AND p.id = r.referencia_id
  LEFT JOIN universidades uni ON r.tipo = 'universidad' AND uni.id = r.referencia_id
`;

const validateReferenceExists = async (tipo: ReviewType, referenciaId: string) => {
  const table = tipo === 'programa' ? 'programas' : 'universidades';
  const result = await query(`SELECT id FROM ${table} WHERE id = $1 LIMIT 1`, [referenciaId]);

  if (result.rowCount === 0) {
    throw new AppError('La referencia indicada no existe', 404);
  }
};

const isReviewModerator = (role?: string) =>
  role === ROLES.ASESOR || role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

const canManageReviewContent = (role?: string) =>
  role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const tipo = normalizeReviewType(req.body.tipo || req.body.entityType);
    const referenciaId = normalizeText(req.body.referencia_id || req.body.referenciaId || req.body.entityId);
    const rating = Number(req.body.rating);
    const titulo = normalizeText(req.body.titulo || req.body.title);
    const contenido = normalizeText(req.body.contenido || req.body.content);
    const pros = arrayOrTextToCsv(req.body.pros);
    const contras = arrayOrTextToCsv(req.body.contras || req.body.cons);

    if (!tipo) throw new AppError('tipo debe ser programa o universidad', 400);
    if (!referenciaId) throw new AppError('referencia_id es obligatorio', 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError('rating debe ser un numero entero entre 1 y 5', 400);
    }
    if (!contenido) throw new AppError('contenido es obligatorio', 400);

    await validateReferenceExists(tipo, referenciaId);

    const result = await query(
      `INSERT INTO reviews (
         user_id, tipo, referencia_id, rating, titulo, contenido, pros, contras
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, tipo, referenciaId, rating, titulo, contenido, pros, contras]
    );

    const review = await query(`${selectReviewsSql} WHERE r.id = $1`, [result.rows[0].id]);

    return res.status(201).json({
      success: true,
      message: 'Resena creada y pendiente de aprobacion',
      data: mapReview(review.rows[0] as ReviewRow),
      review: mapReview(review.rows[0] as ReviewRow),
    });
  } catch (error) {
    return next(error);
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const isModerator = isReviewModerator(req.user.role);
    const estado = normalizeStatus(req.query.estado || req.query.status);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!isModerator) {
      params.push(req.user.id);
      conditions.push(`r.user_id = $${params.length}`);
    }

    if (estado) {
      params.push(estado);
      conditions.push(`r.estado = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `${selectReviewsSql} ${where} ORDER BY r.created_at DESC`,
      params
    );

    const reviews = result.rows.map((row) => mapReview(row as ReviewRow));

    return res.json({
      success: true,
      data: reviews,
      reviews,
    });
  } catch (error) {
    return next(error);
  }
};

export const getHomeReviews = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `${selectReviewsSql}
       WHERE r.estado = 'aprobada'
       ORDER BY r.created_at DESC
       LIMIT 6`
    );

    const reviews = result.rows.map((row) => mapReview(row as ReviewRow));

    return res.json({
      success: true,
      data: reviews,
      reviews,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const existing = await query('SELECT user_id FROM reviews WHERE id = $1', [req.params.id]);
    if (existing.rowCount === 0) throw new AppError('Resena no encontrada', 404);

    const isOwner = existing.rows[0].user_id === req.user.id;
    const canManageContent = canManageReviewContent(req.user.role);

    if (!isOwner && !canManageContent) {
      throw new AppError('No tienes permisos para modificar esta resena', 403);
    }

    const rating = req.body.rating !== undefined ? Number(req.body.rating) : undefined;
    const titulo = req.body.titulo !== undefined || req.body.title !== undefined
      ? normalizeText(req.body.titulo || req.body.title)
      : undefined;
    const contenido = req.body.contenido !== undefined || req.body.content !== undefined
      ? normalizeText(req.body.contenido || req.body.content)
      : undefined;
    const pros = req.body.pros !== undefined ? arrayOrTextToCsv(req.body.pros) : undefined;
    const contras = req.body.contras !== undefined || req.body.cons !== undefined
      ? arrayOrTextToCsv(req.body.contras || req.body.cons)
      : undefined;
    const respuestaUniversidad = req.body.respuesta_universidad !== undefined || req.body.respuestaUniversidad !== undefined || req.body.universityReply !== undefined
      ? normalizeText(req.body.respuesta_universidad || req.body.respuestaUniversidad || req.body.universityReply)
      : undefined;

    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new AppError('rating debe ser un numero entero entre 1 y 5', 400);
    }
    if (contenido !== undefined && !contenido) {
      throw new AppError('contenido es obligatorio', 400);
    }

    const result = await query(
      `UPDATE reviews
       SET
         rating = COALESCE($2, rating),
         titulo = COALESCE($3, titulo),
         contenido = COALESCE($4, contenido),
         pros = COALESCE($5, pros),
         contras = COALESCE($6, contras),
         respuesta_universidad = COALESCE($7, respuesta_universidad),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id, rating, titulo, contenido, pros, contras, respuestaUniversidad]
    );

    const review = await query(`${selectReviewsSql} WHERE r.id = $1`, [result.rows[0].id]);
    const mapped = mapReview(review.rows[0] as ReviewRow);

    return res.json({
      success: true,
      message: 'Resena actualizada',
      data: mapped,
      review: mapped,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const existing = await query('SELECT user_id FROM reviews WHERE id = $1', [req.params.id]);
    if (existing.rowCount === 0) throw new AppError('Resena no encontrada', 404);

    const isOwner = existing.rows[0].user_id === req.user.id;
    const canManageContent = canManageReviewContent(req.user.role);

    if (!isOwner && !canManageContent) {
      throw new AppError('No tienes permisos para eliminar esta resena', 403);
    }

    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);

    return res.json({
      success: true,
      message: 'Resena eliminada',
    });
  } catch (error) {
    return next(error);
  }
};

export const changeReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estado = normalizeStatus(req.body.estado || req.body.status);

    if (!estado || estado === 'pendiente') {
      throw new AppError('estado debe ser aprobada o rechazada', 400);
    }

    const result = await query(
      `UPDATE reviews
       SET estado = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id, estado]
    );

    if (result.rowCount === 0) {
      throw new AppError('Resena no encontrada', 404);
    }

    const review = await query(`${selectReviewsSql} WHERE r.id = $1`, [result.rows[0].id]);
    const mapped = mapReview(review.rows[0] as ReviewRow);

    return res.json({
      success: true,
      message: 'Estado de resena actualizado',
      data: mapped,
      review: mapped,
    });
  } catch (error) {
    return next(error);
  }
};
