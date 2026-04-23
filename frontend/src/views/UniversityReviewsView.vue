<!-- src/views/UniversityReviewsView.vue -->
<template>
  <div class="university-reviews-view">
    <!-- Header -->
    <header class="reviews-header">
      <div class="container">
        <button @click="goBack" class="back-btn">
          ← Volver
        </button>
        <h1>Reseñas de {{ universityName }}</h1>
        <p class="reviews-count">{{ totalReviews }} reseña{{ totalReviews !== 1 ? 's' : '' }}</p>
      </div>
    </header>

    <div class="container">
      <div class="reviews-content">
        <!-- Sidebar con estadísticas -->
        <aside class="reviews-sidebar">
          <ReviewStats 
            :stats="reviewStats"
            @write-review="showReviewForm = true"
          />
          
          <!-- Filtros -->
          <div class="filters-card">
            <h3>🔍 Filtrar reseñas</h3>
            
            <div class="filter-group">
              <label>Calificación mínima:</label>
              <div class="rating-filter">
                <button 
                  v-for="rating in [5, 4, 3, 2, 1]" 
                  :key="rating"
                  @click="filters.minRating = filters.minRating === rating ? undefined : rating"
                  class="rating-btn"
                  :class="{ active: filters.minRating === rating }"
                >
                  {{ rating }}★
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Recomendación:</label>
              <div class="filter-options">
                <button 
                  @click="filters.wouldRecommend = filters.wouldRecommend === true ? undefined : true"
                  class="filter-btn"
                  :class="{ active: filters.wouldRecommend === true }"
                >
                  ✅ Recomendadas
                </button>
                <button 
                  @click="filters.wouldRecommend = filters.wouldRecommend === false ? undefined : false"
                  class="filter-btn"
                  :class="{ active: filters.wouldRecommend === false }"
                >
                  ❌ No recomendadas
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Con respuesta:</label>
              <div class="filter-options">
                <button 
                  @click="filters.hasReply = filters.hasReply === true ? undefined : true"
                  class="filter-btn"
                  :class="{ active: filters.hasReply === true }"
                >
                  📨 Con respuesta
                </button>
                <button 
                  @click="filters.hasReply = filters.hasReply === false ? undefined : false"
                  class="filter-btn"
                  :class="{ active: filters.hasReply === false }"
                >
                  📭 Sin respuesta
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Ordenar por:</label>
              <select v-model="filters.sortBy" class="sort-select">
                <option value="recent">Más recientes</option>
                <option value="helpful">Más útiles</option>
                <option value="rating">Mejor calificación</option>
              </select>
            </div>
            
            <div class="filter-actions">
              <button @click="clearFilters" class="clear-btn">
                ✕ Limpiar filtros
              </button>
              <button @click="applyFilters" class="apply-btn">
                🔍 Aplicar
              </button>
            </div>
          </div>
        </aside>

        <!-- Lista de reseñas -->
        <main class="reviews-main">
          <!-- Barra de acciones -->
          <div class="actions-bar">
            <div class="search-bar">
              <input 
                v-model="searchQuery"
                type="text"
                placeholder="Buscar en reseñas..."
                class="search-input"
              />
              <button @click="searchReviews" class="search-btn">
                🔍
              </button>
            </div>
            
            <button @click="showReviewForm = true" class="write-review-btn">
              ✏️ Escribir reseña
            </button>
          </div>

          <!-- Estado vacío -->
          <div v-if="filteredReviews.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>No hay reseñas que coincidan con los filtros</h3>
            <p>Intenta cambiar los filtros o escribe la primera reseña</p>
            <button @click="clearFilters" class="btn-primary">
              Limpiar filtros
            </button>
          </div>

          <!-- Lista de reseñas -->
          <div v-else class="reviews-list">
            <ReviewCard 
              v-for="review in filteredReviews"
              :key="review.id"
              :review="review"
              @edit="handleEditReview"
              @deleted="loadReviews"
            />
          </div>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1" 
              class="pagination-btn"
            >
              ← Anterior
            </button>
            
            <div class="page-numbers">
              <span class="page-info">
                Página {{ currentPage }} de {{ totalPages }}
              </span>
            </div>
            
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages" 
              class="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- Modal de formulario de reseña -->
    <div v-if="showReviewForm" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingReview ? 'Editar reseña' : 'Escribir reseña' }}</h2>
          <button @click="closeReviewForm" class="modal-close">
            ✕
          </button>
        </div>
        
        <ReviewForm 
          :entity-id="entityId"
          entity-type="university"
          :entity-name="universityName"
          :existing-review="editingReview"
          @submitted="handleReviewSubmitted"
          @cancelled="closeReviewForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewsStore } from '@/stores/reviews';
