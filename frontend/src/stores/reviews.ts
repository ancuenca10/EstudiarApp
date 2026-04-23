// src/stores/reviews.ts - VERSIÓN COMPLETA
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Review, ReviewStats, ReviewFormData } from '@/types/reviews';

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref<Review[]>([]);
  const userReviews = computed(() => reviews.value.filter(r => r.userId === 'current-user')); // Reemplazar con ID real del usuario

  // === COMPUTED PROPERTIES MEJORADAS ===
  
  const getReviewsByEntity = computed(() => (entityId: string, entityType: 'university' | 'program') => {
    return reviews.value.filter(review => 
      review.entityId === entityId && 
      review.entityType === entityType &&
      review.status === 'approved'
    );
  });

  const getTopReviews = computed(() => (entityId: string, entityType: 'university' | 'program', limit: number = 3) => {
    const entityReviews = getReviewsByEntity.value(entityId, entityType);
    return entityReviews
      .sort((a, b) => (b.helpfulCount - b.notHelpfulCount) - (a.helpfulCount - a.notHelpfulCount))
      .slice(0, limit);
  });

  const getRecentReviews = computed(() => (entityId: string, entityType: 'university' | 'program', limit: number = 3) => {
    const entityReviews = getReviewsByEntity.value(entityId, entityType);
    return entityReviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  });

  const getReviewStats = computed(() => (entityId: string, entityType: 'university' | 'program'): ReviewStats => {
    const entityReviews = getReviewsByEntity.value(entityId, entityType);
    
    if (entityReviews.length === 0) {
      return {
        entityId,
        entityType,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        wouldRecommendPercentage: 0,
        pros: [],
        cons: [],
      };
    }

    const totalRating = entityReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / entityReviews.length;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allPros: Record<string, number> = {};
    const allCons: Record<string, number> = {};
    
    entityReviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      
      review.pros.forEach(pro => {
        allPros[pro] = (allPros[pro] || 0) + 1;
      });
      
      review.cons.forEach(con => {
        allCons[con] = (allCons[con] || 0) + 1;
      });
    });

    const wouldRecommendCount = entityReviews.filter(r => r.wouldRecommend).length;
    const wouldRecommendPercentage = (wouldRecommendCount / entityReviews.length) * 100;

    // Obtener pros y cons más comunes
    const topPros = Object.entries(allPros)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pro]) => pro);

    const topCons = Object.entries(allCons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([con]) => con);

    return {
      entityId,
      entityType,
      averageRating,
      totalReviews: entityReviews.length,
      ratingDistribution,
      wouldRecommendPercentage,
      pros: topPros,
      cons: topCons,
    };
  });

  const getUserReviewForEntity = computed(() => (entityId: string, entityType: 'university' | 'program') => {
    return reviews.value.find(review => 
      review.entityId === entityId && 
      review.entityType === entityType &&
      review.userId === 'current-user' // Reemplazar con ID real
    );
  });

  // === MÉTODOS COMPLETOS ===

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt' | 'helpfulCount' | 'notHelpfulCount' | 'status'>) => {
    // Verificar si el usuario ya tiene una reseña para esta entidad
    const existingReview = getUserReviewForEntity.value(reviewData.entityId, reviewData.entityType);
    if (existingReview) {
      throw new Error('Ya has escrito una reseña para esta entidad');
    }

    const newReview: Review = {
      ...reviewData,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      helpfulCount: 0,
      notHelpfulCount: 0,
      status: 'pending',
      isVerifiedStudent: true, // Temporal - integrar con autenticación real
    };
    
    reviews.value.push(newReview);
    saveToLocalStorage();
    
    return newReview;
  };

  const updateReview = (reviewId: string, updates: Partial<Review>) => {
    const index = reviews.value.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      reviews.value[index] = {
        ...reviews.value[index],
        ...updates,
        updatedAt: new Date(),
      };
      saveToLocalStorage();
    }
  };

  const deleteReview = (reviewId: string) => {
    const index = reviews.value.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      reviews.value.splice(index, 1);
      saveToLocalStorage();
    }
  };

  const voteHelpful = (reviewId: string, isHelpful: boolean) => {
    const review = reviews.value.find(r => r.id === reviewId);
    if (review) {
      if (isHelpful) {
        review.helpfulCount++;
      } else {
        review.notHelpfulCount++;
      }
      saveToLocalStorage();
    }
  };

  const addUniversityReply = (reviewId: string, reply: string) => {
    const review = reviews.value.find(r => r.id === reviewId);
    if (review) {
      review.universityReply = reply;
      review.replyDate = new Date();
      saveToLocalStorage();
    }
  };

  const filterReviews = (options: {
    entityId?: string;
    entityType?: 'university' | 'program';
    minRating?: number;
    maxRating?: number;
    wouldRecommend?: boolean;
    hasReply?: boolean;
    sortBy?: 'recent' | 'helpful' | 'rating';
    searchQuery?: string;
  }) => {
    let filtered = [...reviews.value].filter(r => r.status === 'approved');

    if (options.entityId) {
      filtered = filtered.filter(r => r.entityId === options.entityId);
    }
    
    if (options.entityType) {
      filtered = filtered.filter(r => r.entityType === options.entityType);
    }
    
    if (options.minRating !== undefined) {
      filtered = filtered.filter(r => r.rating >= options.minRating!);
    }
    
    if (options.maxRating !== undefined) {
      filtered = filtered.filter(r => r.rating <= options.maxRating!);
    }
    
    if (options.wouldRecommend !== undefined) {
      filtered = filtered.filter(r => r.wouldRecommend === options.wouldRecommend);
    }
    
    if (options.hasReply !== undefined) {
      if (options.hasReply) {
        filtered = filtered.filter(r => r.universityReply);
      } else {
        filtered = filtered.filter(r => !r.universityReply);
      }
    }
    
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.content.toLowerCase().includes(query) ||
        r.userName.toLowerCase().includes(query)
      );
    }

    // Ordenar
    switch (options.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'helpful':
        filtered.sort((a, b) => {
          const aScore = a.helpfulCount - a.notHelpfulCount;
          const bScore = b.helpfulCount - b.notHelpfulCount;
          return bScore - aScore;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  };

  // === PERSISTENCIA ===
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('estudiarapp-reviews', JSON.stringify(reviews.value));
    } catch (error) {
      console.error('Error guardando reseñas:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('estudiarapp-reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        reviews.value = parsed.map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt),
          updatedAt: review.updatedAt ? new Date(review.updatedAt) : undefined,
          replyDate: review.replyDate ? new Date(review.replyDate) : undefined,
        }));
      }
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    }
  };

  // === INICIALIZACIÓN ===
  loadFromLocalStorage();

  return {
    // Estado
    reviews,
    userReviews,
    
    // Computed
    getReviewsByEntity,
    getTopReviews,
    getRecentReviews,
    getReviewStats,
    getUserReviewForEntity,
    
    // Métodos
    addReview,
    updateReview,
    deleteReview,
    voteHelpful,
    addUniversityReply,
    filterReviews,
    
    // Utilitarios
    saveToLocalStorage,
  };
});