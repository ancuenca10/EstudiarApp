import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

export type StudentPlan = 'free' | 'basic' | 'plus';
export type StudentFeature = 'favorites_limit' | 'comparisons_limit' | 'advisor_access';
export type StudentReferenceType = 'programa' | 'universidad';
export type StudentActivityAction =
  | 'view_program'
  | 'view_university'
  | 'favorite'
  | 'compare'
  | 'search'
  | 'click_contact';

export type StudentPlanLimits = {
  favorites: number | null;
  comparisons: number;
  advisorAccess: boolean;
  recommendations: 'basic' | 'improved' | 'advanced';
  alerts: boolean;
  processTracking: boolean;
};

export type StudentProfile = {
  intereses: string[];
  areas_interes: string[];
  ciudades_preferidas: string[];
  presupuesto_max: number | null;
  modalidad_preferida: string | null;
  nivel_interes: string | null;
  pais_interes: string;
  idioma_preferido: string;
};

export const STUDENT_PLANS: Record<StudentPlan, StudentPlanLimits & { priceCop: number }> = {
  free: {
    priceCop: 0,
    favorites: 10,
    comparisons: 3,
    advisorAccess: false,
    recommendations: 'basic',
    alerts: false,
    processTracking: false,
  },
  basic: {
    priceCop: 4800,
    favorites: 30,
    comparisons: 5,
    advisorAccess: true,
    recommendations: 'improved',
    alerts: true,
    processTracking: false,
  },
  plus: {
    priceCop: 9800,
    favorites: null,
    comparisons: 10,
    advisorAccess: true,
    recommendations: 'advanced',
    alerts: true,
    processTracking: true,
  },
};

export const PLAN_ORDER: StudentPlan[] = ['free', 'basic', 'plus'];

export const comparePlans = (userPlan: string | null | undefined, requiredPlan: StudentPlan) => {
  const currentIndex = PLAN_ORDER.indexOf((userPlan as StudentPlan) || 'free');
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
  return (currentIndex === -1 ? 0 : currentIndex) - requiredIndex;
};

export const normalizeText = (value: unknown) =>
  typeof value === 'string'
    ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
    : '';

export const normalizeList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  );
};

export const getUserPlanLimits = (plan?: string | null) => {
  return STUDENT_PLANS[(plan as StudentPlan) || 'free'] || STUDENT_PLANS.free;
};

export const getUpgradeMessage = (
  user: { plan?: string | null },
  context: 'favorites_limit' | 'comparisons_limit' | 'advanced_recommendations' | 'activity_history' | 'alerts' | 'plus_insights'
) => {
  const plan = (user.plan as StudentPlan) || 'free';

  if (context === 'favorites_limit') {
    return plan === 'free'
      ? 'Has alcanzado el limite. Mejora a BASIC para guardar mas universidades'
      : 'Mejora a PLUS para guardar favoritos ilimitados';
  }

  if (context === 'comparisons_limit') {
    return plan === 'free'
      ? 'Compara hasta 5 programas con BASIC'
      : 'Compara hasta 10 programas con PLUS';
  }

  if (context === 'advanced_recommendations') {
    return 'Desbloquea recomendaciones inteligentes con PLUS';
  }

  if (context === 'activity_history') {
    return 'Mejora a BASIC para ver tu historial avanzado de busqueda';
  }

  if (context === 'alerts') {
    return 'Mejora a BASIC para recibir alertas de programas y cambios importantes';
  }

  return 'Desbloquea insights avanzados y ranking personalizado con PLUS';
};

export const validatePlanLimits = async (
  user: { id: string; plan?: string | null },
  action: 'add_favorite' | 'add_comparison'
) => {
  const limits = getUserPlanLimits(user.plan);
  const table = action === 'add_favorite' ? 'student_favorites' : 'student_comparisons';
  const max = action === 'add_favorite' ? limits.favorites : limits.comparisons;

  if (max === null) {
    return;
  }

  const result = await query(`SELECT COUNT(*)::int AS total FROM ${table} WHERE user_id = $1`, [user.id]);
  const total = Number(result.rows[0]?.total || 0);

  if (total >= max) {
    const context = action === 'add_favorite' ? 'favorites_limit' : 'comparisons_limit';
    throw new AppError(
      getUpgradeMessage(user, context),
      402,
      {
        code: 'PLAN_LIMIT_REACHED',
        context,
        currentPlan: user.plan || 'free',
        recommendedPlan: user.plan === 'basic' ? 'plus' : 'basic',
        limit: max,
        used: total,
      }
    );
  }
};

