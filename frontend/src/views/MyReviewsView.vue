<!-- src/views/MyReviewsView.vue -->
<template>
  <div class="my-reviews-view">
    <!-- Header -->
    <header class="page-header">
      <div class="container">
        <button @click="goBack" class="back-btn">
          ← Volver
        </button>
        <div class="header-content">
          <div class="header-info">
            <h1>📝 Mis Reseñas</h1>
            <p class="subtitle">Gestiona todas las reseñas que has escrito</p>
          </div>
          <div class="header-stats">
            <div class="stat-badge">
              <span class="stat-icon">📝</span>
              <div class="stat-details">
                <span class="stat-value">{{ totalReviews }}</span>
                <span class="stat-label">Reseñas</span>
              </div>
            </div>
            <div class="stat-badge">
              <span class="stat-icon">👍</span>
              <div class="stat-details">
                <span class="stat-value">{{ totalHelpfulVotes }}</span>
                <span class="stat-label">Votos útiles</span>
              </div>
            </div>
            <div class="stat-badge">
              <span class="stat-icon">⭐</span>
              <div class="stat-details">
                <span class="stat-value">{{ averageRating.toFixed(1) }}</span>
                <span class="stat-label">Promedio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="my-reviews-content">
        <!-- Sidebar de filtros -->
        <aside class="reviews-sidebar">
          <!-- Filtros rápidos -->
          <div class="filters-card">
            <h3>🔍 Filtrar mis reseñas</h3>
            
            <div class="filter-group">
              <label>Estado:</label>
              <div class="filter-options">
                <button 
                  @click="toggleStatusFilter('approved')"
                  class="filter-btn"
                  :class="{ active: activeFilters.status.includes('approved') }"
                >
                  ✅ Publicadas
                </button>
                <button 
                  @click="toggleStatusFilter('pending')"
                  class="filter-btn"
                  :class="{ active: activeFilters.status.includes('pending') }"
                >
                  ⏳ Pendientes
                </button>
                <button 
                  @click="toggleStatusFilter('rejected')"
                  class="filter-btn"
                  :class="{ active: activeFilters.status.includes('rejected') }"
                >
                  ❌ Rechazadas
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Tipo:</label>
              <div class="filter-options">
                <button 
                  @click="toggleTypeFilter('university')"
                  class="filter-btn"
                  :class="{ active: activeFilters.entityType.includes('university') }"
                >
                  🏛️ Universidades
                </button>
                <button 
                  @click="toggleTypeFilter('program')"
                  class="filter-btn"
                  :class="{ active: activeFilters.entityType.includes('program') }"
                >
                  🎓 Programas
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Calificación:</label>
              <div class="rating-filter">
                <button 
                  v-for="rating in [5, 4, 3, 2, 1]" 
                  :key="rating"
                  @click="toggleRatingFilter(rating)"
                  class="rating-btn"
                  :class="{ active: activeFilters.rating.includes(rating) }"
                >
                  {{ rating }}★
                </button>
              </div>
            </div>
            
            <div class="filter-group">
              <label>Ordenar por:</label>
              <select v-model="sortBy" class="sort-select">
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguas</option>
                <option value="rating">Mejor calificación</option>
                <option value="helpful">Más útiles</option>
              </select>
            </div>
            
            <div class="filter-actions">
              <button @click="clearFilters" class="clear-btn">
                ✕ Limpiar filtros
              </button>
            </div>
          </div>
          
          <!-- Información del usuario -->
          <div class="user-card">
            <div class="user-header">
              <div class="user-avatar">
                <img v-if="userAvatar" :src="userAvatar" alt="Usuario">
                <div v-else class="avatar-fallback">
                  {{ userName.charAt(0) }}
                </div>
              </div>
              <div class="user-info">
                <h4>{{ userName }}</h4>
                <p class="user-role">Estudiante Verificado</p>
                <div class="user-meta">
                  <span class="member-since">
                    Miembro desde {{ memberSince }}
                  </span>
                </div>
              </div>
            </div>
            <div class="user-stats">
              <div class="user-stat">
                <span class="stat-icon">📊</span>
                <div class="stat-info">
                  <span class="stat-value">{{ approvalPercentage }}%</span>
                  <span class="stat-label">Aprobación</span>
                </div>
              </div>
              <div class="user-stat">
                <span class="stat-icon">💬</span>
                <div class="stat-info">
                  <span class="stat-value">{{ reviewsWithReply }}</span>
                  <span class="stat-label">Con respuesta</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Acciones rápidas -->
          <div class="quick-actions-card">
            <h4>⚡ Acciones rápidas</h4>
            <button @click="goToWriteReview" class="action-btn primary">
              ✏️ Escribir nueva reseña
            </button>
            <button @click="exportReviews" class="action-btn secondary">
              📤 Exportar mis reseñas
            </button>
            <button @click="viewGuidelines" class="action-btn outline">
              📋 Ver guías de reseñas
            </button>
          </div>
        </aside>

        <!-- Contenido principal -->
        <main class="reviews-main">
          <!-- Barra de búsqueda y acciones -->
          <div class="reviews-header">
            <div class="search-bar">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar en mis reseñas..."
                class="search-input"
                @input="searchReviews"
              />
              <button class="search-btn">
                🔍
              </button>
            </div>
            
            <div class="view-toggle">
              <button 
                @click="viewMode = 'list'"
                class="view-btn"
                :class="{ active: viewMode === 'list' }"
                title="Vista de lista"
              >
                ≡
              </button>
              <button 
                @click="viewMode = 'grid'"
                class="view-btn"
                :class="{ active: viewMode === 'grid' }"
                title="Vista de cuadrícula"
              >
                ☐
              </button>
            </div>
          </div>
          
          <!-- Estado vacío -->
          <div v-if="filteredReviews.length === 0" class="empty-state">
            <div class="empty-content">
              <div class="empty-icon">📝</div>
              <h3>{{ searchQuery ? 'No hay reseñas que coincidan' : 'Aún no has escrito reseñas' }}</h3>
              <p v-if="!searchQuery">
                Comparte tu experiencia para ayudar a otros estudiantes
              </p>
              <div class="empty-actions">
                <button v-if="searchQuery" @click="clearFilters" class="btn-secondary">
                  Limpiar búsqueda
                </button>
                <button @click="goToWriteReview" class="btn-primary">
                  ✏️ Escribir mi primera reseña
                </button>
              </div>
            </div>
          </div>
          
          <!-- Lista de reseñas -->
          <div v-else>
            <!-- Vista de lista -->
            <div v-if="viewMode === 'list'" class="reviews-list">
              <div 
                v-for="review in paginatedReviews" 
                :key="review.id"
                class="review-item"
                :class="getReviewStatusClass(review.status)"
              >
                <!-- Header de la reseña -->
                <div class="review-item-header">
                  <div class="review-entity-info">
                    <div class="entity-type">
                      <span class="entity-icon">
                        {{ review.entityType === 'university' ? '🏛️' : '🎓' }}
                      </span>
                      <span class="entity-type-label">
                        {{ review.entityType === 'university' ? 'Universidad' : 'Programa' }}
                      </span>
                    </div>
                    <h4 class="entity-name">
                      {{ getEntityName(review.entityId, review.entityType) }}
                    </h4>
                    <div class="review-meta">
                      <span class="review-date">
                        📅 {{ formatDate(review.createdAt) }}
                      </span>
                      <span class="review-status" :class="getStatusClass(review.status)">
                        {{ getStatusText(review.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="review-rating-info">
                    <div class="review-rating">
                      <span class="stars">
                        <span v-for="star in 5" :key="star" class="star">
                          {{ star <= review.rating ? '★' : '☆' }}
                        </span>
                      </span>
                      <span class="rating-value">{{ review.rating }}/5</span>
                    </div>
                    <div class="review-stats">
                      <span class="helpful-count" title="Votos útiles">
                        👍 {{ review.helpfulCount }}
                      </span>
                      <span class="not-helpful-count" title="Votos no útiles">
                        👎 {{ review.notHelpfulCount }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Contenido de la reseña -->
                <div class="review-item-content">
                  <h5 class="review-title">{{ review.title }}</h5>
                  <p class="review-excerpt">{{ truncateText(review.content, 150) }}</p>
                  
                  <!-- Pros y Cons -->
                  <div v-if="review.pros.length > 0 || review.cons.length > 0" class="review-pros-cons">
                    <div v-if="review.pros.length > 0" class="pros">
                      <strong>👍 Ventajas:</strong>
                      <span class="pros-list">{{ review.pros.join(', ') }}</span>
                    </div>
                    <div v-if="review.cons.length > 0" class="cons">
                      <strong>👎 Desventajas:</strong>
                      <span class="cons-list">{{ review.cons.join(', ') }}</span>
                    </div>
                  </div>
                  
                  <!-- Recomendación -->
                  <div class="review-recommendation">
                    <span :class="{ 'recommended': review.wouldRecommend }">
                      {{ review.wouldRecommend ? '✅ Recomendaría' : '❌ No recomendaría' }}
                    </span>
                  </div>
                  
                  <!-- Respuesta de la universidad -->
                  <div v-if="review.universityReply" class="university-reply">
                    <div class="reply-header">
                      <span class="reply-icon">🏛️</span>
                      <strong>Respuesta de la universidad</strong>
                      <span class="reply-date">{{ formatDate(review.replyDate!) }}</span>
                    </div>
                    <p class="reply-content">{{ truncateText(review.universityReply, 100) }}</p>
                  </div>
                </div>
                
                <!-- Acciones de la reseña -->
                <div class="review-item-actions">
                  <button 
                    @click="viewReviewDetails(review)"
                    class="action-btn view"
                  >
                    👁️ Ver completa
                  </button>
                  
                  <button 
                    v-if="canEditReview(review)"
                    @click="editReview(review)"
                    class="action-btn edit"
                  >
                    ✏️ Editar
                  </button>
                  
                  <button 
                    v-if="canDeleteReview(review)"
                    @click="deleteReview(review)"
                    class="action-btn delete"
                  >
                    🗑️ Eliminar
                  </button>
                  
                  <button 
                    @click="shareReview(review)"
                    class="action-btn share"
                  >
                    📤 Compartir
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Vista de cuadrícula -->
            <div v-else class="reviews-grid">
              <div 
                v-for="review in paginatedReviews" 
                :key="review.id"
                class="review-card"
                :class="getReviewStatusClass(review.status)"
              >
                <div class="card-header">
                  <div class="card-status" :class="getStatusClass(review.status)">
                    {{ getStatusText(review.status) }}
                  </div>
                  <div class="card-rating">
                    <span class="stars">
                      <span v-for="star in 5" :key="star">
                        {{ star <= review.rating ? '★' : '☆' }}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div class="card-body">
                  <div class="entity-info">
                    <span class="entity-icon">
                      {{ review.entityType === 'university' ? '🏛️' : '🎓' }}
                    </span>
                    <h5>{{ getEntityName(review.entityId, review.entityType) }}</h5>
                  </div>
                  
                  <h4 class="review-title">{{ truncateText(review.title, 50) }}</h4>
                  <p class="review-excerpt">{{ truncateText(review.content, 80) }}</p>
                  
                  <div class="review-meta">
                    <span class="review-date">
                      {{ formatDate(review.createdAt, true) }}
                    </span>
                    <div class="review-stats">
                      <span class="helpful-count">👍 {{ review.helpfulCount }}</span>
                      <span class="reply-indicator" v-if="review.universityReply">
                        💬
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="card-footer">
                  <button 
                    @click="viewReviewDetails(review)"
                    class="card-btn primary"
                  >
                    Ver
                  </button>
                  <button 
                    v-if="canEditReview(review)"
                    @click="editReview(review)"
                    class="card-btn secondary"
                  >
                    Editar
                  </button>
                </div>
              </div>
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
              
              <div class="page-info">
                <span class="page-numbers">
                  Página {{ currentPage }} de {{ totalPages }}
                </span>
                <span class="total-reviews">
                  ({{ filteredReviews.length }} reseñas)
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
          </div>
        </main>
      </div>
    </div>

    <!-- Modal de detalles de reseña -->
    <div v-if="selectedReview" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <ReviewDetailModal
          :review="selectedReview"
          :entity-name="getEntityName(selectedReview.entityId, selectedReview.entityType)"
          @close="closeModal"
          @edit="handleEditReview"
          @delete="handleDeleteReview"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewsStore } from '@/stores/reviews';
import { useUniversitiesStore } from '@/stores/universities';
import ReviewDetailModal from '@/components/reviews/ReviewDetailModal.vue';
import type { Review } from '@/types/reviews';

const router = useRouter();
const reviewsStore = useReviewsStore();
const universitiesStore = useUniversitiesStore();

// ============ ESTADOS ============
const viewMode = ref<'list' | 'grid'>('list');
const searchQuery = ref('');
const selectedReview = ref<Review | null>(null);
const currentPage = ref(1);
const itemsPerPage = 10;

// Filtros activos
const activeFilters = ref({
  status: ['approved', 'pending'] as string[],
  entityType: ['university', 'program'] as string[],
  rating: [] as number[],
});

const sortBy = ref<'recent' | 'oldest' | 'rating' | 'helpful'>('recent');

// ============ DATOS DEL USUARIO (Temporal) ============
const userId = 'current-user'; // En producción, usar store de autenticación
const userName = 'Ana Gómez';
const userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana';
const memberSince = '2024';

// ============ COMPUTED PROPERTIES ============

// Obtener reseñas del usuario
const userReviews = computed(() => {
  return reviewsStore.reviews.filter(review => review.userId === userId);
});

// Filtrar reseñas
const filteredReviews = computed(() => {
  let filtered = [...userReviews.value];
  
  // Filtrar por estado
  if (activeFilters.value.status.length > 0) {
    filtered = filtered.filter(review => 
      activeFilters.value.status.includes(review.status)
    );
  }
  
  // Filtrar por tipo
  if (activeFilters.value.entityType.length > 0) {
    filtered = filtered.filter(review => 
      activeFilters.value.entityType.includes(review.entityType)
    );
  }
  
  // Filtrar por rating
  if (activeFilters.value.rating.length > 0) {
    filtered = filtered.filter(review => 
      activeFilters.value.rating.includes(review.rating)
    );
  }
  
  // Filtrar por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(review => 
      review.title.toLowerCase().includes(query) ||
      review.content.toLowerCase().includes(query) ||
      getEntityName(review.entityId, review.entityType).toLowerCase().includes(query)
    );
  }
  
  // Ordenar
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'recent':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        const aScore = a.helpfulCount - a.notHelpfulCount;
        const bScore = b.helpfulCount - b.notHelpfulCount;
        return bScore - aScore;
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
  
  return filtered;
});

// Estadísticas
const totalReviews = computed(() => userReviews.value.length);
const totalHelpfulVotes = computed(() => {
  return userReviews.value.reduce((sum, review) => sum + review.helpfulCount, 0);
});
const averageRating = computed(() => {
  if (userReviews.value.length === 0) return 0;
  const total = userReviews.value.reduce((sum, review) => sum + review.rating, 0);
  return total / userReviews.value.length;
});
const approvalPercentage = computed(() => {
  const approved = userReviews.value.filter(r => r.status === 'approved').length;
  return userReviews.value.length > 0 ? Math.round((approved / userReviews.value.length) * 100) : 0;
});
const reviewsWithReply = computed(() => {
  return userReviews.value.filter(r => r.universityReply).length;
});

// Paginación
const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage);
});
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredReviews.value.slice(start, end);
});

