<!-- src/components/reviews/ProgramReviewsModal.vue -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="reviews-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2>
            <span class="header-icon">📚</span>
            Reseñas de {{ program.name }}
          </h2>
          <button @click="closeModal" class="close-btn">
            ×
          </button>
        </div>
        <div class="program-info">
          <div class="program-details">
            <h3>{{ program.name }}</h3>
            <div class="program-meta">
              <span class="meta-item">{{ program.level }}</span>
              <span class="meta-item">{{ program.modality }}</span>
              <span class="meta-item">{{ program.duration }}</span>
              <span class="meta-item">${{ program.price?.toLocaleString() }}</span>
            </div>
            <p class="program-description">{{ program.description }}</p>
            <div class="program-stats">
              <span class="stat-item">
                <strong>{{ stats.totalReviews }}</strong> reseñas
              </span>
              <span class="stat-item">
                <strong>{{ stats.averageRating.toFixed(1) }}</strong> calificación promedio
              </span>
              <span class="stat-item">
                <strong>{{ stats.wouldRecommendPercentage.toFixed(0) }}%</strong> lo recomiendan
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="modal-content">
        <!-- Pestañas -->
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Formulario para nueva reseña -->
        <div v-if="activeTab === 'write'" class="write-review-tab">
          <ReviewForm
            :type="'program'"
            :target-id="program._id"
            :target-name="program.name"
            @submit="handleSubmitReview"
            @cancel="activeTab = 'reviews'"
          />
        </div>

        <!-- Lista de reseñas -->
        <div v-if="activeTab === 'reviews'" class="reviews-tab">
          <!-- Filtros -->
          <div class="reviews-filters">
            <div class="filter-group">
              <label>Ordenar por:</label>
              <select v-model="filters.sortBy" class="filter-select">
                <option value="recent">Más recientes</option>
                <option value="helpful">Más útiles</option>
                <option value="highest">Mejor puntuación</option>
                <option value="lowest">Peor puntuación</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Calificación mínima:</label>
              <select v-model="filters.minRating" class="filter-select">
                <option value="0">Todas</option>
                <option value="5">5 estrellas</option>
                <option value="4">4+ estrellas</option>
                <option value="3">3+ estrellas</option>
              </select>
            </div>
            <div class="filter-options">
              <label class="filter-checkbox">
                <input type="checkbox" v-model="filters.verifiedOnly">
                Solo estudiantes verificados
              </label>
              <label class="filter-checkbox">
                <input type="checkbox" v-model="filters.withReplies">
                Con respuesta
              </label>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="reviews-stats">
            <div class="distribution-chart">
              <div 
                v-for="rating in 5" 
                :key="rating"
                class="distribution-item"
              >
                <span class="star-count">{{ rating }}★</span>
                <div class="distribution-bar">
                  <div 
                    class="bar-fill"
                    :style="{ width: `${getDistributionPercentage(rating)}%` }"
                  ></div>
                </div>
                <span class="distribution-count">
                  {{ stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] }}
                </span>
              </div>
            </div>
          </div>

          <!-- Lista de reseñas -->
          <div class="reviews-list">
            <div v-if="filteredReviews.length === 0" class="empty-reviews">
              <div class="empty-icon">📝</div>
              <h3>No hay reseñas aún</h3>
              <p>Sé el primero en compartir tu experiencia sobre este programa</p>
              <button @click="activeTab = 'write'" class="write-first-btn">
                ✍️ Escribir primera reseña
              </button>
            </div>

            <ReviewCard
              v-for="review in filteredReviews"
              :key="review.id"
              :review="review"
              @vote-helpful="handleVoteHelpful"
              @vote-not-helpful="handleVoteNotHelpful"
              @report="handleReportReview"
            />
          </div>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import { useAuthStore } from '@/stores/auth';
import type { Program } from '@/types';
import type { Review, ReviewFilters } from '@/types/reviews';
import ReviewForm from './ReviewForm.vue';
import ReviewCard from './ReviewCard.vue';

const props = defineProps<{
  program: Program;
  universityName: string;
}>();

const emit = defineEmits(['close']);

const reviewsStore = useReviewsStore();
const authStore = useAuthStore();

// Estado
const activeTab = ref<'reviews' | 'write'>('reviews');
const filters = ref<ReviewFilters>({
  sortBy: 'recent',
  minRating: 0,
  verifiedOnly: false,
  withReplies: false,
  helpfulOnly: false,
});
const currentPage = ref(1);
const itemsPerPage = 5;

// Tabs
const tabs = [
  { id: 'reviews', label: 'Ver reseñas', icon: '📖' },
  { id: 'write', label: 'Escribir reseña', icon: '✍️' },
];

// Computed
const stats = computed(() => {
  return reviewsStore.getProgramStats(props.program._id!);
});

const reviews = computed(() => {
  return reviewsStore.getProgramReviews(props.program._id!);
});

const filteredReviews = computed(() => {
  let result = [...reviews.value];

  // Aplicar filtros
  if (filters.value.minRating > 0) {
    result = result.filter(review => review.rating >= filters.value.minRating);
  }

  if (filters.value.verifiedOnly) {
    result = result.filter(review => review.isVerifiedStudent);
  }

  if (filters.value.withReplies) {
    result = result.filter(review => review.universityReply);
  }

  if (filters.value.helpfulOnly) {
    result = result.filter(review => review.helpfulCount > review.notHelpfulCount);
  }

  // Aplicar ordenamiento
  switch (filters.value.sortBy) {
    case 'recent':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'helpful':
      result.sort((a, b) => {
        const aScore = a.helpfulCount - a.notHelpfulCount;
        const bScore = b.helpfulCount - b.notHelpfulCount;
        return bScore - aScore;
      });
      break;
    case 'highest':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      result.sort((a, b) => a.rating - b.rating);
      break;
  }

  return result;
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredReviews.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage);
});

// Métodos
const closeModal = () => {
  emit('close');
};

const getDistributionPercentage = (rating: number) => {
  const count = stats.value.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
  return stats.value.totalReviews > 0 ? (count / stats.value.totalReviews) * 100 : 0;
};

const handleSubmitReview = async (reviewData: any) => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para escribir una reseña');
    activeTab.value = 'reviews';
    return;
  }

  try {
    await reviewsStore.addReview({
      ...reviewData,
      type: 'program',
      targetId: props.program._id!,
      userId: authStore.user?.id || 'guest',
      userName: authStore.user?.username || 'Usuario',
    });

    alert('¡Reseña enviada exitosamente! Será revisada por nuestros moderadores.');
    activeTab.value = 'reviews';
  } catch (error) {
    console.error('Error al enviar reseña:', error);
    alert('Error al enviar la reseña. Inténtalo nuevamente.');
  }
};

const handleVoteHelpful = (reviewId: string) => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para votar');
    return;
  }
  reviewsStore.voteHelpful(reviewId, true);
};

const handleVoteNotHelpful = (reviewId: string) => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para votar');
    return;
  }
  reviewsStore.voteHelpful(reviewId, false);
};

const handleReportReview = (reviewId: string, reason: string) => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para reportar');
    return;
  }
  reviewsStore.reportReview(reviewId, reason, authStore.user?.id || '');
  alert('Gracias por tu reporte. Revisaremos esta reseña.');
};

// Resetear página cuando cambian filtros
watch(filters, () => {
  currentPage.value = 1;
}, { deep: true });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.reviews-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 16px 16px 0 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-content h2 {
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 2rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: