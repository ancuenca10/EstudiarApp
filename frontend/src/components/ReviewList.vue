<template>
  <div class="review-list">
    <div class="reviews-header">
      <h3>Reseñas ({{ filteredReviews.length }})</h3>
      
      <div class="filters">
        <select v-model="filters.sortBy" class="filter-select" @change="applyFilters">
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="highest">Mejor calificadas</option>
          <option value="lowest">Peor calificadas</option>
          <option value="most_helpful">Más útiles</option>
        </select>

        <select v-model="filters.minRating" class="filter-select" @change="applyFilters">
          <option :value="0">Todas las calificaciones</option>
          <option value="5">5 estrellas</option>
          <option value="4">4+ estrellas</option>
          <option value="3">3+ estrellas</option>
        </select>

        <label class="filter-checkbox">
          <input type="checkbox" v-model="filters.verifiedOnly" @change="applyFilters">
          <span>Solo estudiantes verificados</span>
        </label>

        <label class="filter-checkbox">
          <input type="checkbox" v-model="filters.withCommentsOnly" @change="applyFilters">
          <span>Solo con comentarios</span>
        </label>
      </div>
    </div>

    <div v-if="filteredReviews.length === 0" class="no-reviews">
      <div class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p>No hay reseñas para mostrar con los filtros seleccionados.</p>
        <p v-if="!hasReviews">¡Sé el primero en dejar una reseña!</p>
      </div>
    </div>

    <div v-else class="reviews-grid">
      <div v-for="review in filteredReviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div class="user-info">
            <img 
              :src="review.userAvatar" 
              :alt="review.userName"
              class="user-avatar"
            >
            <div class="user-details">
              <div class="user-name">
                {{ review.userName }}
                <span v-if="review.isVerifiedStudent" class="verified-badge" title="Estudiante verificado">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
              </div>
              <div class="review-date">
                {{ formatDate(review.createdAt) }}
              </div>
            </div>
          </div>
          
          <div class="review-rating">
            <RatingStars :rating="review.rating" :showCount="false" />
            <div class="recommendation" v-if="review.wouldRecommend">
              <span class="recommend-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </span>
              <span>Recomienda esta {{ entityType === 'university' ? 'universidad' : 'programa' }}</span>
            </div>
          </div>
        </div>

        <div class="review-content">
          <h4 class="review-title">{{ review.title }}</h4>
          <p class="review-text">{{ review.content }}</p>
          
          <div v-if="review.pros.length > 0" class="pros-cons-section">
            <div class="section-label">Puntos positivos:</div>
            <ul class="pros-list">
              <li v-for="(pro, index) in review.pros" :key="`pro-${index}`">
                {{ pro }}
              </li>
            </ul>
          </div>
          
          <div v-if="review.cons.length > 0" class="pros-cons-section">
            <div class="section-label">Puntos a mejorar:</div>
            <ul class="cons-list">
              <li v-for="(con, index) in review.cons" :key="`con-${index}`">
                {{ con }}
              </li>
            </ul>
          </div>
        </div>

        <div class="review-footer">
          <div class="helpful-actions">
            <button 
              @click="toggleHelpful(review.id, true)"
              class="helpful-btn"
              :class="{ active: userVotes[review.id] === 'helpful' }"
              :title="`${review.helpfulCount} personas encontraron útil esta reseña`"
            >
              <span class="btn-icon">👍</span>
              Útil ({{ review.helpfulCount }})
            </button>
            
            <button 
              @click="toggleHelpful(review.id, false)"
              class="not-helpful-btn"
              :class="{ active: userVotes[review.id] === 'not-helpful' }"
              :title="`${review.notHelpfulCount} personas no encontraron útil esta reseña`"
            >
              <span class="btn-icon">👎</span>
              No útil ({{ review.notHelpfulCount }})
            </button>
          </div>
          
          <button 
            v-if="isCurrentUserReview(review)"
            @click="$emit('edit', review)"
            class="action-btn edit-btn"
          >
            Editar
          </button>
        </div>
      </div>
    </div>

    <div v-if="hasMoreReviews" class="load-more">
      <button @click="$emit('load-more')" class="btn btn-secondary">
        Cargar más reseñas
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import RatingStars from './RatingStars.vue';
import type { Review } from '@/types/reviews';

interface Props {
  entityId: string;
  entityType: 'university' | 'program';
  reviews?: Review[];
}

const props = defineProps<Props>();
const emit = defineEmits(['edit', 'load-more']);

const reviewsStore = useReviewsStore();

const filters = ref({
  sortBy: 'newest',
  minRating: 0,
  verifiedOnly: false,
  withCommentsOnly: false
});

