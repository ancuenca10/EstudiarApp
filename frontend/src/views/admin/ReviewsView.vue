<!-- src/views/admin/ReviewsView.vue -->
<template>
  <div class="reviews-view">
    <div class="container">
      <div class="page-header">
        <div class="header-content">
          <h1>🎯 Moderación de Reseñas</h1>
          <p class="subtitle">Revisa y modera las reseñas de estudiantes</p>
        </div>
        
        <div class="header-actions">
          <button @click="exportReviews" class="action-btn export-btn">
            📊 Exportar CSV
          </button>
          <button @click="refreshReviews" class="action-btn refresh-btn" :disabled="loading">
            🔄 {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <!-- Dashboard de estadísticas -->
      <div class="dashboard">
        <div class="stats-grid">
          <div 
            v-for="stat in stats" 
            :key="stat.label" 
            class="stat-card" 
            :class="{ active: selectedStatus === stat.status }"
            @click="filterByStatus(stat.status)"
          >
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-content">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div v-if="stat.trend !== 0" class="stat-trend" :class="{ positive: stat.trend > 0, negative: stat.trend < 0 }">
                {{ stat.trend > 0 ? '↗' : '↘' }} {{ Math.abs(stat.trend) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Filtros avanzados -->
        <div class="filters-section">
          <div class="filters-header">
            <h3>Filtros de moderación</h3>
            <button 
              v-if="hasActiveFilters" 
              @click="clearFilters" 
              class="clear-filters-btn"
            >
              🗑️ Limpiar filtros
            </button>
          </div>
          
          <div class="filters-grid">
            <!-- Búsqueda -->
            <div class="filter-group">
              <label>🔍 Buscar reseñas</label>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Buscar por contenido, título o usuario..."
                class="search-input"
              />
            </div>
            
            <!-- Filtro por estado -->
            <div class="filter-group">
              <label>📋 Estado de revisión</label>
              <select v-model="selectedStatus" class="filter-select">
                <option value="all">Todas las reseñas ({{ totalReviews }})</option>
                <option value="pending">⏳ Pendientes ({{ pendingCount }})</option>
                <option value="approved">✅ Aprobadas ({{ approvedCount }})</option>
                <option value="rejected">❌ Rechazadas ({{ rejectedCount }})</option>
                <option value="reported">🚨 Reportadas ({{ reportedCount }})</option>
              </select>
            </div>
            
            <!-- Filtro por programa -->
            <div class="filter-group">
              <label>🎓 Programa</label>
              <select v-model="selectedProgram" class="filter-select">
                <option value="">Todos los programas</option>
                <option v-for="program in availablePrograms" :key="program.id" :value="program.id">
                  {{ program.name }} ({{ getProgramReviewsCount(program.id) }})
                </option>
              </select>
            </div>
            
            <!-- Filtro por rating -->
            <div class="filter-group">
              <label>⭐ Calificación mínima</label>
              <select v-model="minRating" class="filter-select">
                <option value="0">Cualquier calificación</option>
                <option value="1">★☆☆☆☆ (1+ estrellas)</option>
                <option value="2">★★☆☆☆ (2+ estrellas)</option>
                <option value="3">★★★☆☆ (3+ estrellas)</option>
                <option value="4">★★★★☆ (4+ estrellas)</option>
                <option value="5">★★★★★ (5 estrellas)</option>
              </select>
            </div>
            
            <!-- Filtro por fecha -->
            <div class="filter-group">
              <label>📅 Período</label>
              <select v-model="dateRange" class="filter-select">
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="quarter">Último trimestre</option>
              </select>
            </div>
            
            <!-- Filtro por verificados -->
            <div class="filter-group">
              <label>👤 Tipo de usuario</label>
              <select v-model="userType" class="filter-select">
                <option value="all">Todos los usuarios</option>
                <option value="verified">✅ Estudiantes verificados</option>
                <option value="unverified">👤 Usuarios no verificados</option>
              </select>
            </div>
          </div>
          
          <!-- Filtros activos -->
          <div v-if="activeFilters.length > 0" class="active-filters">
            <span class="active-filters-label">Filtros activos:</span>
            <div class="filter-chips">
              <span 
                v-for="filter in activeFilters" 
                :key="filter.label" 
                class="filter-chip"
                @click="removeFilter(filter.key)"
              >
                {{ filter.label }} ×
              </span>
            </div>
          </div>
        </div>

        <!-- Resumen de resultados -->
        <div class="results-summary">
          <div class="summary-item">
            <span class="summary-label">Mostrando</span>
            <span class="summary-value">{{ filteredReviews.length }} de {{ totalReviews }}</span>
            <span class="summary-label">reseñas</span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Rating promedio</span>
            <span class="summary-value">{{ averageRating.toFixed(1) }}/5</span>
            <span class="summary-label">
              <span v-for="star in 5" :key="star" 
                    class="star" 
                    :class="{ filled: star <= Math.round(averageRating) }">
                ★
              </span>
            </span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">% de recomendación</span>
            <span class="summary-value">{{ recommendationPercentage }}%</span>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Acciones rápidas</span>
            <div class="quick-actions">
              <button 
                v-if="selectedReviews.length > 0 && canApproveSelected"
                @click="bulkApprove"
                class="quick-action-btn approve"
              >
                ✅ Aprobar {{ selectedReviews.length }}
              </button>
              <button 
                v-if="selectedReviews.length > 0 && canRejectSelected"
                @click="bulkReject"
                class="quick-action-btn reject"
              >
                ❌ Rechazar {{ selectedReviews.length }}
              </button>
              <button 
                v-if="selectedReviews.length > 0"
                @click="clearSelection"
                class="quick-action-btn clear"
              >
                🗑️ Limpiar selección
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de reseñas -->
        <div class="reviews-container">
          <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Cargando reseñas...</p>
          </div>
          
          <div v-else-if="filteredReviews.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>No hay reseñas para mostrar</h3>
            <p>{{ getEmptyStateMessage }}</p>
            <button v-if="hasActiveFilters" @click="clearFilters" class="btn-primary">
              🔄 Limpiar filtros
            </button>
            <button v-else @click="refreshReviews" class="btn-primary">
              🔄 Recargar reseñas
            </button>
          </div>
          
          <div v-else class="reviews-list">
            <!-- Selección múltiple -->
            <div v-if="selectedReviews.length > 0" class="selection-banner">
              <div class="selection-info">
                <input 
                  type="checkbox" 
                  :checked="allSelected"
                  @change="toggleSelectAll"
                  class="select-all-checkbox"
                />
                <span class="selection-count">
                  {{ selectedReviews.length }} reseña{{ selectedReviews.length !== 1 ? 's' : '' }} seleccionada{{ selectedReviews.length !== 1 ? 's' : '' }}
                </span>
              </div>
              <div class="selection-actions">
                <button @click="bulkApprove" class="action-btn approve" :disabled="!canApproveSelected">
                  ✅ Aprobar selección
                </button>
                <button @click="bulkReject" class="action-btn reject" :disabled="!canRejectSelected">
                  ❌ Rechazar selección
                </button>
                <button @click="exportSelected" class="action-btn export">
                  📥 Exportar selección
                </button>
              </div>
            </div>
            
            <!-- Tabla de reseñas -->
            <div class="reviews-table">
              <table>
                <thead>
                  <tr>
                    <th class="selection-col">
                      <input 
                        type="checkbox" 
                        :checked="allSelected"
                        @change="toggleSelectAll"
                        class="header-checkbox"
                      />
                    </th>
                    <th class="user-col">Usuario</th>
                    <th class="program-col">Programa</th>
                    <th class="rating-col">Calificación</th>
                    <th class="content-col">Contenido</th>
                    <th class="status-col">Estado</th>
                    <th class="date-col">Fecha</th>
                    <th class="actions-col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="review in paginatedReviews" 
                    :key="review.id"
                    :class="{ selected: selectedReviews.includes(review.id) }"
                  >
                    <td class="selection-col">
                      <input 
                        type="checkbox" 
                        :checked="selectedReviews.includes(review.id)"
                        @change="toggleSelection(review.id)"
                        class="row-checkbox"
                      />
                    </td>
                    <td class="user-col">
                      <div class="user-cell">
                        <div class="user-avatar">
                          {{ review.userName?.charAt(0) || 'U' }}
                        </div>
                        <div class="user-info">
                          <div class="user-name">{{ review.userName || 'Usuario' }}</div>
                          <div v-if="review.isVerifiedStudent" class="user-badge verified">
                            ✓ Verificado
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="program-col">
                      <div class="program-cell">
                        <div class="program-name">{{ getProgramName(review.programId) }}</div>
                        <div class="program-meta">
                          <span v-if="review.reports && review.reports.length > 0" class="report-badge">
                            🚨 {{ review.reports.length }} reporte{{ review.reports.length !== 1 ? 's' : '' }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="rating-col">
                      <div class="rating-cell">
                        <div class="rating-stars">
                          <span v-for="star in 5" :key="star" 
                                class="star" 
                                :class="{ filled: star <= review.rating }">
                            ★
                          </span>
                        </div>
                        <div class="rating-number">{{ review.rating }}/5</div>
                      </div>
                    </td>
                    <td class="content-col">
                      <div class="content-cell">
                        <div class="content-title">{{ review.title }}</div>
                        <div class="content-preview">{{ truncateContent(review.content) }}</div>
                        <div v-if="review.pros" class="content-tags">
                          <span class="tag positive">Pros: {{ review.pros.length }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="status-col">
                      <span class="status-badge" :class="review.status">
                        {{ getStatusText(review.status) }}
                      </span>
                      <div v-if="review.status === 'rejected' && review.rejectionReason" class="rejection-reason">
                        <small>Motivo: {{ truncateContent(review.rejectionReason, 30) }}</small>
                      </div>
                    </td>
                    <td class="date-col">
                      <div class="date-cell">
                        <div>{{ formatDate(review.createdAt) }}</div>
                        <div class="date-ago">{{ getTimeAgo(review.createdAt) }}</div>
                      </div>
                    </td>
                    <td class="actions-col">
                      <div class="actions-cell">
                        <button @click="openReviewModal(review)" class="action-btn view">
                          👁️ Ver
                        </button>
                        <button 
                          v-if="review.status === 'pending' || review.status === 'reported'"
                          @click="approveReview(review.id)"
                          class="action-btn approve"
                        >
                          ✅ Aprobar
                        </button>
                        <button 
                          v-if="review.status === 'pending' || review.status === 'reported'"
                          @click="rejectReview(review.id)"
                          class="action-btn reject"
                        >
                          ❌ Rechazar
                        </button>
                        <button @click="deleteReview(review.id)" class="action-btn delete">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Paginación -->
            <div v-if="totalPages > 1" class="pagination">
              <div class="pagination-info">
                Mostrando {{ startItem }}-{{ endItem }} de {{ filteredReviews.length }} reseñas
              </div>
              <div class="pagination-controls">
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
              
              <div class="page-size-selector">
                <span>Mostrar</span>
                <select v-model="pageSize" @change="currentPage = 1">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span>por página</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de detalle de reseña -->
    <ReviewDetailModal
      v-if="selectedReview"
      :review="selectedReview"
      @close="selectedReview = null"
      @approve="handleModalApprove"
      @reject="handleModalReject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import { useProgramsStore } from '@/stores/programs';
import ReviewDetailModal from '@/components/reviews/ReviewDetailModal.vue';

const reviewsStore = useReviewsStore();
const programsStore = useProgramsStore();

// Estado
const searchQuery = ref('');
const selectedStatus = ref('pending');
const selectedProgram = ref('');
const minRating = ref('0');
const dateRange = ref('all');
const userType = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const selectedReviews = ref<string[]>([]);
const selectedReview = ref<any>(null);

// Computed properties
const stats = computed(() => [
  { 
    icon: '⏳', 
    label: 'Pendientes', 
    value: reviewsStore.pendingReviews.length,
    status: 'pending',
    trend: calculateTrend(reviewsStore.pendingReviews.length, 'pending')
  },
  { 
    icon: '✅', 
    label: 'Aprobadas', 
    value: reviewsStore.approvedReviews.length,
    status: 'approved',
    trend: calculateTrend(reviewsStore.approvedReviews.length, 'approved')
  },
  { 
    icon: '❌', 
    label: 'Rechazadas', 
    value: reviewsStore.rejectedReviews.length,
    status: 'rejected',
    trend: calculateTrend(reviewsStore.rejectedReviews.length, 'rejected')
  },
  { 
    icon: '🚨', 
    label: 'Reportadas', 
    value: reviewsStore.reportedReviews.length,
    status: 'reported',
    trend: calculateTrend(reviewsStore.reportedReviews.length, 'reported')
  },
]);

const availablePrograms = computed(() => {
  const programs = programsStore.programs || [];
  return programs.slice(0, 20); // Limitar a 20 programas para el dropdown
});

const totalReviews = computed(() => reviewsStore.allReviews.length);
const pendingCount = computed(() => reviewsStore.pendingReviews.length);
const approvedCount = computed(() => reviewsStore.approvedReviews.length);
const rejectedCount = computed(() => reviewsStore.rejectedReviews.length);
const reportedCount = computed(() => reviewsStore.reportedReviews.length);

const filteredReviews = computed(() => {
  let reviews = [...reviewsStore.allReviews];

  // Filtrar por estado
  if (selectedStatus.value !== 'all') {
    if (selectedStatus.value === 'pending') {
      reviews = reviews.filter(r => r.status === 'pending');
    } else if (selectedStatus.value === 'approved') {
      reviews = reviews.filter(r => r.status === 'approved');
    } else if (selectedStatus.value === 'rejected') {
      reviews = reviews.filter(r => r.status === 'rejected');
    } else if (selectedStatus.value === 'reported') {
      reviews = reviews.filter(r => r.reports && r.reports.length > 0);
    }
  }

  // Filtrar por programa
  if (selectedProgram.value) {
    reviews = reviews.filter(r => r.programId === selectedProgram.value);
  }

  // Filtrar por rating mínimo
  const minRatingNum = parseInt(minRating.value);
  if (minRatingNum > 0) {
    reviews = reviews.filter(r => r.rating >= minRatingNum);
  }

  // Filtrar por fecha
  const now = new Date();
  if (dateRange.value !== 'all') {
    reviews = reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      const diffMs = now.getTime() - reviewDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      switch (dateRange.value) {
        case 'today': return diffDays < 1;
        case 'week': return diffDays < 7;
        case 'month': return diffDays < 30;
        case 'quarter': return diffDays < 90;
        default: return true;
      }
    });
  }

  // Filtrar por tipo de usuario
  if (userType.value !== 'all') {
    reviews = reviews.filter(r => 
      userType.value === 'verified' ? r.isVerifiedStudent : !r.isVerifiedStudent
    );
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    reviews = reviews.filter(r => 
      (r.content && r.content.toLowerCase().includes(query)) ||
      (r.userName && r.userName.toLowerCase().includes(query)) ||
      (r.title && r.title.toLowerCase().includes(query)) ||
      (r.pros && r.pros.some((pro: string) => pro.toLowerCase().includes(query))) ||
      (r.cons && r.cons.some((con: string) => con.toLowerCase().includes(query)))
    );
  }

  return reviews;
});

const averageRating = computed(() => {
  if (filteredReviews.value.length === 0) return 0;
  const total = filteredReviews.value.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
  return total / filteredReviews.value.length;
});

const recommendationPercentage = computed(() => {
  if (filteredReviews.value.length === 0) return 0;
  const recommended = filteredReviews.value.filter((r: any) => r.wouldRecommend).length;
  return Math.round((recommended / filteredReviews.value.length) * 100);
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredReviews.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / pageSize.value);
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

const startItem = computed(() => {
  return (currentPage.value - 1) * pageSize.value + 1;
});

const endItem = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredReviews.value.length);
});

const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         selectedStatus.value !== 'all' || 
         selectedProgram.value || 
         minRating.value !== '0' || 
         dateRange.value !== 'all' || 
         userType.value !== 'all';
});