import { useUniversitiesStore } from '@/stores/universities';
import ReviewCard from '@/components/reviews/ReviewCard.vue';
import ReviewForm from '@/components/reviews/ReviewForm.vue';
import ReviewStats from '@/components/reviews/ReviewStats.vue';
import type { Review } from '@/types/reviews';

const route = useRoute();
const router = useRouter();
const reviewsStore = useReviewsStore();
const universitiesStore = useUniversitiesStore();

const entityId = route.params.id as string;
const universityName = ref('');
const reviews = ref<Review[]>([]);
const filteredReviews = ref<Review[]>([]);

// Filtros
const filters = ref({
  minRating: undefined as number | undefined,
  maxRating: undefined as number | undefined,
  wouldRecommend: undefined as boolean | undefined,
  hasReply: undefined as boolean | undefined,
  sortBy: 'recent' as 'recent' | 'helpful' | 'rating',
});

const searchQuery = ref('');
const showReviewForm = ref(false);
const editingReview = ref<Review | null>(null);

// Paginación
const currentPage = ref(1);
const itemsPerPage = 10;

// Computed
const reviewStats = computed(() => {
  return reviewsStore.getReviewStats(entityId, 'university');
});

const totalReviews = computed(() => {
  return reviewStats.value.totalReviews;
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage);
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredReviews.value.slice(start, end);
});

// Métodos
const loadReviews = () => {
  reviews.value = reviewsStore.getReviewsByEntity(entityId, 'university');
  applyFilters();
};

const loadUniversity = () => {
  const university = universitiesStore.universities.find(u => {
    const id = u.id || u._id;
    return id === entityId;
  });
  
  if (university) {
    universityName.value = university.name || 'Universidad';
  }
};

const applyFilters = () => {
  filteredReviews.value = reviewsStore.filterReviews({
    entityId,
    entityType: 'university',
    minRating: filters.value.minRating,
    maxRating: filters.value.maxRating,
    wouldRecommend: filters.value.wouldRecommend,
    hasReply: filters.value.hasReply,
    sortBy: filters.value.sortBy,
    searchQuery: searchQuery.value.trim() || undefined,
  });
  currentPage.value = 1;
};

const clearFilters = () => {
  filters.value = {
    minRating: undefined,
    maxRating: undefined,
    wouldRecommend: undefined,
    hasReply: undefined,
    sortBy: 'recent',
  };
  searchQuery.value = '';
  applyFilters();
};

const searchReviews = () => {
  applyFilters();
};

const handleEditReview = (review: Review) => {
  editingReview.value = review;
  showReviewForm.value = true;
};

const handleReviewSubmitted = () => {
  showReviewForm.value = false;
  editingReview.value = null;
  loadReviews();
};

const closeReviewForm = () => {
  showReviewForm.value = false;
  editingReview.value = null;
};

const goBack = () => {
  router.push(`/university/${entityId}`);
};

// Paginación
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Watchers
watch(filters, () => {
  applyFilters();
}, { deep: true });

watch(searchQuery, () => {
  applyFilters();
});

// Lifecycle
onMounted(() => {
  loadUniversity();
  loadReviews();
});
</script>

<style scoped>
.university-reviews-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.reviews-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.reviews-header h1 {
  margin: 0.5rem 0;
  font-size: 2rem;
}

.reviews-count {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.reviews-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

@media (max-width: 1024px) {
  .reviews-content {
    grid-template-columns: 1fr;
  }
}

.reviews-sidebar {
  position: sticky;
  top: 20px;
  align-self: start;
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.filters-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.rating-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rating-btn {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.rating-btn:hover {
  border-color: #667eea;
}

.rating-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.sort-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.clear-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
}

.apply-btn {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.clear-btn:hover {
  border-color: #666;
  color: #333;
}

.apply-btn:hover {
  opacity: 0.9;
}

.reviews-main {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-bar {
  flex: 1;
  display: flex;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px 0 0 8px;
  font-size: 0.9rem;
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 1.1rem;
}

.write-review-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.write-review-btn:hover {
  opacity: 0.9;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #333;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    max-width: none;
  }
  
  .modal-content {
    margin: 20px;
  }
}
</style>