// ============ MÉTODOS HELPER ============

const getEntityName = (entityId: string, entityType: 'university' | 'program'): string => {
  if (entityType === 'university') {
    const university = universitiesStore.universities.find(u => {
      const id = u.id || u._id;
      return id === entityId;
    });
    return university?.name || 'Universidad';
  } else {
    // Buscar programa en todas las universidades
    for (const university of universitiesStore.universities) {
      if (university.programs) {
        const program = university.programs.find((p: any) => p.id === entityId);
        if (program) {
          return program.name || 'Programa';
        }
      }
    }
    return 'Programa';
  }
};

const formatDate = (date: Date, short: boolean = false) => {
  if (short) {
    return new Date(date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'approved': 'Publicada',
    'pending': 'Pendiente',
    'rejected': 'Rechazada',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    'approved': 'status-approved',
    'pending': 'status-pending',
    'rejected': 'status-rejected',
  };
  return classMap[status] || '';
};

const getReviewStatusClass = (status: string) => {
  return getStatusClass(status);
};

// ============ MÉTODOS DE FILTROS ============

const toggleStatusFilter = (status: string) => {
  const index = activeFilters.value.status.indexOf(status);
  if (index === -1) {
    activeFilters.value.status.push(status);
  } else {
    activeFilters.value.status.splice(index, 1);
  }
  currentPage.value = 1;
};

const toggleTypeFilter = (type: 'university' | 'program') => {
  const index = activeFilters.value.entityType.indexOf(type);
  if (index === -1) {
    activeFilters.value.entityType.push(type);
  } else {
    activeFilters.value.entityType.splice(index, 1);
  }
  currentPage.value = 1;
};

const toggleRatingFilter = (rating: number) => {
  const index = activeFilters.value.rating.indexOf(rating);
  if (index === -1) {
    activeFilters.value.rating.push(rating);
  } else {
    activeFilters.value.rating.splice(index, 1);
  }
  currentPage.value = 1;
};

const clearFilters = () => {
  activeFilters.value = {
    status: ['approved', 'pending'],
    entityType: ['university', 'program'],
    rating: [],
  };
  searchQuery.value = '';
  currentPage.value = 1;
};

const searchReviews = () => {
  currentPage.value = 1;
};

// ============ MÉTODOS DE RESEÑAS ============

const canEditReview = (review: Review) => {
  return review.status === 'pending' || review.status === 'rejected';
};

const canDeleteReview = (review: Review) => {
  return true; // Permitir eliminar cualquier reseña del usuario
};

const viewReviewDetails = (review: Review) => {
  selectedReview.value = review;
};

const editReview = (review: Review) => {
  router.push({
    path: '/write-review',
    query: {
      entityId: review.entityId,
      entityType: review.entityType,
      edit: review.id,
    },
  });
};

const deleteReview = async (review: Review) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
    reviewsStore.deleteReview(review.id);
  }
};