const activeFilters = computed(() => {
  const filters: Array<{ key: string, label: string }> = [];
  
  if (selectedStatus.value !== 'all') {
    filters.push({ 
      key: 'status', 
      label: `Estado: ${getStatusText(selectedStatus.value)}` 
    });
  }
  
  if (selectedProgram.value) {
    const programName = getProgramName(selectedProgram.value);
    filters.push({ 
      key: 'program', 
      label: `Programa: ${programName}` 
    });
  }
  
  if (minRating.value !== '0') {
    filters.push({ 
      key: 'rating', 
      label: `Rating mínimo: ${minRating.value} estrellas` 
    });
  }
  
  if (dateRange.value !== 'all') {
    const rangeText = {
      'today': 'Hoy',
      'week': 'Última semana',
      'month': 'Último mes',
      'quarter': 'Último trimestre'
    }[dateRange.value];
    filters.push({ 
      key: 'dateRange', 
      label: `Período: ${rangeText}` 
    });
  }
  
  if (userType.value !== 'all') {
    filters.push({ 
      key: 'userType', 
      label: `Usuario: ${userType.value === 'verified' ? 'Verificados' : 'No verificados'}` 
    });
  }
  
  if (searchQuery.value) {
    filters.push({ 
      key: 'search', 
      label: `Búsqueda: "${searchQuery.value}"` 
    });
  }
  
  return filters;
});

