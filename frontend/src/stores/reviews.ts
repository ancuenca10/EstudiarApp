import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { Review, ReviewFormData, ReviewStats } from '@/types/reviews';

type ApiReview = Record<string, any>;

const statusFromApi = (status?: string): Review['status'] => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aprobada' || normalized === 'approved') return 'approved';
  if (normalized === 'rechazada' || normalized === 'rejected') return 'rejected';
  return 'pending';
};

const typeFromApi = (type?: string): Review['entityType'] => {
  const normalized = (type || '').toLowerCase();
  return normalized === 'programa' || normalized === 'program' ? 'program' : 'university';
};

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const unwrapReviews = (payload: unknown): ApiReview[] => {
  const data = payload as Record<string, any>;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.reviews)) return data.reviews;
  return [];
};

const unwrapReview = (payload: unknown): ApiReview => {
  const data = payload as Record<string, any>;
  return data.data || data.review || data;
};

const mapReview = (review: ApiReview): Review => {
  const entityType = typeFromApi(review.entityType || review.tipo);
  const entityId = review.entityId || review.referenciaId || review.referencia_id || '';

  return {
    id: review.id,
    entityId,
    entityType,
    userId: review.userId || review.user_id || '',
    userName: review.userName || review.user_name || 'Usuario',
    userAvatar: review.userAvatar,
    rating: Number(review.rating || 0),
    title: review.title || review.titulo || '',
    content: review.content || review.contenido || '',
    pros: toArray(review.pros),
    cons: toArray(review.cons || review.contras),
    wouldRecommend: Boolean(review.wouldRecommend ?? Number(review.rating || 0) >= 4),
    helpfulCount: Number(review.helpfulCount || 0),
    notHelpfulCount: Number(review.notHelpfulCount || 0),
    createdAt: new Date(review.createdAt || review.created_at || Date.now()),
    updatedAt: review.updatedAt || review.updated_at ? new Date(review.updatedAt || review.updated_at) : undefined,
    isVerifiedStudent: Boolean(review.isVerifiedStudent ?? true),
    status: statusFromApi(review.status || review.estado),
    universityReply: review.universityReply || review.respuestaUniversidad || review.respuesta_universidad || undefined,
    replyDate: review.replyDate ? new Date(review.replyDate) : undefined,
    studyYear: review.studyYear,
    graduationYear: review.graduationYear,
    referenciaNombre: review.referenciaNombre,
    programId: entityType === 'program' ? entityId : undefined,
    universityId: entityType === 'university' ? entityId : undefined,
  };
};

