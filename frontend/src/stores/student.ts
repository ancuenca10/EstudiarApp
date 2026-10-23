import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';

export type StudentPlan = 'free' | 'basic' | 'plus';
export type StudentReferenceType = 'programa' | 'universidad';
export type StudentApplicationStatus =
  | 'iniciado'
  | 'investigando'
  | 'preparando_documentos'
  | 'aplicado'
  | 'en_revision'
  | 'admitido'
  | 'rechazado'
  | 'cancelado';

export interface StudentProfile {
  id?: string;
  userId?: string;
  intereses: string[];
  areasInteres: string[];
  ciudadesPreferidas: string[];
  presupuestoMax: number | null;
  modalidadPreferida: 'presencial' | 'virtual' | 'distancia' | 'hibrida' | null;
  nivelInteres: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico' | null;
  paisInteres: string;
  idiomaPreferido: string;
}

export interface StudentReferenceItem {
  id: string;
  userId: string;
  tipo: StudentReferenceType;
  refId: string;
  createdAt: string;
  item: {
    id: string;
    nombre: string;
    descripcion?: string;
    precio?: number | null;
    modalidad?: string | null;
    duracion?: string | null;
    universidadId?: string | null;
    universidadNombre?: string | null;
    universidadCiudad?: string | null;
  };
}

export interface StudentRecommendation {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  universidadNombre: string;
  universidadCiudad: string;
  score: number;
  compatibilityScore?: number;
  recommendedForYou?: boolean;
  components?: Record<string, number>;
  reasons: string[];
}

export interface StudentAlert {
  id: string;
  tipo: 'new_program' | 'price_change' | 'recommendation';
  titulo: string;
  descripcion: string;
  refId?: string | null;
  leido: boolean;
  createdAt: string;
}

export interface StudentInsights {
  topAreas: string[];
  topCities: Array<{ city: string; total: number }>;
  compatibilityScores: Array<{
    programId: string;
    programName: string;
    universityName: string;
    score: number;
    reasons: string[];
  }>;
  activitySummary: Record<string, number>;
  recommendationReasons: Array<{ title: string; description: string; refId?: string | null }>;
  plan: StudentPlan;
  upsell?: UpsellMessage | null;
}

export interface UpsellMessage {
  message: string;
  recommendedPlan: StudentPlan;
}

export interface StudentApplication {
  id: string;
  userId: string;
  universityId: string;
  programId: string;
  estado: StudentApplicationStatus;
  notas?: string | null;
  asesorAsignado?: string | null;
  asesorNombre?: string | null;
  fechaInicio: string;
  fechaActualizacion: string;
  fechaLimite?: string | null;
  createdAt: string;
  updatedAt: string;
  progress: number;
  requirementsTotal: number;
  requirementsCompleted: number;
  missingRequirements: number;
  program: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    precio?: number | null;
    modalidad?: string | null;
    duracion?: string | null;
  };
  university: {
    id: string;
    nombre: string;
    ciudad?: string | null;
    descripcion?: string | null;
  };
}

export interface ApplicationRequirement {
  id: string;
  applicationId: string;
  nombre: string;
  descripcion?: string | null;
  obligatorio: boolean;
  completado: boolean;
  archivoUrl?: string | null;
  createdAt: string;
}

export interface ApplicationTimelineItem {
  id: string;
  applicationId: string;
  estado: StudentApplicationStatus;
  comentario?: string | null;
  createdAt: string;
}

export interface StudentPlanInfo {
  plan: StudentPlan;
  estadoSuscripcion: string;
  fechaInicioPlan?: string | null;
  fechaFinPlan?: string | null;
  limits: {
    favorites: number | null;
    comparisons: number;
    advisorAccess: boolean;
    recommendations: string;
    alerts: boolean;
    processTracking: boolean;
  };
  plans: Record<StudentPlan, StudentPlanInfo['limits'] & { priceCop: number }>;
  usage: {
    favorites: number;
    comparisons: number;
  };
  features?: {
    advancedRecommendations: boolean;
    alerts: boolean;
    advisorAccess: boolean;
    personalizedAdvice: boolean;
    priorityResults: boolean;
    advancedInsights: boolean;
  };
}

export type StudentFeature =
  | 'favorites'
  | 'comparisons'
  | 'alerts'
  | 'advisor'
  | 'advancedRecommendations'
  | 'plusInsights'
  | 'applications';

const defaultProfile = (): StudentProfile => ({
  intereses: [],
  areasInteres: [],
  ciudadesPreferidas: [],
  presupuestoMax: null,
  modalidadPreferida: null,
  nivelInteres: null,
  paisInteres: 'Colombia',
  idiomaPreferido: 'es',
});