const allSelected = computed(() => {
  if (paginatedReviews.value.length === 0) return false;
  return paginatedReviews.value.every(r => selectedReviews.value.includes(r.id));
});

const canApproveSelected = computed(() => {
  return selectedReviews.value.some(id => {
    const review = reviewsStore.allReviews.find(r => r.id === id);
    return review && (review.status === 'pending' || review.status === 'reported');
  });
});

const canRejectSelected = computed(() => {
  return selectedReviews.value.some(id => {
    const review = reviewsStore.allReviews.find(r => r.id === id);
    return review && (review.status === 'pending' || review.status === 'approved' || review.status === 'reported');
  });
});

const getEmptyStateMessage = computed(() => {
  if (hasActiveFilters.value) {
    return 'No hay reseñas que coincidan con los filtros seleccionados';
  }
  if (selectedStatus.value === 'pending') {
    return '¡Excelente! No hay reseñas pendientes de moderación';
  }
  return 'No hay reseñas disponibles en este momento';
});

// Métodos
const getProgramReviewsCount = (programId: string) => {
  return reviewsStore.allReviews.filter((r: any) => r.programId === programId).length;
};

const getProgramName = (programId: string) => {
  const program = programsStore.programs.find(p => p.id === programId);
  return program ? program.name : 'Programa desconocido';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pendiente',
    'approved': '✅ Aprobada',
    'rejected': '❌ Rechazada',
    'reported': '🚨 Reportada'
  };
  return statusMap[status] || status;
};

