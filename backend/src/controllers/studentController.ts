import { NextFunction, Request, Response } from 'express';
import type { DatabaseError } from 'pg';
import { query } from '../config/db';
import { ROLES } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';
import {
  assertReferenceExists,
  calculateRecommendationScore,
  comparePlans,
  getUpgradeMessage,
  getUserPlanLimits,
  logActivity,
  normalizeList,
  STUDENT_PLANS,
  validatePlanLimits,
  type StudentPlan,
  type StudentProfile,
  type StudentReferenceType,
} from '../services/studentService';

type StudentUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  tipo_usuario: string | null;
  plan: StudentPlan;
  estado_suscripcion: string;
  fecha_inicio_plan: Date | null;
  fecha_fin_plan: Date | null;
  preferencias_completadas: boolean;
};

type ActivityRow = {
  action: string;
  ref_id: string | null;
  metadata: Record<string, unknown>;
};

const validReferenceTypes = ['programa', 'universidad'];
const validModalities = ['presencial', 'virtual', 'distancia', 'hibrida'];
const validLevels = ['pregrado', 'posgrado', 'tecnico', 'tecnologico'];
const validActivityActions = ['view_program', 'view_university', 'favorite', 'compare', 'search', 'click_contact'];

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeReferenceType = (value: unknown): StudentReferenceType | null => {
  if (value === 'program' || value === 'programa') return 'programa';
  if (value === 'university' || value === 'universidad') return 'universidad';
  return null;
};

const publicStudentUser = (user: StudentUserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  tipoUsuario: user.tipo_usuario,
  plan: user.plan,
  estadoSuscripcion: user.estado_suscripcion,
  fechaInicioPlan: user.fecha_inicio_plan,
  fechaFinPlan: user.fecha_fin_plan,
  preferenciasCompletadas: user.preferencias_completadas,
});