const shareReview = (review: Review) => {
  const entityName = getEntityName(review.entityId, review.entityType);
  const shareText = `Mi reseña de ${entityName} en EstudiarApp: "${review.title}"`;
  const shareUrl = `${window.location.origin}/review/${review.id}`;
  
  if (navigator.share) {
    navigator.share({
      title: `Mi reseña de ${entityName}`,
      text: shareText,
      url: shareUrl,
    });
  } else {
    // Fallback para navegadores que no soportan Web Share API
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      .then(() => alert('Enlace copiado al portapapeles'));
  }
};

const handleEditReview = (review: Review) => {
  closeModal();
  editReview(review);
};

const handleDeleteReview = (review: Review) => {
  closeModal();
  deleteReview(review);
};

const closeModal = () => {
  selectedReview.value = null;
};

// ============ MÉTODOS DE NAVEGACIÓN ============

const goBack = () => {
  router.back();
};

const goToWriteReview = () => {
  router.push('/write-review');
};

const exportReviews = () => {
  // En producción, esto generaría un archivo CSV o PDF
  const csvContent = generateCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `mis-resenas-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const generateCSV = () => {
  const headers = ['Fecha', 'Entidad', 'Tipo', 'Calificación', 'Título', 'Estado', 'Votos útiles'];
  const rows = userReviews.value.map(review => [
    formatDate(review.createdAt),
    getEntityName(review.entityId, review.entityType),
    review.entityType === 'university' ? 'Universidad' : 'Programa',
    review.rating.toString(),
    `"${review.title}"`,
    getStatusText(review.status),
    review.helpfulCount.toString(),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const viewGuidelines = () => {
  router.push('/help/review-guidelines');
};

// ============ PAGINACIÓN ============

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

// ============ WATCHERS ============

watch([activeFilters, sortBy, searchQuery], () => {
  currentPage.value = 1;
}, { deep: true });

// ============ LIFECYCLE ============

onMounted(() => {
  // Cargar datos iniciales
});
</script>

<style scoped>
.my-reviews-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  min-width: 120px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: bold;
  font-size: 1.2rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Contenido principal */
.my-reviews-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

@media (max-width: 1024px) {
  .my-reviews-content {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .stat-badge {
    flex: 1;
    min-width: auto;
  }
}

/* Sidebar */
.reviews-sidebar {
  position: sticky;
  top: 20px;
  align-self: start;
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.filters-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  font-size: 0.9rem;
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
  margin-top: 1.5rem;
}

.clear-btn {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  font-weight: 500;
}

.clear-btn:hover {
  border-color: #666;
  color: #333;
}

/* User card */
.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
}

.user-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.user-role {
  margin: 0 0 0.5rem 0;
  color: #4CAF50;
  font-size: 0.9rem;
  font-weight: 500;
}

.user-meta {
  font-size: 0.85rem;
  color: #666;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.user-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-stat .stat-icon {
  font-size: 1.2rem;
  opacity: 0.8;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info .stat-value {
  font-weight: bold;
  font-size: 1rem;
}

.stat-info .stat-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Quick actions */
.quick-actions-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.quick-actions-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: white;
  color: #667eea;
  border-color: #667eea;
}

.action-btn.secondary:hover {
  background: #667eea;
  color: white;
}

.action-btn.outline {
  background: white;
  color: #666;
  border-color: #e9ecef;
}

.action-btn.outline:hover {
  border-color: #666;
  color: #333;
}

/* Main content */
.reviews-main {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.reviews-header {
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
  min-width: 300px;
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

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.view-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.view-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-content {
  max-width: 500px;
  margin: 0 auto;
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

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

/* Reviews list view */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.review-item {
  background: white;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.review-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.review-item.status-approved {
  border-left: 4px solid #4CAF50;
}

.review-item.status-pending {
  border-left: 4px solid #FF9800;
}

.review-item.status-rejected {
  border-left: 4px solid #f44336;
}

.review-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 1rem;
}

.review-entity-info {
  flex: 1;
}

.entity-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.entity-icon {
  font-size: 1.2rem;
}

.entity-type-label {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.entity-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.review-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.review-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-approved {
  background: #4CAF50;
  color: white;
}

.status-pending {
  background: #FF9800;
  color: white;
}

.status-rejected {
  background: #f44336;
  color: white;
}

.review-rating-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 150px;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.1rem;
  color: #FFD700;
  font-size: 1.1rem;
}

.rating-value {
  font-weight: bold;
  color: #333;
}

.review-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #666;
}

.review-item-content {
  padding: 1.5rem;
}

.review-title {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.review-excerpt {
  margin: 0 0 1rem 0;
  color: #555;
  line-height: 1.5;
}

.review-pros-cons {
  display: flex;
  gap: 1.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
}

.pros, .cons {
  flex: 1;
}

.pros strong {
  color: #4CAF50;
}

.cons strong {
  color: #f44336;
}

.pros-list, .cons-list {
  display: block;
  margin-top: 0.25rem;
  color: #555;
}

.review-recommendation {
  margin: 1rem 0;
}

.review-recommendation span {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
}

.recommended {
  background: #4CAF50;
  color: white;
}

.university-reply {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 3px solid #4CAF50;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.reply-icon {
  font-size: 1rem;
}

.reply-date {
  margin-left: auto;
  color: #666;
  font-size: 0.85rem;
}

.reply-content {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.4;
}

.review-item-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.review-item-actions .action-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  border: none;
  flex: 1;
  min-width: 120px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn.view {
  background: #2196F3;
  color: white;
}

.action-btn.edit {
  background: #FF9800;
  color: white;
}

.action-btn.delete {
  background: #f44336;
  color: white;
}

.action-btn.share {
  background: #9C27B0;
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Reviews grid view */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.review-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  overflow: hidden;
}

.review-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.review-card.status-approved {
  border-color: #4CAF50;
}

.review-card.status-pending {
  border-color: #FF9800;
}

.review-card.status-rejected {
  border-color: #f44336;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.card-rating .stars {
  font-size: 1rem;
}

.card-body {
  padding: 1rem;
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.entity-info h5 {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.review-title {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
  line-height: 1.3;
}

.review-excerpt {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
}

.review-stats {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.reply-indicator {
  color: #4CAF50;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.card-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  border: none;
}

.card-btn.primary {
  background: #667eea;
  color: white;
}

.card-btn.secondary {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}

.card-btn:hover {
  opacity: 0.9;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 1rem;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.page-numbers {
  font-weight: 500;
  color: #333;
}

.total-reviews {
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

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .review-item-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .review-rating-info {
    align-items: flex-start;
  }
  
  .review-pros-cons {
    flex-direction: column;
    gap: 1rem;
  }
  
  .review-item-actions .action-btn {
    min-width: 100px;
  }
  
  .reviews-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination-btn {
    width: 100%;
  }
}
</style>