const truncateContent = (content: string, maxLength: number = 100) => {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Hace < 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `Hace ${diffWeeks} semanas`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} meses`;
};

const calculateTrend = (currentValue: number, status: string) => {
  // En una implementación real, esto compararía con valores históricos
  // Por ahora, devolvemos un valor aleatorio para demostración
  const trends: Record<string, number> = {
    'pending': -5,
    'approved': 12,
    'rejected': 3,
    'reported': 8
  };
  return trends[status] || 0;
};

const filterByStatus = (status: string) => {
  selectedStatus.value = status === selectedStatus.value ? 'all' : status;
  currentPage.value = 1;
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedStatus.value = 'all';
  selectedProgram.value = '';
  minRating.value = '0';
  dateRange.value = 'all';
  userType.value = 'all';
  currentPage.value = 1;
  selectedReviews.value = [];
};

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'status': selectedStatus.value = 'all'; break;
    case 'program': selectedProgram.value = ''; break;
    case 'rating': minRating.value = '0'; break;
    case 'dateRange': dateRange.value = 'all'; break;
    case 'userType': userType.value = 'all'; break;
    case 'search': searchQuery.value = ''; break;
  }
};

const toggleSelection = (reviewId: string) => {
  const index = selectedReviews.value.indexOf(reviewId);
  if (index === -1) {
    selectedReviews.value.push(reviewId);
  } else {
    selectedReviews.value.splice(index, 1);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    // Deseleccionar todas en esta página
    paginatedReviews.value.forEach(review => {
      const index = selectedReviews.value.indexOf(review.id);
      if (index !== -1) {
        selectedReviews.value.splice(index, 1);
      }
    });
  } else {
    // Seleccionar todas en esta página
    paginatedReviews.value.forEach(review => {
      if (!selectedReviews.value.includes(review.id)) {
        selectedReviews.value.push(review.id);
      }
    });
  }
};

const clearSelection = () => {
  selectedReviews.value = [];
};

const bulkApprove = async () => {
  if (!selectedReviews.value.length || !confirm(`¿Aprobar ${selectedReviews.value.length} reseñas seleccionadas?`)) {
    return;
  }
  
  try {
    loading.value = true;
    for (const reviewId of selectedReviews.value) {
      const review = reviewsStore.allReviews.find(r => r.id === reviewId);
      if (review && (review.status === 'pending' || review.status === 'reported')) {
        await reviewsStore.approveReview(reviewId);
      }
    }
    selectedReviews.value = [];
  } catch (error) {
    console.error('Error aprobando reseñas:', error);
    alert('Error al aprobar las reseñas');
  } finally {
    loading.value = false;
  }
};

const bulkReject = async () => {
  if (!selectedReviews.value.length) return;
  
  const reason = prompt('Motivo del rechazo (se aplicará a todas las reseñas seleccionadas):');
  if (!reason) return;
  
  if (!confirm(`¿Rechazar ${selectedReviews.value.length} reseñas con el motivo: "${reason}"?`)) {
    return;
  }
  
  try {
    loading.value = true;
    for (const reviewId of selectedReviews.value) {
      await reviewsStore.rejectReview(reviewId, reason);
    }
    selectedReviews.value = [];
  } catch (error) {
    console.error('Error rechazando reseñas:', error);
    alert('Error al rechazar las reseñas');
  } finally {
    loading.value = false;
  }
};

const exportSelected = () => {
  const selected = reviewsStore.allReviews.filter(r => selectedReviews.value.includes(r.id));
  exportReviews(selected);
};

const exportReviews = (reviewsToExport?: any[]) => {
  const reviews = reviewsToExport || filteredReviews.value;
  
  if (reviews.length === 0) {
    alert('No hay reseñas para exportar');
    return;
  }
  
  // Crear contenido CSV
  const headers = ['ID', 'Usuario', 'Programa', 'Rating', 'Título', 'Estado', 'Fecha', 'Recomendado', 'Verificado'];
  const rows = reviews.map(review => [
    review.id,
    review.userName || 'Usuario',
    getProgramName(review.programId),
    review.rating,
    `"${review.title}"`,
    review.status,
    formatDate(review.createdAt),
    review.wouldRecommend ? 'Sí' : 'No',
    review.isVerifiedStudent ? 'Sí' : 'No'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Crear y descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `reseñas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const approveReview = async (reviewId: string) => {
  if (confirm('¿Aprobar esta reseña? Será visible públicamente.')) {
    try {
      await reviewsStore.approveReview(reviewId);
      // Remover de selección si está seleccionada
      const index = selectedReviews.value.indexOf(reviewId);
      if (index !== -1) {
        selectedReviews.value.splice(index, 1);
      }
    } catch (error) {
      console.error('Error aprobando reseña:', error);
      alert('Error al aprobar la reseña');
    }
  }
};