const userVotes = ref<Record<string, 'helpful' | 'not-helpful'>>({});

// Obtener todas las reseñas para esta entidad
const allReviews = computed(() => {
  if (props.reviews && props.reviews.length > 0) {
    return props.reviews;
  }
  return reviewsStore.getReviewsByEntity(props.entityId, props.entityType);
});

const filteredReviews = computed(() => {
  let filtered = [...allReviews.value];

  // Filtrar por calificación mínima
  if (filters.value.minRating > 0) {
    filtered = filtered.filter(review => review.rating >= filters.value.minRating);
  }

  // Solo estudiantes verificados
  if (filters.value.verifiedOnly) {
    filtered = filtered.filter(review => review.isVerifiedStudent);
  }

  // Solo con comentarios
  if (filters.value.withCommentsOnly) {
    filtered = filtered.filter(review => review.content && review.content.trim().length > 0);
  }

  // Ordenar
  switch (filters.value.sortBy) {
    case 'newest':
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'oldest':
      filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      break;
    case 'highest':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      filtered.sort((a, b) => a.rating - b.rating);
      break;
    case 'most_helpful':
      filtered.sort((a, b) => {
        const aScore = a.helpfulCount - a.notHelpfulCount;
        const bScore = b.helpfulCount - b.notHelpfulCount;
        return bScore - aScore;
      });
      break;
  }

  return filtered;
});

const hasReviews = computed(() => allReviews.value.length > 0);
const hasMoreReviews = computed(() => filteredReviews.value.length > 5);

const formatDate = (date: Date) => {
  const now = new Date();
  const reviewDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else {
    return reviewDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const toggleHelpful = (reviewId: string, isHelpful: boolean) => {
  const currentVote = userVotes.value[reviewId];
  
  // Si ya votó igual, quitar el voto
  if (currentVote === (isHelpful ? 'helpful' : 'not-helpful')) {
    delete userVotes.value[reviewId];
    // Aquí en una implementación real restaríamos del contador
  } else {
    userVotes.value[reviewId] = isHelpful ? 'helpful' : 'not-helpful';
    reviewsStore.voteHelpful(reviewId, isHelpful);
  }
};

const isCurrentUserReview = (review: Review) => {
  // En una implementación real, esto vendría de un store de autenticación
  return review.userId === 'current-user';
};

const applyFilters = () => {
  // Los computed properties ya reaccionan a los cambios
};

// Reset filters cuando cambia la entidad
watch(() => [props.entityId, props.entityType], () => {
  filters.value = {
    sortBy: 'newest',
    minRating: 0,
    verifiedOnly: false,
    withCommentsOnly: false
  };
}, { immediate: true });
</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reviews-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.reviews-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 160px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  color: #4b5563;
}

.filter-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
}

.no-reviews {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #9ca3af;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  stroke-width: 1.5;
  color: #d1d5db;
}

.empty-state p {
  margin: 0;
  max-width: 300px;
}

.reviews-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
  color: #1f2937;
}

.verified-badge {
  color: #10b981;
  display: flex;
  align-items: center;
}

.verified-badge svg {
  width: 1rem;
  height: 1rem;
}

.review-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.review-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #10b981;
  background-color: #f0fdf4;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.recommend-icon svg {
  width: 0.875rem;
  height: 0.875rem;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.review-text {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.pros-cons-section {
  margin-top: 0.5rem;
}

.section-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.pros-list,
.cons-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.pros-list li,
.cons-list li {
  padding-left: 1.5rem;
  position: relative;
  color: #4b5563;
  line-height: 1.5;
}

.pros-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.cons-list li::before {
  content: "✗";
  position: absolute;
  left: 0;
  color: #ef4444;
  font-weight: bold;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.helpful-actions {
  display: flex;
  gap: 0.75rem;
}

.helpful-btn,
.not-helpful-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.helpful-btn:hover {
  border-color: #10b981;
  color: #10b981;
  background-color: #f0fdf4;
}

.helpful-btn.active {
  border-color: #10b981;
  background-color: #10b981;
  color: white;
}

.not-helpful-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background-color: #fef2f2;
}

.not-helpful-btn.active {
  border-color: #ef4444;
  background-color: #ef4444;
  color: white;
}

.btn-icon {
  font-size: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background-color: #eff6ff;
}

.edit-btn {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.edit-btn:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.load-more {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .review-rating {
    align-items: flex-start;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .review-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .helpful-actions {
    justify-content: center;
  }
  
  .action-btn {
    width: 100%;
    text-align: center;
  }
}
</style>