const getDefaultLimits = (plan: StudentPlan): StudentPlanInfo['limits'] => {
  if (plan === 'plus') {
    return {
      favorites: null,
      comparisons: 10,
      advisorAccess: true,
      recommendations: 'advanced',
      alerts: true,
      processTracking: true,
    };
  }

  if (plan === 'basic') {
    return {
      favorites: 30,
      comparisons: 5,
      advisorAccess: true,
      recommendations: 'improved',
      alerts: true,
      processTracking: false,
    };
  }

  return {
    favorites: 10,
    comparisons: 3,
    advisorAccess: false,
    recommendations: 'basic',
    alerts: false,
    processTracking: false,
  };
};

const getDefaultPlans = (): StudentPlanInfo['plans'] => ({
  free: { ...getDefaultLimits('free'), priceCop: 0 },
  basic: { ...getDefaultLimits('basic'), priceCop: 4800 },
  plus: { ...getDefaultLimits('plus'), priceCop: 9800 },
});

export const useStudentStore = defineStore('student', () => {
  const profile = ref<StudentProfile>(defaultProfile());
  const favorites = ref<StudentReferenceItem[]>([]);
  const comparisons = ref<StudentReferenceItem[]>([]);
  const recommendations = ref<StudentRecommendation[]>([]);
  const alerts = ref<StudentAlert[]>([]);
  const insights = ref<StudentInsights | null>(null);
  const applications = ref<StudentApplication[]>([]);
  const selectedApplication = ref<StudentApplication | null>(null);
  const applicationRequirements = ref<ApplicationRequirement[]>([]);
  const applicationTimeline = ref<ApplicationTimelineItem[]>([]);
  const planInfo = ref<StudentPlanInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const upsell = ref<UpsellMessage | null>(null);

  const plan = computed(() => planInfo.value?.plan || 'free');
  const limits = computed(() => planInfo.value?.limits || {
    favorites: 10,
    comparisons: 3,
    advisorAccess: false,
    recommendations: 'basic',
    alerts: false,
    processTracking: false,
  });
  const usage = computed(() => ({
    favorites: planInfo.value?.usage.favorites ?? favorites.value.length,
    comparisons: planInfo.value?.usage.comparisons ?? comparisons.value.length,
  }));

  const favoritesLimitLabel = computed(() => {
    const limit = planInfo.value?.limits.favorites;
    return limit === null ? `${favorites.value.length}/Ilimitados` : `${favorites.value.length}/${limit}`;
  });

  const comparisonsLimitLabel = computed(() => {
    const limit = planInfo.value?.limits.comparisons || 3;
    return `${comparisons.value.length}/${limit}`;
  });

  const canAddFavorite = computed(() => {
    const limit = limits.value.favorites;
    return limit === null || limit === undefined || usage.value.favorites < limit;
  });

  const canAddComparison = computed(() => {
    const limit = limits.value.comparisons || 3;
    return usage.value.comparisons < limit;
  });

  const run = async <T>(callback: () => Promise<T>) => {
    try {
      loading.value = true;
      error.value = null;
      return await callback();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando modulo estudiante';
      const details = (err as Error & { details?: { recommendedPlan?: StudentPlan } }).details;
      if ((err as Error & { status?: number }).status === 402) {
        upsell.value = {
          message: error.value,
          recommendedPlan: details?.recommendedPlan || 'basic',
        };
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchProfile = () =>
    run(async () => {
      const response = await api.get<{ profile: StudentProfile } & Omit<StudentPlanInfo, 'plans'>>('/student/profile');
      profile.value = response.data.profile;
      planInfo.value = {
        plan: response.data.plan,
        estadoSuscripcion: response.data.estadoSuscripcion,
        fechaInicioPlan: response.data.fechaInicioPlan,
        fechaFinPlan: response.data.fechaFinPlan,
        limits: {
          ...getDefaultLimits(response.data.plan),
          ...response.data.limits,
        },
        usage: response.data.usage,
        features: response.data.features,
        plans: planInfo.value?.plans || getDefaultPlans(),
      };
      return profile.value;
    });

  const updateProfile = (payload: StudentProfile) =>
    run(async () => {
      const response = await api.put<{ profile: StudentProfile }>('/student/profile', payload);
      profile.value = response.data.profile;
      return profile.value;
    });

  const fetchFavorites = (tipo?: StudentReferenceType) =>
    run(async () => {
      const response = await api.get<{ favorites: StudentReferenceItem[] }>('/student/favorites', {
        params: tipo ? { tipo } : undefined,
      });
      favorites.value = response.data.favorites;
      return favorites.value;
    });

  const addFavorite = (tipo: StudentReferenceType, refId: string) =>
    run(async () => {
      const response = await api.post<{ favorite: StudentReferenceItem }>('/student/favorites', { tipo, refId });
      favorites.value = [response.data.favorite, ...favorites.value.filter((item) => item.id !== response.data.favorite.id)];
      void fetchPlan();
      return response.data.favorite;
    });

  const deleteFavorite = (id: string) =>
    run(async () => {
      await api.delete(`/student/favorites/${id}`);
      favorites.value = favorites.value.filter((item) => item.id !== id);
      void fetchPlan();
    });

  const fetchComparisons = () =>
    run(async () => {
      const response = await api.get<{ comparisons: StudentReferenceItem[] }>('/student/comparisons');
      comparisons.value = response.data.comparisons;
      return comparisons.value;
    });

  const addComparison = (tipo: StudentReferenceType, refId: string) =>
    run(async () => {
      const response = await api.post<{ comparison: StudentReferenceItem }>('/student/comparisons', { tipo, refId });
      comparisons.value = [
        response.data.comparison,
        ...comparisons.value.filter((item) => item.id !== response.data.comparison.id),
      ];
      void fetchPlan();
      return response.data.comparison;
    });

  const deleteComparison = (id: string) =>
    run(async () => {
      await api.delete(`/student/comparisons/${id}`);
      comparisons.value = comparisons.value.filter((item) => item.id !== id);
      void fetchPlan();
    });

  const fetchRecommendations = () =>
    run(async () => {
      const response = await api.get<{ recommendations: StudentRecommendation[]; upsell?: UpsellMessage | null }>('/student/recommendations');
      recommendations.value = response.data.recommendations;
      upsell.value = response.data.upsell || upsell.value;
      return recommendations.value;
    });

  const fetchAlerts = () =>
    run(async () => {
      const response = await api.get<{ alerts: StudentAlert[]; upsell?: UpsellMessage | null }>('/student/alerts');
      alerts.value = response.data.alerts;
      upsell.value = response.data.upsell || upsell.value;
      return alerts.value;
    });

  const fetchInsights = () =>
    run(async () => {
      const response = await api.get<StudentInsights>('/student/insights');
      insights.value = response.data;
      upsell.value = response.data.upsell || upsell.value;
      return insights.value;
    });

  const fetchPlan = () =>
    run(async () => {
      const response = await api.get<StudentPlanInfo>('/student/plan');
      planInfo.value = {
        ...response.data,
        limits: {
          ...getDefaultLimits(response.data.plan),
          ...response.data.limits,
        },
        plans: response.data.plans || getDefaultPlans(),
      };
      return planInfo.value;
    });

  const fetchApplications = () =>
    run(async () => {
      const response = await api.get<{ applications: StudentApplication[] }>('/student/applications');
      applications.value = response.data.applications;
      return applications.value;
    });

  const fetchApplication = (id: string) =>
    run(async () => {
      const response = await api.get<{
        application: StudentApplication;
        requirements: ApplicationRequirement[];
        timeline: ApplicationTimelineItem[];
      }>(`/student/applications/${id}`);
      selectedApplication.value = response.data.application;
      applicationRequirements.value = response.data.requirements;
      applicationTimeline.value = response.data.timeline;
      applications.value = [
        response.data.application,
        ...applications.value.filter((item) => item.id !== response.data.application.id),
      ];
      return response.data;
    });

  const createApplication = (programId: string, payload: { notas?: string; fechaLimite?: string | null } = {}) =>
    run(async () => {
      const response = await api.post<{ application: StudentApplication }>('/student/applications', {
        programId,
        ...payload,
      });
      applications.value = [
        response.data.application,
        ...applications.value.filter((item) => item.id !== response.data.application.id),
      ];
      selectedApplication.value = response.data.application;
      return response.data.application;
    });

  const updateApplicationStatus = (id: string, estado: StudentApplicationStatus, comentario?: string) =>
    run(async () => {
      const response = await api.put<{ application: StudentApplication }>(`/student/applications/${id}/status`, {
        estado,
        comentario,
      });
      selectedApplication.value = response.data.application;
      applications.value = applications.value.map((item) =>
        item.id === response.data.application.id ? response.data.application : item
      );
      await fetchApplication(id);
      return response.data.application;
    });

  const addApplicationRequirement = (
    applicationId: string,
    payload: { nombre: string; descripcion?: string; obligatorio?: boolean }
  ) =>
    run(async () => {
      const response = await api.post<{ requirement: ApplicationRequirement }>(
        `/student/applications/${applicationId}/requirements`,
        payload
      );
      applicationRequirements.value = [...applicationRequirements.value, response.data.requirement];
      await fetchApplication(applicationId);
      return response.data.requirement;
    });

  const updateApplicationRequirement = (
    applicationId: string,
    requirementId: string,
    payload: Partial<Pick<ApplicationRequirement, 'nombre' | 'descripcion' | 'obligatorio' | 'completado' | 'archivoUrl'>>
  ) =>
    run(async () => {
      const response = await api.put<{ requirement: ApplicationRequirement }>(
        `/student/applications/${applicationId}/requirements/${requirementId}`,
        payload
      );
      applicationRequirements.value = applicationRequirements.value.map((item) =>
        item.id === response.data.requirement.id ? response.data.requirement : item
      );
      await fetchApplication(applicationId);
      return response.data.requirement;
    });

  const fetchApplicationTimeline = (id: string) =>
    run(async () => {
      const response = await api.get<{ timeline: ApplicationTimelineItem[] }>(`/student/applications/${id}/timeline`);
      applicationTimeline.value = response.data.timeline;
      return applicationTimeline.value;
    });

  const upgradePlan = (plan: StudentPlan) =>
    run(async () => {
      await api.post('/student/upgrade-plan', { plan });
      return fetchPlan();
    });

  const hydrateDashboard = async () => {
    await Promise.all([
      fetchProfile(),
      fetchPlan(),
      fetchFavorites(),
      fetchComparisons(),
      fetchRecommendations(),
      fetchAlerts(),
      fetchInsights(),
    ]);
  };

  const isFavorite = (tipo: StudentReferenceType, refId: string) =>
    favorites.value.some((item) => item.tipo === tipo && item.refId === refId);

  const isInComparison = (tipo: StudentReferenceType, refId: string) =>
    comparisons.value.some((item) => item.tipo === tipo && item.refId === refId);

  const getUpgradeTarget = (feature: StudentFeature): StudentPlan => {
    if (feature === 'plusInsights' || feature === 'advancedRecommendations') return 'plus';
    if (feature === 'applications') return 'plus';
    if (feature === 'favorites' && plan.value === 'basic') return 'plus';
    if (feature === 'comparisons' && plan.value === 'basic') return 'plus';
    return 'basic';
  };

  const isLimitReached = (feature: StudentFeature) => {
    if (feature === 'favorites') {
      const limit = limits.value.favorites;
      return limit !== null && limit !== undefined && usage.value.favorites >= limit;
    }

    if (feature === 'comparisons') {
      return usage.value.comparisons >= limits.value.comparisons;
    }

    return false;
  };

  const canUseFeature = (feature: StudentFeature) => {
    if (feature === 'favorites' || feature === 'comparisons') return !isLimitReached(feature);
    if (feature === 'alerts') return plan.value === 'basic' || plan.value === 'plus';
    if (feature === 'advisor') return Boolean(limits.value.advisorAccess);
    if (feature === 'advancedRecommendations' || feature === 'plusInsights' || feature === 'applications') return plan.value === 'plus';
    return true;
  };

  const openUpgradeModal = (message: string, recommendedPlan: StudentPlan) => {
    upsell.value = { message, recommendedPlan };
  };

  const dismissUpgradeModal = () => {
    upsell.value = null;
  };

  return {
    profile,
    favorites,
    comparisons,
    recommendations,
    alerts,
    insights,
    applications,
    selectedApplication,
    applicationRequirements,
    applicationTimeline,
    planInfo,
    plan,
    limits,
    usage,
    loading,
    error,
    upsell,
    favoritesLimitLabel,
    comparisonsLimitLabel,
    canAddFavorite,
    canAddComparison,
    canUseFeature,
    isLimitReached,
    getUpgradeTarget,
    openUpgradeModal,
    dismissUpgradeModal,
    fetchProfile,
    updateProfile,
    fetchFavorites,
    addFavorite,
    deleteFavorite,
    fetchComparisons,
    addComparison,
    deleteComparison,
    fetchRecommendations,
    fetchAlerts,
    fetchInsights,
    fetchPlan,
    fetchApplications,
    fetchApplication,
    createApplication,
    updateApplicationStatus,
    addApplicationRequirement,
    updateApplicationRequirement,
    fetchApplicationTimeline,
    upgradePlan,
    hydrateDashboard,
    isFavorite,
    isInComparison,
  };
});