const rejectReview = async (reviewId: string) => {
  const reason = prompt('Motivo del rechazo:');
  if (reason) {
    if (confirm(`¿Rechazar esta reseña con el motivo: "${reason}"?`)) {
      try {
        await reviewsStore.rejectReview(reviewId, reason);
        // Remover de selección si está seleccionada
        const index = selectedReviews.value.indexOf(reviewId);
        if (index !== -1) {
          selectedReviews.value.splice(index, 1);
        }
      } catch (error) {
        console.error('Error rechazando reseña:', error);
        alert('Error al rechazar la reseña');
      }
    }
  }
};

const deleteReview = async (reviewId: string) => {
  if (confirm('¿Eliminar permanentemente esta reseña? Esta acción no se puede deshacer.')) {
    try {
      await reviewsStore.deleteReview(reviewId);
      // Remover de selección si está seleccionada
      const index = selectedReviews.value.indexOf(reviewId);
      if (index !== -1) {
        selectedReviews.value.splice(index, 1);
      }
    } catch (error) {
      console.error('Error eliminando reseña:', error);
      alert('Error al eliminar la reseña');
    }
  }
};

const openReviewModal = (review: any) => {
  selectedReview.value = review;
};

const handleModalApprove = async (reviewId: string) => {
  await approveReview(reviewId);
  selectedReview.value = null;
};