const publicProfile = (profile: Record<string, unknown>) => ({
  id: profile.id,
  userId: profile.user_id,
  intereses: profile.intereses || [],
  areasInteres: profile.areas_interes || [],
  ciudadesPreferidas: profile.ciudades_preferidas || [],
  presupuestoMax: profile.presupuesto_max === null ? null : Number(profile.presupuesto_max),
  modalidadPreferida: profile.modalidad_preferida,
  nivelInteres: profile.nivel_interes,
  paisInteres: profile.pais_interes,
  idiomaPreferido: profile.idioma_preferido,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const parseProfilePayload = (body: Record<string, unknown>): StudentProfile => {
  const presupuestoRaw = body.presupuestoMax ?? body.presupuesto_max;
  const presupuesto = presupuestoRaw === undefined || presupuestoRaw === null || presupuestoRaw === ''
    ? null
    : Number(presupuestoRaw);
  const modalidad = normalizeText(body.modalidadPreferida || body.modalidad_preferida);
  const nivel = normalizeText(body.nivelInteres || body.nivel_interes);

  if (presupuesto !== null && (!Number.isFinite(presupuesto) || presupuesto < 0)) {
    throw new AppError('presupuestoMax debe ser un numero mayor o igual a 0', 400);
  }

  if (modalidad && !validModalities.includes(modalidad)) {
    throw new AppError('modalidadPreferida invalida', 400);
  }

  if (nivel && !validLevels.includes(nivel)) {
    throw new AppError('nivelInteres invalido', 400);
  }

  return {
    intereses: normalizeList(body.intereses),
    areas_interes: normalizeList(body.areasInteres || body.areas_interes),
    ciudades_preferidas: normalizeList(body.ciudadesPreferidas || body.ciudades_preferidas),
    presupuesto_max: presupuesto,
    modalidad_preferida: modalidad || null,
    nivel_interes: nivel || null,
    pais_interes: normalizeText(body.paisInteres || body.pais_interes) || 'Colombia',
    idioma_preferido: normalizeText(body.idiomaPreferido || body.idioma_preferido) || 'es',
  };
};

const getStudentUser = async (userId: string) => {
  const result = await query(
    `SELECT
       id, name, email, role, tipo_usuario, plan, estado_suscripcion,
       fecha_inicio_plan, fecha_fin_plan, preferencias_completadas
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (!result.rowCount) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return result.rows[0] as StudentUserRow;
};

const ensureStudent = async (userId?: string) => {
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const user = await getStudentUser(userId);
  if (user.role !== ROLES.STUDENT && user.role !== ROLES.USER && user.tipo_usuario !== 'student') {
    throw new AppError('Este modulo es exclusivo para estudiantes', 403);
  }

  return user;
};

const getOrCreateProfile = async (userId: string) => {
  const result = await query(
    `INSERT INTO student_profiles (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );

  return result.rows[0];
};

const referenceSelect = (tableAlias: string) => `
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.nombre ELSE u.nombre END AS ref_nombre,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.descripcion ELSE u.descripcion END AS ref_descripcion,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.precio ELSE NULL END AS ref_precio,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.modalidad ELSE NULL END AS ref_modalidad,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.duracion ELSE NULL END AS ref_duracion,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN p.universidad_id ELSE NULL END AS universidad_id,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN pu.nombre ELSE u.nombre END AS universidad_nombre,
  CASE WHEN ${tableAlias}.tipo = 'programa' THEN pu.ciudad ELSE u.ciudad END AS universidad_ciudad
`;

const publicReferenceItem = (row: Record<string, unknown>) => ({
  id: row.id,
  userId: row.user_id,
  tipo: row.tipo,
  refId: row.ref_id,
  createdAt: row.created_at,
  item: {
    id: row.ref_id,
    nombre: row.ref_nombre,
    descripcion: row.ref_descripcion,
    precio: row.ref_precio === null ? null : Number(row.ref_precio || 0),
    modalidad: row.ref_modalidad,
    duracion: row.ref_duracion,
    universidadId: row.universidad_id,
    universidadNombre: row.universidad_nombre,
    universidadCiudad: row.universidad_ciudad,
  },
});

const publicAlert = (row: Record<string, unknown>) => ({
  id: row.id,
  userId: row.user_id,
  tipo: row.tipo,
  titulo: row.titulo,
  descripcion: row.descripcion,
  refId: row.ref_id,
  leido: row.leido,
  createdAt: row.created_at,
});

const getStudentPlanPayload = async (user: StudentUserRow) => {
  const [favorites, comparisons] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM student_favorites WHERE user_id = $1', [user.id]),
    query('SELECT COUNT(*)::int AS total FROM student_comparisons WHERE user_id = $1', [user.id]),
  ]);
  const limits = getUserPlanLimits(user.plan);

  return {
    plan: user.plan,
    estadoSuscripcion: user.estado_suscripcion,
    fechaInicioPlan: user.fecha_inicio_plan,
    fechaFinPlan: user.fecha_fin_plan,
    limits: {
      favorites: limits.favorites,
      comparisons: limits.comparisons,
    },
    usage: {
      favorites: Number(favorites.rows[0]?.total || 0),
      comparisons: Number(comparisons.rows[0]?.total || 0),
    },
    features: {
      advancedRecommendations: limits.recommendations === 'advanced',
      alerts: limits.alerts,
      advisorAccess: limits.advisorAccess,
      personalizedAdvice: user.plan === 'plus',
      priorityResults: user.plan === 'plus',
      advancedInsights: user.plan === 'plus',
    },
  };
};

const handleDbError = (error: unknown) => {
  const dbError = error as DatabaseError;
  if (dbError?.code === '23505') {
    return new AppError('El registro ya existe para este estudiante', 409);
  }
  return error;
};

export const getStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const profile = await getOrCreateProfile(user.id);
    const planPayload = await getStudentPlanPayload(user);

    return res.json({
      user: publicStudentUser(user),
      profile: publicProfile(profile),
      ...planPayload,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const payload = parseProfilePayload(req.body);
    const completed = Boolean(
      payload.areas_interes.length ||
      payload.intereses.length ||
      payload.ciudades_preferidas.length ||
      payload.modalidad_preferida ||
      payload.nivel_interes
    );

    const result = await query(
      `INSERT INTO student_profiles (
         user_id, intereses, areas_interes, ciudades_preferidas, presupuesto_max,
         modalidad_preferida, nivel_interes, pais_interes, idioma_preferido
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         intereses = EXCLUDED.intereses,
         areas_interes = EXCLUDED.areas_interes,
         ciudades_preferidas = EXCLUDED.ciudades_preferidas,
         presupuesto_max = EXCLUDED.presupuesto_max,
         modalidad_preferida = EXCLUDED.modalidad_preferida,
         nivel_interes = EXCLUDED.nivel_interes,
         pais_interes = EXCLUDED.pais_interes,
         idioma_preferido = EXCLUDED.idioma_preferido,
         updated_at = NOW()
       RETURNING *`,
      [
        user.id,
        payload.intereses,
        payload.areas_interes,
        payload.ciudades_preferidas,
        payload.presupuesto_max,
        payload.modalidad_preferida,
        payload.nivel_interes,
        payload.pais_interes,
        payload.idioma_preferido,
      ]
    );

    await query('UPDATE users SET preferencias_completadas = $1, updated_at = NOW() WHERE id = $2', [completed, user.id]);

    return res.json({
      message: 'Preferencias actualizadas',
      profile: publicProfile(result.rows[0]),
      preferenciasCompletadas: completed,
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const tipo = normalizeReferenceType(req.query.tipo);
    const params: unknown[] = [user.id];
    const typeClause = tipo ? 'AND sf.tipo = $2' : '';
    if (tipo) params.push(tipo);

    const result = await query(
      `SELECT sf.*, ${referenceSelect('sf')}
       FROM student_favorites sf
       LEFT JOIN programas p ON sf.tipo = 'programa' AND sf.ref_id = p.id
       LEFT JOIN universidades u ON sf.tipo = 'universidad' AND sf.ref_id = u.id
       LEFT JOIN universidades pu ON p.universidad_id = pu.id
       WHERE sf.user_id = $1 ${typeClause}
       ORDER BY sf.created_at DESC`,
      params
    );

    return res.json({
      favorites: result.rows.map(publicReferenceItem),
      usage: {
        used: result.rows.length,
        limit: getUserPlanLimits(user.plan).favorites,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createStudentFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const tipo = normalizeReferenceType(req.body.tipo);
    const refId = normalizeText(req.body.refId || req.body.ref_id || req.body.referenciaId);

    if (!tipo || !validReferenceTypes.includes(tipo) || !refId) {
      throw new AppError('tipo y refId son obligatorios', 400);
    }

    await assertReferenceExists(tipo, refId);
    await validatePlanLimits(user, 'add_favorite');

    const insert = await query(
      `INSERT INTO student_favorites (user_id, tipo, ref_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tipo, ref_id) DO UPDATE SET created_at = student_favorites.created_at
       RETURNING id`,
      [user.id, tipo, refId]
    );

    const result = await query(
      `SELECT sf.*, ${referenceSelect('sf')}
       FROM student_favorites sf
       LEFT JOIN programas p ON sf.tipo = 'programa' AND sf.ref_id = p.id
       LEFT JOIN universidades u ON sf.tipo = 'universidad' AND sf.ref_id = u.id
       LEFT JOIN universidades pu ON p.universidad_id = pu.id
       WHERE sf.id = $1`,
      [insert.rows[0].id]
    );

    await logActivity(user.id, 'favorite', refId, { tipo });

    return res.status(201).json({ favorite: publicReferenceItem(result.rows[0]) });
  } catch (error) {
    return next(handleDbError(error));
  }
};

export const deleteStudentFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const result = await query('DELETE FROM student_favorites WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      user.id,
    ]);

    if (!result.rowCount) {
      throw new AppError('Favorito no encontrado', 404);
    }

    return res.json({ message: 'Favorito eliminado' });
  } catch (error) {
    return next(error);
  }
};

export const getStudentComparisons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const result = await query(
      `SELECT sc.*, ${referenceSelect('sc')}
       FROM student_comparisons sc
       LEFT JOIN programas p ON sc.tipo = 'programa' AND sc.ref_id = p.id
       LEFT JOIN universidades u ON sc.tipo = 'universidad' AND sc.ref_id = u.id
       LEFT JOIN universidades pu ON p.universidad_id = pu.id
       WHERE sc.user_id = $1
       ORDER BY sc.tipo, sc.created_at DESC`,
      [user.id]
    );

    return res.json({
      comparisons: result.rows.map(publicReferenceItem),
      usage: {
        used: result.rows.length,
        limit: getUserPlanLimits(user.plan).comparisons,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createStudentComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const tipo = normalizeReferenceType(req.body.tipo);
    const refId = normalizeText(req.body.refId || req.body.ref_id || req.body.referenciaId);

    if (!tipo || !validReferenceTypes.includes(tipo) || !refId) {
      throw new AppError('tipo y refId son obligatorios', 400);
    }

    await assertReferenceExists(tipo, refId);
    await validatePlanLimits(user, 'add_comparison');

    const insert = await query(
      `INSERT INTO student_comparisons (user_id, tipo, ref_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tipo, ref_id) DO UPDATE SET created_at = student_comparisons.created_at
       RETURNING id`,
      [user.id, tipo, refId]
    );

    const result = await query(
      `SELECT sc.*, ${referenceSelect('sc')}
       FROM student_comparisons sc
       LEFT JOIN programas p ON sc.tipo = 'programa' AND sc.ref_id = p.id
       LEFT JOIN universidades u ON sc.tipo = 'universidad' AND sc.ref_id = u.id
       LEFT JOIN universidades pu ON p.universidad_id = pu.id
       WHERE sc.id = $1`,
      [insert.rows[0].id]
    );

    await logActivity(user.id, 'compare', refId, { tipo });

    return res.status(201).json({ comparison: publicReferenceItem(result.rows[0]) });
  } catch (error) {
    return next(handleDbError(error));
  }
};

export const deleteStudentComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const result = await query('DELETE FROM student_comparisons WHERE id = $1 AND user_id = $2 RETURNING id', [
      req.params.id,
      user.id,
    ]);

    if (!result.rowCount) {
      throw new AppError('Elemento de comparador no encontrado', 404);
    }

    return res.json({ message: 'Elemento eliminado del comparador' });
  } catch (error) {
    return next(error);
  }
};

export const getStudentRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const profile = await getOrCreateProfile(user.id);

    const [programsResult, activityResult, favoriteResult, comparisonResult, popularityResult] = await Promise.all([
      query(
      `SELECT
         p.id, p.nombre, p.descripcion, p.precio, p.modalidad, p.duracion,
         p.universidad_id, u.nombre AS universidad_nombre, u.ciudad AS universidad_ciudad
       FROM programas p
       INNER JOIN universidades u ON u.id = p.universidad_id
       WHERE p.estado = 'aprobado'
       ORDER BY p.fecha_aprobacion DESC NULLS LAST, p.creado_en DESC
       LIMIT 100`
      ),
      query(
        `SELECT action, ref_id, metadata
         FROM student_activity_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 80`,
        [user.id]
      ),
      query('SELECT tipo, ref_id FROM student_favorites WHERE user_id = $1', [user.id]),
      query('SELECT tipo, ref_id FROM student_comparisons WHERE user_id = $1', [user.id]),
      query(
        `SELECT ref_id, COUNT(*)::int AS total
         FROM student_activity_logs
         WHERE action IN ('view_program', 'favorite', 'compare') AND ref_id IS NOT NULL
         GROUP BY ref_id
         ORDER BY total DESC
         LIMIT 100`
      ),
    ]);

    const preferences: StudentProfile = {
      intereses: profile.intereses || [],
      areas_interes: profile.areas_interes || [],
      ciudades_preferidas: profile.ciudades_preferidas || [],
      presupuesto_max: profile.presupuesto_max === null ? null : Number(profile.presupuesto_max),
      modalidad_preferida: profile.modalidad_preferida,
      nivel_interes: profile.nivel_interes,
      pais_interes: profile.pais_interes,
      idioma_preferido: profile.idioma_preferido,
    };

    const activityTerms = (activityResult.rows as ActivityRow[])
      .flatMap((activity) => {
        const metadata = activity.metadata || {};
        return [
          metadata.q,
          metadata.ciudad,
          metadata.modalidad,
          metadata.tipo,
          metadata.nombre,
          metadata.universidadNombre,
        ];
      })
      .map((value) => (typeof value === 'string' ? value : ''))
      .flatMap((value) => value.split(/[,\s]+/))
      .map((value) => value.trim())
      .filter((value) => value.length > 3);

    const favoriteProgramIds = favoriteResult.rows.filter((row) => row.tipo === 'programa').map((row) => row.ref_id);
    const favoriteUniversityIds = favoriteResult.rows.filter((row) => row.tipo === 'universidad').map((row) => row.ref_id);
    const comparisonProgramIds = comparisonResult.rows.filter((row) => row.tipo === 'programa').map((row) => row.ref_id);
    const comparisonUniversityIds = comparisonResult.rows.filter((row) => row.tipo === 'universidad').map((row) => row.ref_id);
    const popularityByProgramId: Record<string, number> = Object.fromEntries(
      popularityResult.rows.map((row) => [row.ref_id, Number(row.total || 0)])
    );
    const maxPopularity = Math.max(0, ...Object.values(popularityByProgramId));

    const recommendations = programsResult.rows
      .map((program) => {
        const scoreData = calculateRecommendationScore(program, preferences, {
          activityTerms,
          favoriteProgramIds,
          favoriteUniversityIds,
          comparisonProgramIds,
          comparisonUniversityIds,
          popularityByProgramId,
          maxPopularity,
        });
        return {
          id: program.id,
          nombre: program.nombre,
          descripcion: program.descripcion,
          precio: Number(program.precio),
          modalidad: program.modalidad,
          duracion: program.duracion,
          universidadId: program.universidad_id,
          universidadNombre: program.universidad_nombre,
          universidadCiudad: program.universidad_ciudad,
          score: scoreData.score,
          compatibilityScore: user.plan === 'plus' ? scoreData.score : undefined,
          components: user.plan === 'plus' ? scoreData.components : undefined,
          recommendedForYou: scoreData.score >= 60,
          reasons: scoreData.reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, user.plan === 'plus' ? 20 : user.plan === 'basic' ? 12 : 8);

    if (comparePlans(user.plan, 'basic') >= 0 && recommendations[0]) {
      await query(
        `INSERT INTO student_alerts (user_id, tipo, titulo, descripcion, ref_id)
         SELECT $1, 'recommendation', $2, $3, $4
         WHERE NOT EXISTS (
           SELECT 1
           FROM student_alerts
           WHERE user_id = $1
             AND tipo = 'recommendation'
             AND ref_id = $4
             AND created_at > NOW() - INTERVAL '7 days'
         )`,
        [
          user.id,
          'Nueva recomendacion para ti',
          `${recommendations[0].nombre} coincide con tu perfil academico.`,
          recommendations[0].id,
        ]
      );
    }

    return res.json({
      recommendations,
      plan: user.plan,
      recommendationLevel: getUserPlanLimits(user.plan).recommendations,
      upsell:
        user.plan !== 'plus'
          ? {
              message: getUpgradeMessage(user, 'advanced_recommendations'),
              recommendedPlan: 'plus',
            }
          : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const planPayload = await getStudentPlanPayload(user);

    return res.json({
      ...planPayload,
      plans: STUDENT_PLANS,
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const limit = user.plan === 'free' ? 3 : 30;

    if (user.plan === 'free') {
      await query(
        `INSERT INTO student_alerts (user_id, tipo, titulo, descripcion)
         SELECT $1, 'recommendation', 'Tu perfil puede mejorar', $2
         WHERE NOT EXISTS (
           SELECT 1 FROM student_alerts
           WHERE user_id = $1 AND tipo = 'recommendation' AND created_at > NOW() - INTERVAL '14 days'
         )`,
        [user.id, getUpgradeMessage(user, 'alerts')]
      );
    } else {
      await query(
        `INSERT INTO student_alerts (user_id, tipo, titulo, descripcion, ref_id)
         SELECT $1, 'new_program', 'Programas recientes disponibles', 'Hay programas nuevos que podrian interesarte.', p.id
         FROM programas p
         WHERE p.estado = 'aprobado'
           AND NOT EXISTS (
             SELECT 1 FROM student_alerts sa
             WHERE sa.user_id = $1 AND sa.tipo = 'new_program' AND sa.ref_id = p.id
           )
         ORDER BY p.fecha_aprobacion DESC NULLS LAST, p.creado_en DESC
         LIMIT 2`,
        [user.id]
      );
    }

    const result = await query(
      `SELECT id, user_id, tipo, titulo, descripcion, ref_id, leido, created_at
       FROM student_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    );

    return res.json({
      alerts: result.rows.map(publicAlert),
      limited: user.plan === 'free',
      upsell: user.plan === 'free'
        ? {
            message: getUpgradeMessage(user, 'alerts'),
            recommendedPlan: 'basic',
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const profile = await getOrCreateProfile(user.id);
    const isBasicOrHigher = comparePlans(user.plan, 'basic') >= 0;
    const isPlus = comparePlans(user.plan, 'plus') >= 0;

    const [activitySummary, topCities, topPrograms, recentRecommendations] = await Promise.all([
      query(
        `SELECT action, COUNT(*)::int AS total
         FROM student_activity_logs
         WHERE user_id = $1
         GROUP BY action
         ORDER BY total DESC`,
        [user.id]
      ),
      query(
        `SELECT COALESCE((metadata->>'ciudad'), u.ciudad) AS city, COUNT(*)::int AS total
         FROM student_activity_logs sal
         LEFT JOIN universidades u ON sal.ref_id = u.id
         WHERE sal.user_id = $1
         GROUP BY COALESCE((metadata->>'ciudad'), u.ciudad)
         HAVING COALESCE((metadata->>'ciudad'), u.ciudad) IS NOT NULL
         ORDER BY total DESC
         LIMIT 5`,
        [user.id]
      ),
      query(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.modalidad, p.duracion,
                p.universidad_id, u.nombre AS universidad_nombre, u.ciudad AS universidad_ciudad
         FROM programas p
         INNER JOIN universidades u ON u.id = p.universidad_id
         WHERE p.estado = 'aprobado'
         ORDER BY p.fecha_aprobacion DESC NULLS LAST, p.creado_en DESC
         LIMIT 50`
      ),
      query(
        `SELECT titulo, descripcion, ref_id
         FROM student_alerts
         WHERE user_id = $1 AND tipo = 'recommendation'
         ORDER BY created_at DESC
         LIMIT 5`,
        [user.id]
      ),
    ]);

    const preferences: StudentProfile = {
      intereses: profile.intereses || [],
      areas_interes: profile.areas_interes || [],
      ciudades_preferidas: profile.ciudades_preferidas || [],
      presupuesto_max: profile.presupuesto_max === null ? null : Number(profile.presupuesto_max),
      modalidad_preferida: profile.modalidad_preferida,
      nivel_interes: profile.nivel_interes,
      pais_interes: profile.pais_interes,
      idioma_preferido: profile.idioma_preferido,
    };

    const compatibilityScores = topPrograms.rows
      .map((program) => {
        const scoreData = calculateRecommendationScore(program, preferences);
        return {
          programId: program.id,
          programName: program.nombre,
          universityName: program.universidad_nombre,
          score: scoreData.score,
          reasons: scoreData.reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, isPlus ? 8 : 3);

    const summary = Object.fromEntries(activitySummary.rows.map((row) => [row.action, Number(row.total || 0)]));
    const topAreas = Array.from(new Set([...(profile.areas_interes || []), ...(profile.intereses || [])])).slice(0, 8);

    return res.json({
      topAreas,
      topCities: topCities.rows.map((row) => ({ city: row.city, total: Number(row.total || 0) })),
      compatibilityScores: isBasicOrHigher ? compatibilityScores : compatibilityScores.slice(0, 2),
      activitySummary: isBasicOrHigher ? summary : {
        total: Object.values(summary).reduce((acc: number, value) => acc + Number(value || 0), 0),
      },
      recommendationReasons: recentRecommendations.rows.map((row) => ({
        title: row.titulo,
        description: row.descripcion,
        refId: row.ref_id,
      })),
      plan: user.plan,
      upsell: !isPlus
        ? {
            message: getUpgradeMessage(user, isBasicOrHigher ? 'plus_insights' : 'activity_history'),
            recommendedPlan: isBasicOrHigher ? 'plus' : 'basic',
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const createStudentActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await ensureStudent(req.user?.id);
    const action = normalizeText(req.body.action);
    const refId = normalizeText(req.body.refId || req.body.ref_id) || null;
    const metadata = req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};

    if (!validActivityActions.includes(action)) {
      throw new AppError('action invalida', 400);
    }

    await logActivity(user.id, action as any, refId, metadata as Record<string, unknown>);

    return res.status(201).json({ message: 'Actividad registrada' });
  } catch (error) {
    return next(error);
  }
};

export const upgradeStudentPlan = (_req: Request, _res: Response, next: NextFunction) => {
  return next(new AppError('El cambio de plan requiere una confirmacion de pago.', 403));
};