export const logActivity = async (
  userId: string | undefined,
  action: StudentActivityAction,
  refId?: string | null,
  metadata?: Record<string, unknown>
) => {
  if (!userId) {
    return;
  }

  await query(
    `INSERT INTO student_activity_logs (user_id, action, ref_id, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId, action, refId || null, JSON.stringify(metadata || {})]
  );
};

export type RecommendationContext = {
  activityTerms?: string[];
  favoriteProgramIds?: string[];
  favoriteUniversityIds?: string[];
  comparisonProgramIds?: string[];
  comparisonUniversityIds?: string[];
  popularityByProgramId?: Record<string, number>;
  maxPopularity?: number;
};

export const calculateRecommendationScore = (
  program: {
    id?: string;
    nombre?: string;
    descripcion?: string;
    precio?: string | number;
    modalidad?: string;
    duracion?: string;
    universidad_id?: string;
    universidad_ciudad?: string;
  },
  preferences: StudentProfile,
  context: RecommendationContext = {}
) => {
  const reasons: string[] = [];
  const searchableText = normalizeText(`${program.nombre || ''} ${program.descripcion || ''} ${program.duracion || ''}`);

  const areas = preferences.areas_interes.map(normalizeText).filter(Boolean);
  const intereses = preferences.intereses.map(normalizeText).filter(Boolean);
  const ciudades = preferences.ciudades_preferidas.map(normalizeText).filter(Boolean);
  const modalidad = normalizeText(preferences.modalidad_preferida);
  const nivel = normalizeText(preferences.nivel_interes);
  const programModalidad = normalizeText(program.modalidad);
  const programCiudad = normalizeText(program.universidad_ciudad);
  const price = Number(program.precio || 0);
  const programId = program.id || '';
  const universityId = program.universidad_id || '';

  const areaHits = areas.filter((area) => searchableText.includes(area)).length;
  const interestHits = intereses.filter((interest) => searchableText.includes(interest)).length;

  const declaredScore = Math.min(100, areaHits * 35 + interestHits * 25 + (nivel && searchableText.includes(nivel) ? 15 : 0));
  if (areaHits > 0) reasons.push('Coincide con tus areas de interes');
  if (interestHits > 0) {
    reasons.push('Tiene relacion con tus intereses');
  }
  if (nivel && searchableText.includes(nivel)) reasons.push('Coincide con tu nivel academico');

  const activityHits = (context.activityTerms || []).filter((term) => searchableText.includes(term)).length;
  const activityScore = Math.min(100, activityHits * 20);
  if (activityHits > 0) reasons.push('Se parece a lo que has buscado y visitado');

  const favoriteScore =
    (context.favoriteProgramIds || []).includes(programId) ||
    (context.favoriteUniversityIds || []).includes(universityId)
      ? 100
      : 0;
  if (favoriteScore > 0) reasons.push('Esta conectado con tus favoritos');

  const comparisonScore =
    (context.comparisonProgramIds || []).includes(programId) ||
    (context.comparisonUniversityIds || []).includes(universityId)
      ? 100
      : 0;
  if (comparisonScore > 0) reasons.push('Esta relacionado con tus comparaciones');

  let locationScore = 0;
  if (ciudades.length > 0 && ciudades.includes(programCiudad)) {
    locationScore += 60;
    reasons.push('Esta en una ciudad preferida');
  }

  if (modalidad && programModalidad.includes(modalidad)) {
    locationScore += 25;
    reasons.push('Respeta tu modalidad preferida');
  }

  if (preferences.presupuesto_max !== null && Number.isFinite(price) && price <= Number(preferences.presupuesto_max)) {
    locationScore += 15;
    reasons.push('Esta dentro de tu presupuesto');
  }

  locationScore = Math.min(100, locationScore);

  const popularity = context.popularityByProgramId?.[programId] || 0;
  const popularityScore = context.maxPopularity ? Math.min(100, (popularity / context.maxPopularity) * 100) : 0;
  if (popularityScore >= 40) reasons.push('Es popular entre otros estudiantes');

  const score = Math.round(
    declaredScore * 0.25 +
    activityScore * 0.25 +
    favoriteScore * 0.2 +
    comparisonScore * 0.1 +
    locationScore * 0.1 +
    popularityScore * 0.1
  );

  return {
    score,
    components: {
      intereses: Math.round(declaredScore),
      actividad: Math.round(activityScore),
      favoritos: Math.round(favoriteScore),
      comparaciones: Math.round(comparisonScore),
      ubicacion: Math.round(locationScore),
      popularidad: Math.round(popularityScore),
    },
    reasons: reasons.length ? reasons : ['Recomendacion general segun oferta aprobada'],
  };
};

export const assertReferenceExists = async (tipo: StudentReferenceType, refId: string) => {
  const result = await query(
    tipo === 'programa'
      ? 'SELECT id FROM programas WHERE id = $1 LIMIT 1'
      : 'SELECT id FROM universidades WHERE id = $1 LIMIT 1',
    [refId]
  );

  if (!result.rowCount) {
    throw new AppError('La referencia no existe', 404);
  }
};