const handleModalReject = async (reviewId: string, reason: string) => {
  if (confirm(`¿Rechazar esta reseña con el motivo: "${reason}"?`)) {
    try {
      await reviewsStore.rejectReview(reviewId, reason);
      selectedReview.value = null;
    } catch (error) {
      console.error('Error rechazando reseña:', error);
      alert('Error al rechazar la reseña');
    }
  }
};

const viewProgram = (programId: string) => {
  window.open(`/programs/${programId}/reviews`, '_blank');
};

const refreshReviews = async () => {
  loading.value = true;
  try {
    await reviewsStore.fetchAllReviews();
  } catch (error) {
    console.error('Error actualizando reseñas:', error);
    alert('Error al actualizar las reseñas');
  } finally {
    loading.value = false;
  }
};

// Watchers
watch([selectedStatus, selectedProgram, minRating, dateRange, userType], () => {
  currentPage.value = 1;
  selectedReviews.value = [];
});

// Inicialización
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      reviewsStore.fetchAllReviews(),
      programsStore.fetchPrograms()
    ]);
  } catch (error) {
    console.error('Error cargando datos:', error);
    alert('Error al cargar los datos');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.reviews-view {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  color: #1e293b;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.export-btn {
  background: #10b981;
  color: white;
}

.export-btn:hover {
  background: #0da271;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
  cursor: pointer;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stat-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.stat-trend {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.stat-trend.positive {
  background: #dcfce7;
  color: #166534;
}

.stat-trend.negative {
  background: #fee2e2;
  color: #991b1b;
}

/* Filtros */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  color: #1e293b;
  font-size: 1.25rem;
  margin: 0;
}

.clear-filters-btn {
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-filters-btn:hover {
  background: #f1f5f9;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}

.search-input, .filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  color: #475569;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.active-filters {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.active-filters-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  padding-top: 0.25rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #bae6fd;
}

.filter-chip:hover {
  background: #bae6fd;
}

/* Resumen de resultados */
.results-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
}

.star {
  color: #e2e8f0;
  font-size: 1rem;
}

.star.filled {
  color: #fbbf24;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-btn.approve {
  background: #dcfce7;
  color: #166534;
}

.quick-action-btn.approve:hover {
  background: #bbf7d0;
}

.quick-action-btn.reject {
  background: #fee2e2;
  color: #991b1b;
}

.quick-action-btn.reject:hover {
  background: #fecaca;
}

.quick-action-btn.clear {
  background: #f1f5f9;
  color: #475569;
}

.quick-action-btn.clear:hover {
  background: #e2e8f0;
}

/* Contenedor de reseñas */
.reviews-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.loading-container, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon svg {
  margin: 0 auto 1rem;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}

/* Banner de selección */
.selection-banner {
  background: #eff6ff;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dbeafe;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.select-all-checkbox {
  width: 18px;
  height: 18px;
}

.selection-count {
  font-weight: 500;
  color: #1e40af;
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
}

.selection-actions .action-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Tabla de reseñas */
.reviews-table {
  overflow-x: auto;
}

.reviews-table table {
  width: 100%;
  border-collapse: collapse;
}

.reviews-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.reviews-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reviews-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.reviews-table tbody tr:hover {
  background: #f8fafc;
}

.reviews-table tbody tr.selected {
  background: #eff6ff;
}

.reviews-table td {
  padding: 1rem;
  vertical-align: top;
}

/* Columnas específicas */
.selection-col {
  width: 40px;
}

.user-col {
  width: 200px;
}

.program-col {
  width: 180px;
}

.rating-col {
  width: 120px;
}

.content-col {
  min-width: 250px;
}

.status-col {
  width: 140px;
}

.date-col {
  width: 120px;
}

.actions-col {
  width: 180px;
}

/* Celdas personalizadas */
.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.user-badge {
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  display: inline-block;
}

.user-badge.verified {
  background: #dcfce7;
  color: #166534;
}

.program-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.program-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.program-meta {
  display: flex;
  gap: 0.5rem;
}

.report-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-size: 0.7rem;
}

.rating-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rating-stars {
  display: flex;
  gap: 1px;
}

.rating-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.content-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.content-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.content-preview {
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.4;
}

.content-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
}

