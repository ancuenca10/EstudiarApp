<!-- src/views/ProgramReviewsView.vue -->
<template>
  <div class="program-reviews-view">
    <div class="container">
      <!-- Header con breadcrumb -->
      <nav class="breadcrumb">
        <router-link to="/">🏠 Inicio</router-link>
        <span>/</span>
        <router-link v-if="program" :to="`/universities/${program.universityId}`">
          {{ program.universityName }}
        </router-link>
        <span v-if="program">/</span>
        <span v-if="program">{{ program.name }}</span>
        <span>/</span>
        <span class="current">Reseñas</span>
      </nav>

      <!-- Header principal -->
      <div class="header">
        <div class="header-left">
          <h1>📝 Reseñas de {{ program?.name || 'Programa' }}</h1>
          <p class="subtitle">
            Opiniones y experiencias de estudiantes reales
            <span v-if="reviewsStats.totalReviews > 0">
              · {{ reviewsStats.totalReviews }} reseñas
            </span>
          </p>
        </div>
        
        <div class="header-right">
          <button @click="showReviewForm = true" class="btn-primary">
            ✍️ Escribir reseña
          </button>
        </div>
      </div>

      <!-- Estadísticas -->
      <ReviewStats 
        v-if="reviewsStats.totalReviews > 0"
        :stats="reviewsStats"
        class="stats-section"
      />

      <!-- Contenido principal -->
      <div class="main-content">
        <!-- Columna izquierda: Lista de reseñas -->
        <div class="reviews-column">
          <div class="section-header">
            <h2>Reseñas de la comunidad</h2>
            <div class="sort-controls">
              <label for="sort">Ordenar por:</label>
              <select id="sort" v-model="sortBy" class="sort-select">
                <option value="recent">Más recientes</option>
                <option value="helpful">Más útiles</option>
                <option value="highest">Mayor puntuación</option>
                <option value="lowest">Menor puntuación</option>
              </select>
            </div>
          </div>

          <!-- Filtros -->
          <ReviewFilters 
            v-model:filters="filters"
            class="filters-section"
          />

          <!-- Estado vacío -->
          <div v-if="filteredReviews.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>No hay reseñas aún</h3>
            <p>Sé el primero en compartir tu experiencia sobre este programa</p>
            <button @click="showReviewForm = true" class="btn-primary">
              Escribir primera reseña
            </button>
          </div>

          <!-- Lista de reseñas -->
          <div v-else class="reviews-list">
            <ReviewCard
              v-for="review in paginatedReviews"
              :key="review.id"
              :review="review"
              :user-id="currentUserId"
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
            
            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="{ active: currentPage === page }"
                class="page-number"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <!-- Columna derecha: Información del programa -->
        <div class="info-column">
          <div class="program-card">
            <h3>📚 Sobre este programa</h3>
            <div v-if="program" class="program-info">
              <p><strong>Universidad:</strong> {{ program.universityName }}</p>
              <p><strong>Tipo:</strong> {{ getProgramType(program.type) }}</p>
              <p><strong>Duración:</strong> {{ program.duration }}</p>
              <p><strong>Costo:</strong> {{ formatCurrency(program.cost, program.currency) }}</p>
              <p class="description">{{ program.description }}</p>
            </div>
            <div v-else class="loading-program">
              Cargando información del programa...
            </div>
          </div>

          <!-- Guía para escribir reseñas -->
          <div class="review-guidelines">
            <h4>📋 Guía para reseñas útiles</h4>
            <ul>
              <li>✅ Sé específico sobre tu experiencia</li>
              <li>✅ Menciona profesores destacados</li>
              <li>✅ Habla sobre instalaciones y recursos</li>
              <li>✅ Compara expectativas vs realidad</li>
              <li>❌ Evita lenguaje ofensivo</li>
              <li>❌ No compartas información personal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para escribir reseña -->
    <ReviewFormModal
      v-if="showReviewForm"
      :program-id="programId"
      :program-name="program?.name"
      @submit="handleSubmitReview"
      @close="showReviewForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useReviewsStore } from '@/stores/reviews';
import { useProgramsStore } from '@/stores/programs';
import ReviewStats from '@/components/reviews/ReviewStats.vue';
import ReviewFilters from '@/components/reviews/ReviewFilters.vue';
import ReviewCard from '@/components/reviews/ReviewCard.vue';
import ReviewFormModal from '@/components/reviews/ReviewForm.vue';

// Router y stores
const route = useRoute();
const authStore = useAuthStore();
const reviewsStore = useReviewsStore();
const programsStore = useProgramsStore();

// Datos del programa
const programId = computed(() => route.params.id as string);
const program = computed(() => programsStore.getProgramById(programId.value));