const statusToApi = (status: Review['status']) => {
  const map = {
    pending: 'pendiente',
    approved: 'aprobada',
    rejected: 'rechazada',
    reported: 'pendiente',
  } as const;
  return map[status];
};

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref<Review[]>([]);
  const homeReviews = ref<Review[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authStore = useAuthStore();

  const allReviews = computed(() => reviews.value);
  const pendingReviews = computed(() => reviews.value.filter((review) => review.status === 'pending'));
  const approvedReviews = computed(() => reviews.value.filter((review) => review.status === 'approved'));
  const rejectedReviews = computed(() => reviews.value.filter((review) => review.status === 'rejected'));
  const reportedReviews = computed<Review[]>(() => []);
  const userReviews = computed(() =>
    reviews.value.filter((review) => review.userId === authStore.user?.id)
  );

  const run = async <T>(task: () => Promise<T>, fallbackMessage: string) => {
    try {
      loading.value = true;
      error.value = null;
      return await task();
    } catch (err) {
      error.value = err instanceof Error ? err.message : fallbackMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setReview = (review: Review) => {
    reviews.value = [review, ...reviews.value.filter((item) => item.id !== review.id)];
    homeReviews.value = homeReviews.value.map((item) => (item.id === review.id ? review : item));
  };

  const removeReview = (reviewId: string) => {
    reviews.value = reviews.value.filter((review) => review.id !== reviewId);
    homeReviews.value = homeReviews.value.filter((review) => review.id !== reviewId);
  };

  const fetchAllReviews = async () => {
    return run(async () => {
      const response = await api.get('/reviews');
      reviews.value = unwrapReviews(response.data).map(mapReview);
      return reviews.value;
    }, 'Error cargando resenas');
  };

  const fetchAdminReviews = fetchAllReviews;

  const fetchHomeReviews = async () => {
    return run(async () => {
      const response = await api.get('/reviews/home');
      homeReviews.value = unwrapReviews(response.data).map(mapReview);
      return homeReviews.value;
    }, 'Error cargando resenas del inicio');
  };

  const createReview = async (payload: ReviewFormData | Partial<Review>) => {
    return run(async () => {
      const response = await api.post('/reviews', {
        tipo: payload.entityType,
        referenciaId: payload.entityId,
        rating: payload.rating,
        titulo: payload.title,
        contenido: payload.content,
        pros: payload.pros || [],
        contras: payload.cons || [],
      });
      const review = mapReview(unwrapReview(response.data));
      setReview(review);
      return review;
    }, 'Error creando resena');
  };

  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    return run(async () => {
      const response = await api.put(`/reviews/${reviewId}`, {
        rating: updates.rating,
        titulo: updates.title,
        contenido: updates.content,
        pros: updates.pros,
        contras: updates.cons,
        respuestaUniversidad: updates.universityReply,
      });
      const review = mapReview(unwrapReview(response.data));
      setReview(review);
      return review;
    }, 'Error actualizando resena');
  };

  const deleteReview = async (reviewId: string) => {
    return run(async () => {
      await api.delete(`/reviews/${reviewId}`);
      removeReview(reviewId);
    }, 'Error eliminando resena');
  };

  const changeReviewStatus = async (reviewId: string, status: Review['status']) => {
    return run(async () => {
      const response = await api.patch(`/reviews/${reviewId}/status`, {
        estado: statusToApi(status),
      });
      const review = mapReview(unwrapReview(response.data));
      setReview(review);
      return review;
    }, 'Error cambiando estado de resena');
  };

  const approveReview = (reviewId: string) => changeReviewStatus(reviewId, 'approved');
  const rejectReview = (reviewId: string, _reason?: string) => changeReviewStatus(reviewId, 'rejected');
  const addReview = createReview;

  const getReviewsByEntity = computed(() => (entityId: string, entityType: Review['entityType']) => {
    return reviews.value.filter((review) =>
      review.entityId === entityId &&
      review.entityType === entityType &&
      review.status === 'approved'
    );
  });

  const getTopReviews = computed(() => (entityId: string, entityType: Review['entityType'], limit = 3) => {
    return getReviewsByEntity.value(entityId, entityType)
      .sort((a, b) => (b.helpfulCount - b.notHelpfulCount) - (a.helpfulCount - a.notHelpfulCount))
      .slice(0, limit);
  });

  const getRecentReviews = computed(() => (entityId: string, entityType: Review['entityType'], limit = 3) => {
    return getReviewsByEntity.value(entityId, entityType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  });

  const reviewStatsByEntity = computed(() => (entityId: string, entityType: Review['entityType']): ReviewStats => {
    const entityReviews = getReviewsByEntity.value(entityId, entityType);
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    entityReviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution] += 1;
    });

    const totalRating = entityReviews.reduce((sum, review) => sum + review.rating, 0);
    const recommended = entityReviews.filter((review) => review.wouldRecommend).length;

    return {
      entityId,
      entityType,
      averageRating: entityReviews.length ? totalRating / entityReviews.length : 0,
      totalReviews: entityReviews.length,
      ratingDistribution,
      wouldRecommendPercentage: entityReviews.length ? (recommended / entityReviews.length) * 100 : 0,
      pros: [],
      cons: [],
    };
  });

  const getReviewStats = (entityId: string, entityType: Review['entityType'] = 'program'): ReviewStats =>
    reviewStatsByEntity.value(entityId, entityType);

  const getUserReviewForEntity = computed(() => (entityId: string, entityType: Review['entityType']) => {
    return reviews.value.find((review) =>
      review.entityId === entityId &&
      review.entityType === entityType &&
      review.userId === authStore.user?.id
    );
  });

  const getUniversityReviews = (universityId: string) => getReviewsByEntity.value(universityId, 'university');
  const getProgramReviews = (programId: string) => getReviewsByEntity.value(programId, 'program');
  const getReviewsByProgram = getProgramReviews;
  const getUniversityStats = (universityId: string) => getReviewStats(universityId, 'university');
  const getProgramStats = (programId: string) => getReviewStats(programId, 'program');
  const loadProgramReviews = async (_programId: string) => fetchHomeReviews();

  const voteHelpful = (reviewId: string, isHelpful: boolean) => {
    const review = reviews.value.find((item) => item.id === reviewId);
    if (!review) return;
    if (isHelpful) review.helpfulCount += 1;
    else review.notHelpfulCount += 1;
  };

  const addUniversityReply = (reviewId: string, reply: string) => {
    return updateReview(reviewId, { universityReply: reply });
  };

  const reportReview = (_reviewId?: string, _reason?: string, _userId?: string) => {
    error.value = 'Reporte de resenas no disponible todavia';
  };

  const filterReviews = (options: {
    entityId?: string;
    entityType?: Review['entityType'];
    minRating?: number;
    maxRating?: number;
    wouldRecommend?: boolean;
    hasReply?: boolean;
    sortBy?: 'recent' | 'helpful' | 'rating' | 'highest' | 'lowest';
    searchQuery?: string;
  }) => {
    let filtered = [...reviews.value].filter((review) => review.status === 'approved');

    if (options.entityId) filtered = filtered.filter((review) => review.entityId === options.entityId);
    if (options.entityType) filtered = filtered.filter((review) => review.entityType === options.entityType);
    if (options.minRating !== undefined) filtered = filtered.filter((review) => review.rating >= options.minRating!);
    if (options.maxRating !== undefined) filtered = filtered.filter((review) => review.rating <= options.maxRating!);
    if (options.wouldRecommend !== undefined) {
      filtered = filtered.filter((review) => review.wouldRecommend === options.wouldRecommend);
    }
    if (options.hasReply !== undefined) {
      filtered = filtered.filter((review) => Boolean(review.universityReply) === options.hasReply);
    }
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter((review) =>
        review.title.toLowerCase().includes(query) ||
        review.content.toLowerCase().includes(query) ||
        review.userName.toLowerCase().includes(query)
      );
    }

    if (options.sortBy === 'recent') filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options.sortBy === 'helpful') {
      filtered.sort((a, b) => (b.helpfulCount - b.notHelpfulCount) - (a.helpfulCount - a.notHelpfulCount));
    }
    if (options.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    if (options.sortBy === 'highest') filtered.sort((a, b) => b.rating - a.rating);
    if (options.sortBy === 'lowest') filtered.sort((a, b) => a.rating - b.rating);

    return filtered;
  };

  return {
    reviews,
    homeReviews,
    loading,
    error,
    allReviews,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    reportedReviews,
    userReviews,
    fetchAllReviews,
    fetchAdminReviews,
    fetchHomeReviews,
    createReview,
    addReview,
    updateReview,
    deleteReview,
    changeReviewStatus,
    approveReview,
    rejectReview,
    getReviewsByEntity,
    getTopReviews,
    getRecentReviews,
    getReviewStats,
    getUserReviewForEntity,
    getUniversityReviews,
    getProgramReviews,
    getReviewsByProgram,
    getUniversityStats,
    getProgramStats,
    loadProgramReviews,
    voteHelpful,
    addUniversityReply,
    reportReview,
    filterReviews,
  };
});