.tag.positive {
  background: #dcfce7;
  color: #166534;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.reported {
  background: #fef3c7;
  color: #92400e;
}

.rejection-reason {
  margin-top: 0.25rem;
  color: #dc2626;
  font-size: 0.8rem;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-ago {
  font-size: 0.8rem;
  color: #94a3b8;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.actions-cell .action-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid #e2e8f0;
  background: white;
}

.actions-cell .action-btn.view {
  color: #3b82f6;
}

.actions-cell .action-btn.approve {
  color: #166534;
}

.actions-cell .action-btn.reject {
  color: #dc2626;
}

.actions-cell .action-btn.delete {
  color: #64748b;
}

.actions-cell .action-btn:hover {
  transform: none;
  background: #f8fafc;
}

/* Paginación */
.pagination {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: #64748b;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #475569;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #475569;
}

.page-number:hover {
  background: #f1f5f9;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.page-size-selector select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: #475569;
}

/* Responsive */
@media (max-width: 1200px) {
  .reviews-table {
    font-size: 0.9rem;
  }
  
  .reviews-table th, 
  .reviews-table td {
    padding: 0.75rem;
  }
}

@media (max-width: 992px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .reviews-table {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filters-grid,
  .results-summary {
    grid-template-columns: 1fr;
  }
  
  .selection-banner {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .selection-actions {
    flex-wrap: wrap;
  }
  
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .reviews-table {
    font-size: 0.8rem;
  }
  
  .reviews-table th, 
  .reviews-table td {
    padding: 0.5rem;
  }
}

@media (max-width: 576px) {
  .container {
    padding: 0;
  }
  
  .reviews-view {
    padding: 1rem 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>