// Estado de la vista
const showReviewForm = ref(false);
const sortBy = ref<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
const filters = ref({
  minRating: 0,
  verifiedOnly: false,
  withReplies: false,
  helpfulOnly: false,
});
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Datos del usuario actual
const currentUserId = computed(() => authStore.user?.id || null);
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Computed: Obtener reseñas y estadísticas
const programReviews = computed(() => {
  return reviewsStore.getReviewsByProgram(programId.value);
});

const reviewsStats = computed(() => {
  return reviewsStore.getReviewStats(programId.value);
});

// Computed: Ordenar y filtrar reseñas
const sortedReviews = computed(() => {
  let reviews = [...programReviews.value];

  // Aplicar ordenamiento
  switch (sortBy.value) {
    case 'recent':
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'helpful':
      reviews.sort((a, b) => {
        const aScore = a.helpfulCount - a.notHelpfulCount;
        const bScore = b.helpfulCount - b.notHelpfulCount;
        return bScore - aScore;
      });
      break;
    case 'highest':
      reviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      reviews.sort((a, b) => a.rating - b.rating);
      break;
  }

  return reviews;
});

const filteredReviews = computed(() => {
  return sortedReviews.value.filter(review => {
    // Filtro por rating mínimo
    if (filters.value.minRating > 0 && review.rating < filters.value.minRating) {
      return false;
    }
    
    // Filtro por estudiante verificado
    if (filters.value.verifiedOnly && !review.isVerifiedStudent) {
      return false;
    }
    
    // Filtro por respuestas de universidad
    if (filters.value.withReplies && !review.universityReply) {
      return false;
    }
    
    // Filtro por reseñas útiles (más votos positivos que negativos)
    if (filters.value.helpfulOnly && review.helpfulCount <= review.notHelpfulCount) {
      return false;
    }
    
    return true;
  });
});

// Computed: Paginación
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredReviews.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

// Métodos
const handleSubmitReview = async (reviewData: any) => {
  try {
    await reviewsStore.addReview({
      ...reviewData,
      programId: programId.value,
    });
    
    showReviewForm.value = false;
    // Podrías mostrar un toast de éxito aquí
  } catch (error) {
    console.error('Error al enviar reseña:', error);
    // Mostrar error al usuario
  }
};

const handleVoteHelpful = async (reviewId: string) => {
  if (!isAuthenticated.value) {
    // Redirigir a login o mostrar modal
    return;
  }
  
  await reviewsStore.voteHelpful(reviewId, true);
};

const handleVoteNotHelpful = async (reviewId: string) => {
  if (!isAuthenticated.value) {
    return;
  }
  
  await reviewsStore.voteHelpful(reviewId, false);
};

const handleReportReview = (reviewId: string) => {
  const reason = prompt('¿Por qué quieres reportar esta reseña?');
  if (reason) {
    reviewsStore.reportReview(reviewId, reason);
    alert('Gracias por tu reporte. Revisaremos esta reseña.');
  }
};

const getProgramType = (type: string) => {
  const types: Record<string, string> = {
    'undergraduate': 'Pregrado',
    'graduate': 'Posgrado',
    'doctorate': 'Doctorado',
    'specialization': 'Especialización',
  };
  return types[type] || type;
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

// Inicialización
onMounted(async () => {
  // Cargar reseñas del programa
  await reviewsStore.loadProgramReviews(programId.value);
  
  // Cargar información del programa si no está en store
  if (!program.value) {
    await programsStore.fetchProgramById(programId.value);
  }
});

// Resetear página cuando cambian filtros
watch([filters, sortBy], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.program-reviews-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: #666;
}

.breadcrumb a {
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: #3730a3;
  text-decoration: underline;
}

.breadcrumb .current {
  color: #1f2937;
  font-weight: 500;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.stats-section {
  margin-bottom: 2rem;
}

.main-content {
  display: grid;
  gap: 2rem;
}

.reviews-column {
  flex: 1;
}

.info-column {
  width: 300px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #1f2937;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #4b5563;
}

.filters-section {
  margin-bottom: 1.5rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f3f4f6;
}

.page-number.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.program-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.program-card h3 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.program-info p {
  margin-bottom: 0.75rem;
  color: #4b5563;
}

.program-info .description {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-style: italic;
  color: #6b7280;
}

.review-guidelines {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 1.5rem;
}

.review-guidelines h4 {
  color: #0369a1;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.review-guidelines ul {
  list-style: none;
  padding: 0;
}

.review-guidelines li {
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  color: #0c4a6e;
}

.review-guidelines li:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.review-guidelines li:nth-child(-n+4):before {
  color: #10b981;
}

.review-guidelines li:nth-child(n+5):before {
  color: #ef4444;
}

@media (min-width: 1024px) {
  .main-content {
    display: flex;
    gap: 3rem;
  }
  
  .reviews-column {
    flex: 1;
  }
  
  .info-column {
    width: 350px;
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>