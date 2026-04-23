<template>
  <div class="home">
    <!-- Header con menú de usuario -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo-section">
            <h1 class="logo">🎓 EstudiarApp</h1>
            <p class="tagline">Tu guía para la educación superior en el Huila</p>
          </div>
          
          <!-- Acciones del header con menú usuario -->
          <div class="header-actions">
            <!-- Comparador mejorado con menú desplegable -->
            <!-- En el template del HomeView, dentro del header -->
            <div class="comparison-dropdown">
  <button @click="toggleComparisonDropdown" class="action-btn comparison-btn">
    <span class="action-icon">⚖️</span>
    <span class="action-text">Comparar</span>
    <span v-if="comparisonStore.universityCount > 0" class="badge">
      {{ comparisonStore.universityCount }}
    </span>
    <span class="dropdown-arrow">▼</span>
  </button>
  
  <!-- Dropdown de comparación -->
  <div v-if="showComparisonDropdown" class="dropdown-menu comparison-menu">
    <div class="dropdown-header">
      <h4>Universidades en Comparación</h4>
      <button 
        v-if="comparisonStore.universityCount > 0" 
        @click="clearComparison" 
        class="clear-all-btn"
      >
        Limpiar
      </button>
    </div>
    <div v-if="comparisonStore.universityCount === 0" class="empty-state">
      <p>No hay universidades para comparar</p>
      <button @click="showComparisonDropdown = false" class="btn-primary">Cerrar</button>
    </div>
    <div v-else>
      <div class="comparison-items">
        <div 
          v-for="item in comparisonStore.universityItems" 
          :key="item.id"
          class="comparison-item"
        >
          <div class="comparison-item-info">
            <strong>{{ item.name }}</strong>
            <small>{{ item.city }}</small>
          </div>
          <button 
            @click.stop="removeFromComparison(item)" 
            class="remove-btn"
            title="Eliminar de comparación"
          >
            ✕
          </button>
        </div>
      </div>
      <div class="dropdown-actions">
        <button @click="goToComparison" class="btn-primary">
          Ver Comparación ({{ comparisonStore.universityCount }}/3)
        </button>
        <button @click="showComparisonDropdown = false" class="btn-secondary">
          Cerrar
        </button>
      </div>
    </div>
  </div>
            </div>
            
            <!-- Favoritos -->
            <button @click="goToFavorites" class="action-btn favorites-btn">
  <span class="action-icon">⭐</span>
  <span class="action-text">Favoritos</span>
  <span v-if="favoritesStore.favoritesCount > 0" class="badge">
    {{ favoritesStore.favoritesCount }}
  </span>
            </button>

            <!-- Menú de usuario -->
            <div class="user-menu-dropdown">
              <button @click="handleUserAction" class="action-btn user-btn">
                <span class="action-icon">👤</span>
                <span class="action-text">{{ userButtonText }}</span>
              </button>
              
              <!-- Dropdown de usuario -->
              <div v-if="authStore.isAuthenticated && showUserMenu" class="dropdown-menu user-menu">
                <div class="user-info">
                  <div class="user-avatar">
                    <span>👤</span>
                  </div>
                  <div class="user-details">
                    <strong>{{ authStore.user?.name || 'Usuario' }}</strong>
                    <small>{{ authStore.user?.email }}</small>
                  </div>
                </div>
                <div class="menu-items">
                  <button @click="goToProfile" class="menu-item">
                    <span>👤</span> Mi Perfil
                  </button>
                  <button @click="goToReviews" class="menu-item">
                    <span>📝</span> Mis Reseñas
                  </button>
                  <button @click="goToNotifications" class="menu-item">
                    <span>🔔</span> Notificaciones
                    <span v-if="unreadNotifications > 0" class="notification-badge">
                      {{ unreadNotifications }}
                    </span>
                  </button>
                  <button @click="logout" class="menu-item logout">
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h2 class="hero-title">Encuentra tu programa ideal</h2>
          <p class="hero-subtitle">Explora la oferta académica de instituciones en el departamento del Huila</p>
          
          <!-- Búsqueda mejorada con filtros avanzados -->
          <div class="search-container">
            <div class="search-wrapper">
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Buscar universidades, programas, ciudades..."
                class="search-input"
                @keyup.enter="handleSearch"
                @input="handleSearchInput"
              >
              <button @click="handleSearch" class="search-btn">
                <span class="search-icon">🔍</span>
                <span class="search-text">Buscar</span>
              </button>
            </div>
            
            <!-- Filtros avanzados -->
            <div class="advanced-filters">
              <div class="filter-group">
                <label>Tipo de Institución:</label>
                <select v-model="selectedType" @change="applyFilters" class="filter-select">
                  <option value="">Todos</option>
                  <option value="public">Pública</option>
                  <option value="private">Privada</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Rango de Costo:</label>
                <select v-model="selectedCost" @change="applyFilters" class="filter-select">
                  <option value="">Todos</option>
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Ordenar por:</label>
                <select v-model="sortBy" @change="applyFilters" class="filter-select">
                  <option value="name">Nombre (A-Z)</option>
                  <option value="rating">Rating (Mayor)</option>
                  <option value="programs">Más Programas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtros rápidos mejorados -->
        <div class="filters-section">
          <div class="filters-header">
            <h4 class="filters-title">Ciudades Populares:</h4>
            <button 
              v-if="selectedCity" 
              @click="clearCityFilter" 
              class="clear-filter-btn"
            >
              ✕ Limpiar filtro
            </button>
          </div>
          
          <div class="filters">
            <button 
              @click="filterByCity('')"
              class="filter-btn"
              :class="{ active: selectedCity === '' }"
            >
              <span class="filter-icon">🌎</span>
              <span class="filter-text">Todas ({{ universitiesStore.universities?.length || 0 }})</span>
            </button>
            <button 
              v-for="city in topCities" 
              :key="city.name"
              @click="filterByCity(city.name)"
              class="filter-btn"
              :class="{ active: selectedCity === city.name }"
            >
              <span class="filter-icon">🏙️</span>
              <span class="filter-text">{{ city.name }} ({{ city.count }})</span>
            </button>
            <button @click="showAllCities = !showAllCities" class="filter-btn show-more">
              <span class="filter-icon">{{ showAllCities ? '👆' : '👇' }}</span>
              <span class="filter-text">{{ showAllCities ? 'Ver menos' : 'Ver más' }}</span>
            </button>
          </div>
          
          <!-- Mostrar todas las ciudades si está activado -->
          <div v-if="showAllCities" class="all-cities">
            <div class="cities-grid">
              <button 
                v-for="city in citiesWithCount" 
                :key="city.name"
                @click="filterByCity(city.name)"
                class="city-btn"
                :class="{ active: selectedCity === city.name }"
              >
                {{ city.name }} ({{ city.count }})
              </button>
            </div>
          </div>
          
          <!-- Barra de estado de comparación mejorada -->
          <div v-if="comparisonCount > 0" class="comparison-status-bar">
            <div class="status-content">
              <div class="status-info">
                <span class="status-icon">⚖️</span>
                <span class="status-text">
                  Tienes <strong>{{ comparisonCount }}</strong> programa{{ comparisonCount !== 1 ? 's' : '' }} en comparación
                  <span v-if="comparisonCount < 3" class="hint">(Agrega {{ 3 - comparisonCount }} más)</span>
                </span>
              </div>
              <div class="status-actions">
                <button @click="clearComparison" class="btn-secondary">Limpiar</button>
                <button @click="goToComparison" class="btn-primary">
                  Ver Comparación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container">
        <!-- Layout de dos columnas: contenido principal + sidebar -->
        <div class="content-wrapper">
          <!-- Columna principal (universidades + reseñas) -->
          <div class="main-column">
            <!-- Resultados con estadísticas -->
            <div class="results-section">
              <div class="results-header">
                <div class="results-title">
                  <h3>Universidades Disponibles</h3>
                  <div class="results-stats">
                    <span class="count">({{ filteredUniversities.length }})</span>
                    <span class="stats-separator">•</span>
                    <span class="average-rating" v-if="averageRating > 0">
                      ⭐ {{ averageRating.toFixed(1) }} promedio
                    </span>
                  </div>
                </div>
                
                <!-- Filtros activos -->
                <div v-if="activeFilters.length > 0" class="active-filters">
                  <div class="active-filter-content">
                    <span class="filter-label">Filtros aplicados:</span>
                    <div class="filter-tags">
                      <span v-for="filter in activeFilters" :key="filter.key" class="filter-tag">
                        {{ filter.label }}
                        <button @click="removeFilter(filter.key)" class="tag-remove">✕</button>
                      </span>
                      <button @click="clearAllFilters" class="clear-all-btn">
                        Limpiar todos
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Grid de Universidades -->
              <div v-if="filteredUniversities.length > 0" class="universities-grid">
                <div 
                  v-for="university in paginatedUniversities" 
                  :key="getUniversityId(university)"
                  class="university-card"
                  :class="{
                    'favorited': isFavorite(university),
                    'in-comparison': isInComparison(university),
                    'has-reviews': hasReviews(university)
                  }"
                  @click="handleCardClick(university)"
                >
                  <!-- Indicadores de estado (favorito, comparación, reseñas) -->
                  <div class="card-indicators">
                    <div v-if="isFavorite(university)" class="indicator favorite" title="Favorito">
                      ⭐
                    </div>
                    <div v-if="isInComparison(university)" class="indicator comparison" title="En comparación">
                      ⚖️
                    </div>
                    <div v-if="hasReviews(university)" class="indicator reviews" title="Tiene reseñas">
                      📝
                    </div>
                  </div>

                  <!-- Header de la tarjeta -->
                  <div class="card-header">
                    <div class="university-header">
                      <h3>{{ getUniversityName(university) }}</h3>
                      <div class="header-badges">
                        <span class="university-type" :class="getUniversityType(university)">
                          {{ getUniversityType(university) === 'public' ? '🏛️ Pública' : '🏢 Privada' }}
                        </span>
                        <div v-if="getUniversityRating(university)" class="rating-section">
                          <div class="rating-display">
                            <span class="stars">
                              <span v-for="star in 5" :key="star">
                                {{ star <= Math.round(getUniversityRating(university)!) ? '★' : '☆' }}
                              </span>
                            </span>
                            <span class="rating-value">{{ getUniversityRating(university)?.toFixed(1) }}</span>
                          </div>
                          <span v-if="getReviewsCount(university) > 0" class="reviews-count">
                            ({{ getReviewsCount(university) }})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="cost-badge">
                      {{ getEstimatedCost(university) }}
                    </div>
                  </div>

                  <!-- Ubicación -->
                  <div class="location-section">
                    <span class="location-icon">📍</span>
                    <div class="location-info">
                      <strong>{{ university.city || 'Ciudad no especificada' }}</strong>
                      <small>{{ university.country || 'Colombia' }}</small>
                    </div>
                  </div>

                  <!-- Reseñas recientes (si existen) -->
                  <div v-if="hasReviews(university)" class="reviews-summary">
                    <div class="reviews-header">
                      <h5>Reseñas recientes</h5>
                      <button 
                        @click.stop="viewUniversityReviews(university)"
                        class="view-reviews-btn"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div class="reviews-preview">
                      <div 
                        v-for="review in getRecentReviews(university, 1)" 
                        :key="review.id"
                        class="review-preview"
                      >
                        <div class="review-rating">
                          <span class="review-stars">
                            {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                          </span>
                          <span>{{ review.rating }}/5</span>
                        </div>
                        <p class="review-excerpt">{{ truncateText(review.content, 80) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Programas destacados -->
                  <div v-if="hasPrograms(university)" class="programs-section">
                    <h5>🎓 Programas destacados</h5>
                    <div class="programs-list">
                      <span 
                        v-for="program in getTopPrograms(university, 3)" 
                        :key="program.name"
                        class="program-tag"
                        :class="getProgramType(program)"
                      >
                        {{ program.name }}
                        <span v-if="program.duration" class="program-duration">
                          ({{ program.duration }})
                        </span>
                      </span>
                      <span v-if="getProgramsCount(university) > 3" class="more-programs">
                        +{{ getProgramsCount(university) - 3 }} más
                      </span>
                    </div>
                  </div>

                  <!-- Descripción -->
                  <p v-if="university.description" class="description">
                    {{ truncateDescription(university.description, 120) }}
                  </p>

                  <!-- Metadatos -->
                  <div class="metadata">
                    <span class="metadata-item">
                      <span>🏛️</span>
                      <span>{{ university.campus || 'Sede principal' }}</span>
                    </span>
                    <span v-if="university.founded" class="metadata-item">
                      <span>📅</span>
                      <span>Desde {{ university.founded }}</span>
                    </span>
                    <span v-if="university.accreditation" class="metadata-item">
                      <span>✅</span>
                      <span>Acreditada</span>
                    </span>
                  </div>

                  <!-- Footer con acciones -->
                  <div class="card-footer">
                    <div class="action-buttons">
                      <button 
                        @click.stop="toggleFavorite(university)"
                        class="btn-action btn-favorite"
                        :class="{ active: isFavorite(university) }"
                        :title="isFavorite(university) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                      >
                        <span>{{ isFavorite(university) ? '★' : '☆' }}</span>
                        <span class="btn-text">Favorito</span>
                      </button>
                      
                      <button 
                        @click.stop="toggleComparison(university)"
                        class="btn-action btn-compare"
                        :class="{ active: isInComparison(university) }"
                        :title="isInComparison(university) ? 'Quitar de comparación' : 'Comparar'"
                      >
                        <span>⚖️</span>
                        <span class="btn-text">Comparar</span>
                      </button>
                      
                      <button 
                        v-if="hasReviews(university)"
                        @click.stop="viewUniversityReviews(university)"
                        class="btn-action btn-reviews"
                      >
                        <span>📝</span>
                        <span class="btn-text">{{ getReviewsCount(university) }} reseñas</span>
                      </button>
                    </div>
                    
                    <button 
                      @click.stop="goToUniversityDetails(getUniversityId(university))"
                      class="btn-details"
                    >
                      Ver detalles →
                    </button>
                  </div>
                </div>
              </div>

              <!-- Estado vacío si no hay universidades -->
              <div v-else class="no-results">
                <div class="no-results-content">
                  <div class="no-results-icon">🔍</div>
                  <h4>No se encontraron universidades</h4>
                  <p>No hay universidades que coincidan con tu búsqueda.</p>
                  <div class="suggestions">
                    <p>Prueba con:</p>
                    <ul>
                      <li>Cambiar los términos de búsqueda</li>
                      <li>Limpiar los filtros activos</li>
                      <li>Explorar todas las ciudades</li>
                    </ul>
                  </div>
                  <button @click="clearAllFilters" class="btn-primary">
                    Ver todas las universidades
                  </button>
                </div>
              </div>

              <!-- Sección de Reseñas Recientes -->
              <section v-if="hasReviewsToShow" class="reviews-preview-section">
                <div class="section-header">
                  <h3>📝 Reseñas recientes de estudiantes</h3>
                  <router-link to="/reviews" class="view-all-link">
                    Ver todas las reseñas →
                  </router-link>
                </div>
                
                <div class="reviews-preview-grid">
                  <div 
                    v-for="review in recentReviews" 
                    :key="review.id"
                    class="review-preview-card"
                    @click="goToUniversityReviews(review.entityId)"
                  >
                    <div class="review-header">
                      <div class="reviewer-avatar">
                        <img v-if="review.userAvatar" :src="review.userAvatar" :alt="review.userName">
                        <div v-else class="avatar-fallback">
                          {{ review.userName.charAt(0) }}
                        </div>
                      </div>
                      <div class="reviewer-info">
                        <h4>{{ review.userName }}</h4>
                        <div class="review-meta">
                          <span class="university-name">{{ getUniversityNameById(review.entityId) }}</span>
                          <span class="review-date">{{ formatReviewDate(review.createdAt) }}</span>
                        </div>
                      </div>
                      <div class="review-rating">
                        <span class="stars">
                          <span v-for="star in 5" :key="star">
                            {{ star <= review.rating ? '★' : '☆' }}
                          </span>
                        </span>
                        <span class="rating-value">{{ review.rating }}/5</span>
                      </div>
                    </div>
                    
                    <h5 class="review-title">{{ review.title }}</h5>
                    <p class="review-excerpt">{{ truncateText(review.content, 100) }}</p>
                    
                    <div class="review-footer">
                      <span class="helpful-count">
                        👍 {{ review.helpfulCount }} útil
                      </span>
                      <button @click.stop="goToUniversityReviews(review.entityId)" class="read-more-btn">
                        Leer más →
                      </button>
                    </div>
                  </div>
                </div>
              </section>

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
                  <button 
                    v-for="page in visiblePages" 
                    :key="page"
                    @click="goToPage(page)"
                    class="page-number"
                    :class="{ active: page === currentPage }"
                  >
                    {{ page }}
                  </button>
                  <span v-if="showEllipsis" class="ellipsis">...</span>
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
          </div>

          <!-- Sidebar de estadísticas (columna derecha) -->
          <aside class="sidebar">
            <div class="stats-card">
              <h4>📊 Estadísticas</h4>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">Universidades totales:</span>
                  <span class="stat-value">{{ universitiesStore.universities?.length || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Ciudades:</span>
                  <span class="stat-value">{{ citiesWithCount.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Públicas/Privadas:</span>
                  <span class="stat-value">
                    {{ publicCount }}/{{ privateCount }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Reseñas totales:</span>
                  <span class="stat-value">{{ totalReviews }}</span>
                </div>
              </div>
            </div>
            
            <div class="quick-actions">
              <h4>⚡ Acciones rápidas</h4>
              <button @click="goToAddUniversity" class="quick-action-btn">
                <span>➕</span> Agregar Universidad
              </button>
              <button @click="goToWriteReview" class="quick-action-btn">
                <span>📝</span> Escribir Reseña
              </button>
              <button @click="goToScholarships" class="quick-action-btn">
                <span>💰</span> Buscar Becas
              </button>
            </div>
            
            <!-- Top universidades por rating -->
            <div class="top-universities">
              <h4>🏆 Top Universidades</h4>
              <div class="top-list">
                <div 
                  v-for="uni in topRatedUniversities" 
                  :key="getUniversityId(uni)"
                  class="top-item"
                  @click="goToUniversityDetails(getUniversityId(uni))"
                >
                  <span class="rank">{{ uni.rank }}</span>
                  <span class="name">{{ getUniversityName(uni) }}</span>
                  <span class="rating">⭐ {{ getUniversityRating(uni) || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h5>🎓 EstudiarApp</h5>
            <p>Tu guía para la educación superior</p>
          </div>
          <div class="footer-section">
            <h5>Enlaces rápidos</h5>
            <a @click.prevent="goToFavorites">⭐ Favoritos</a>
            <a @click.prevent="goToComparison">⚖️ Comparar</a>
            <a @click.prevent="goToReviews">📝 Reseñas</a>
          </div>
          <div class="footer-section">
            <p>&copy; 2025 EstudiarApp - Oferta Académica del Huila</p>
            <small>v1.2.0 • Con sistema de reseñas</small>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRouter } from 'vue-router';
import { useUniversitiesStore } from '@/stores/universities';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';
import { useReviewsStore } from '@/stores/reviews';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const universitiesStore = useUniversitiesStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();
const reviewsStore = useReviewsStore();
const authStore = useAuthStore();

// ============ REFS Y ESTADOS ============
const searchQuery = ref("");
const selectedCity = ref("");
const selectedType = ref("");
const selectedCost = ref("");
const sortBy = ref("name");
const showAllCities = ref(false);
const showComparisonDropdown = ref(false);
const showUserMenu = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(12);

// En el script setup de HomeView.vue

// En HomeView.vue, reemplaza las funciones de favoritos:

// ============ FUNCIONES DE FAVORITOS ACTUALIZADAS ============

const favoritesCount = computed(() => {
  return favoritesStore.favoritesCount;
});

const userButtonText = computed(() => {
  if (!authStore.isAuthenticated) {
    return 'Iniciar sesión';
  }

  if (authStore.isSuperAdmin) {
    return 'Panel Admin';
  }

  return authStore.user?.name || 'Mi Cuenta';
});

const isFavorite = (universityOrId: any): boolean => {
  if (!favoritesStore || !favoritesStore.favorites) return false;
  
  let universityId: string;
  
  if (typeof universityOrId === 'string') {
    universityId = universityOrId;
  } else if (universityOrId && typeof universityOrId === 'object') {
    universityId = getUniversityId(universityOrId);
  } else {
    return false;
  }
  
  if (!universityId) return false;
  
  // Usar el método correcto del store actualizado
  if (favoritesStore.isUniversityFavorite) {
    return favoritesStore.isUniversityFavorite(universityId);
  } else if (favoritesStore.isFavorite) {
    // Método antiguo para compatibilidad
    return favoritesStore.isFavorite(universityId);
  }
  
  // Fallback: buscar manualmente
  return favoritesStore.favorites.some((fav: any) => {
    const favId = fav.id || fav._id;
    return favId === universityId;
  });
};

const toggleFavorite = (university: any, event?: Event) => {
  if (event) event.stopPropagation();
  
  if (!favoritesStore) return;
  
  const universityId = getUniversityId(university);
  const universityName = getUniversityName(university);
  
  if (!universityId) {
    console.error('No se pudo obtener ID de la universidad');
    return;
  }
  
  try {
    if (isFavorite(universityId)) {
      // Si ya es favorito, eliminarlo
      if (favoritesStore.removeUniversityFromFavorites) {
        favoritesStore.removeUniversityFromFavorites(universityId);
      } else if (favoritesStore.removeFavorite) {
        favoritesStore.removeFavorite(universityId);
      }
      showNotification(`❌ "${universityName}" removido de favoritos`, 'info');
    } else {
      // Si no es favorito, agregarlo
      const universityToAdd = {
        id: universityId,
        _id: university._id || universityId,
        name: universityName,
        city: university.city || 'Sin ciudad',
        country: university.country || 'Colombia',
        type: getUniversityType(university),
        description: university.description || '',
        programs: university.programs || [],
        rating: getUniversityRating(university) || null
      };
      
      // Usar el método correcto del store actualizado
      if (favoritesStore.addUniversityToFavorites) {
        favoritesStore.addUniversityToFavorites(universityToAdd);
      } else if (favoritesStore.addFavorite) {
        // Método antiguo para compatibilidad
        favoritesStore.addFavorite(universityToAdd);
      }
      showNotification(`⭐ "${universityName}" agregado a favoritos`, 'success');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar favoritos';
    console.error('Error en toggleFavorite:', error);
    showNotification(errorMessage, 'error');
  }
};

// ============ FUNCIÓN DE NOTIFICACIÓN MEJORADA ============

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Verificar si ya hay estilos
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .notification-success {
        background: #d4edda;
        color: #155724;
        border-left: 4px solid #28a745;
      }
      .notification-error {
        background: #f8d7da;
        color: #721c24;
        border-left: 4px solid #dc3545;
      }
      .notification-info {
        background: #d1ecf1;
        color: #0c5460;
        border-left: 4px solid #17a2b8;
      }
      .notification-icon {
        font-size: 1.2rem;
      }
      .notification-message {
        flex: 1;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Iconos según tipo
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${icons[type]}</span>
    <span class="notification-message">${message}</span>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);


// ============ COMPUTED PROPERTIES MEJORADAS ============
}

const unreadNotifications = computed(() => {
  // Por ahora retornar 0, luego integrar con store de notificaciones
  return 0;
});

const citiesWithCount = computed(() => {
  const cityCount: { [key: string]: number } = {};
  
  if (!universitiesStore?.universities) return [];
  
  universitiesStore.universities.forEach(university => {
    const city = university.city;
    if (city) {
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  });
  
  return Object.entries(cityCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});

const topCities = computed(() => {
  return citiesWithCount.value.slice(0, 6);
});

const publicCount = computed(() => {
  return universitiesStore.universities?.filter(u => 
    getUniversityType(u) === 'public'
  ).length || 0;
});

const privateCount = computed(() => {
  return universitiesStore.universities?.filter(u => 
    getUniversityType(u) === 'private'
  ).length || 0;
});

const totalReviews = computed(() => {
  return reviewsStore?.reviews?.length || 0;
});

const averageRating = computed(() => {
  const universities = filteredUniversities.value;
  if (universities.length === 0) return 0;
  
  const total = universities.reduce((sum, uni) => {
    const rating = getUniversityRating(uni);
    return sum + (rating || 0);
  }, 0);
  
  return total / universities.length;
});

const activeFilters = computed(() => {
  const filters = [];
  
  if (selectedCity.value) {
    filters.push({
      key: 'city',
      label: `Ciudad: ${selectedCity.value}`,
      value: selectedCity.value
    });
  }
  
  if (selectedType.value) {
    const typeLabel = selectedType.value === 'public' ? 'Pública' : 'Privada';
    filters.push({
      key: 'type',
      label: `Tipo: ${typeLabel}`,
      value: selectedType.value
    });
  }
  
  if (selectedCost.value) {
    const costLabel = {
      'low': 'Costo bajo',
      'medium': 'Costo medio',
      'high': 'Costo alto'
    }[selectedCost.value] || selectedCost.value;
    
    filters.push({
      key: 'cost',
      label: `Costo: ${costLabel}`,
      value: selectedCost.value
    });
  }
  
  return filters;
});

const filteredUniversities = computed(() => {
  if (!universitiesStore?.universities) return [];
  
  let filtered = universitiesStore.universities;

  // Filtrar por ciudad
  if (selectedCity.value) {
    filtered = filtered.filter(u => {
      const city = u.city;
      return city?.toLowerCase() === selectedCity.value.toLowerCase();
    });
  }

  // Filtrar por tipo
  if (selectedType.value) {
    filtered = filtered.filter(u => {
      return getUniversityType(u) === selectedType.value;
    });
  }

  // Filtrar por costo
  if (selectedCost.value) {
    filtered = filtered.filter(u => {
      const cost = getEstimatedCostLevel(u);
      return cost === selectedCost.value;
    });
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(university => {
      const nameMatch = university.name?.toLowerCase().includes(query) || false;
      const cityMatch = university.city?.toLowerCase().includes(query) || false;
      const descriptionMatch = university.description?.toLowerCase().includes(query) || false;
      const programMatch = university.programs?.some((program: any) => 
        program.name?.toLowerCase().includes(query)
      ) || false;
      
      return nameMatch || cityMatch || descriptionMatch || programMatch;
    });
  }

  return filtered;
});

const sortedUniversities = computed(() => {
  const universities = [...filteredUniversities.value];
  
  switch (sortBy.value) {
    case 'rating':
      return universities.sort((a, b) => {
        const ratingA = getUniversityRating(a) || 0;
        const ratingB = getUniversityRating(b) || 0;
        return ratingB - ratingA;
      });
      
    case 'programs':
      return universities.sort((a, b) => {
        const countA = getProgramsCount(a);
        const countB = getProgramsCount(b);
        return countB - countA;
      });
      
    case 'name':
    default:
      return universities.sort((a, b) => {
        const nameA = getUniversityName(a).toLowerCase();
        const nameB = getUniversityName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }
});

const paginatedUniversities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedUniversities.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(sortedUniversities.value.length / itemsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    const start = Math.max(2, currentPage.value - 1);
    const end = Math.min(totalPages.value - 1, currentPage.value + 1);
    
    pages.push(1);
    
    if (start > 2) pages.push('...');
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages.value - 1) pages.push('...');
    
    if (totalPages.value > 1) {
      pages.push(totalPages.value);
    }
  }
  
  return pages;
});

const showEllipsis = computed(() => {
  return totalPages.value > 5 && !visiblePages.value.includes('...');
});

const topRatedUniversities = computed(() => {
  const universities = [...(universitiesStore.universities || [])]
    .filter(uni => getUniversityRating(uni))
    .sort((a, b) => {
      const ratingA = getUniversityRating(a) || 0;
      const ratingB = getUniversityRating(b) || 0;
      return ratingB - ratingA;
    })
    .slice(0, 5)
    .map((uni, index) => ({
      ...uni,
      rank: index + 1
    }));
  
  return universities;
});

// ============ FUNCIONES PARA RESEÑAS ============

const recentReviews = computed(() => {
  const allReviews = reviewsStore.reviews
    .filter(r => r.status === 'approved')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return allReviews.slice(0, 3);
});

const hasReviewsToShow = computed(() => {
  return recentReviews.value.length > 0;
});

const getUniversityNameById = (id: string) => {
  const university = universitiesStore.universities.find(u => {
    const universityId = u.id || u._id;
    return universityId === id;
  });
  return university?.name || 'Universidad';
};

const formatReviewDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });
};

const goToUniversityReviews = (universityId: string) => {
  router.push(`/university/${universityId}/reviews`);
};

// ============ FUNCIONES HELPER MEJORADAS ============

const getUniversityId = (university: any): string => {
  const id = university?.id || university?._id;
  if (id) return id;
  return `uni-${university?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
};

const getUniversityName = (university: any): string => {
  return university.name || 'Sin nombre';
};

const getUniversityType = (university: any): string => {
  const type = (university.type || '').toLowerCase();
  if (type.includes('public') || type.includes('pública')) return 'public';
  return 'private';
};

const getUniversityRating = (university: any): number | null => {
  if (university.rating !== undefined) return university.rating;
  
  // Calcular rating promedio de reseñas si existe
  const reviews = getUniversityReviews(university);
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    return parseFloat(avg.toFixed(1));
  }
  
  return null;
};

const getEstimatedCost = (university: any): string => {
  const cost = university.cost || university.tuition;
  if (!cost) return 'Costo no especificado';
  
  if (typeof cost === 'number') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(cost);
  }
  
  return cost;
};

const getEstimatedCostLevel = (university: any): string => {
  const cost = university.cost || university.tuition;
  if (!cost) return 'unknown';
  
  if (typeof cost === 'number') {
    if (cost < 2000000) return 'low';
    if (cost < 5000000) return 'medium';
    return 'high';
  }
  
  return 'unknown';
};

const hasPrograms = (university: any): boolean => {
  return Array.isArray(university.programs) && university.programs.length > 0;
};

const getTopPrograms = (university: any, limit: number = 3): any[] => {
  if (!hasPrograms(university)) return [];
  return university.programs.slice(0, limit);
};

const getProgramsCount = (university: any): number => {
  return hasPrograms(university) ? university.programs.length : 0;
};

const getProgramType = (program: any): string => {
  const type = program.type || '';
  if (type.includes('pregrado')) return 'undergrad';
  if (type.includes('posgrado')) return 'graduate';
  if (type.includes('tecnico')) return 'technical';
  return 'other';
};

const truncateDescription = (text: string, length: number = 100): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const truncateText = (text: string, length: number = 60): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num);
};

// ============ FUNCIONES DE RESEÑAS ============

const hasReviews = (university: any): boolean => {
  const reviews = getUniversityReviews(university);
  return reviews.length > 0;
};

const getReviewsCount = (university: any): number => {
  return getUniversityReviews(university).length;
};

const getUniversityReviews = (university: any): any[] => {
  if (!reviewsStore?.reviews) return [];
  const universityId = getUniversityId(university);
  return reviewsStore.reviews.filter(review => review.entityId === universityId);
};

const getRecentReviews = (university: any, limit: number = 2): any[] => {
  const reviews = getUniversityReviews(university);
  return reviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// ============ MÉTODOS PRINCIPALES ============

const handleCardClick = (university: any, event?: Event) => {
  const target = event?.target as HTMLElement;
  if (target?.closest('.btn-action') || target?.closest('.view-reviews-btn')) {
    return;
  }
  
  const universityId = getUniversityId(university);
  goToUniversityDetails(universityId);
};

const goToUniversityDetails = (id: string) => {
  router.push(`/university/${id}`).catch(err => {
    console.error('Error navegando a detalles:', err);
  });
};

// ============ FUNCIONES DE COMPARACIÓN ACTUALIZADAS ============

const comparisonCount = computed(() => {
  return comparisonStore.universityCount;
});

const isInComparison = (universityOrId: any): boolean => {
  let universityId: string;
  
  if (typeof universityOrId === 'string') {
    universityId = universityOrId;
  } else if (universityOrId && typeof universityOrId === 'object') {
    universityId = getUniversityId(universityOrId);
  } else {
    return false;
  }
  
  if (!universityId) return false;
  
  return comparisonStore.isUniversityInComparison(universityId);
};

const toggleComparison = (university: any, event?: Event) => {
  if (event) event.stopPropagation();
  
  const universityId = getUniversityId(university);
  const universityName = getUniversityName(university);
  
  if (!universityId) return;
  
  try {
    if (isInComparison(universityId)) {
      // Si ya está en comparación, eliminarla
      comparisonStore.removeUniversityFromComparison(universityId);
      showNotification(`${universityName} eliminada de la comparación`, 'info');
    } else {
      // Si no está en comparación, agregarla
      if (comparisonStore.universityCount >= 3) {
        alert('Máximo 3 universidades en comparación. Elimina una para agregar otra.');
        return;
      }
      
      const universityToAdd = {
        id: universityId,
        _id: university._id || universityId,
        name: universityName,
        city: university.city || 'Sin ciudad',
        country: university.country || 'Colombia',
        type: getUniversityType(university),
        description: university.description || '',
        programs: university.programs || [],
        rating: getUniversityRating(university) || null
      };
      
      comparisonStore.addUniversityToComparison(universityToAdd);
      showNotification(`${universityName} agregada a la comparación`, 'success');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar comparación';
    alert(errorMessage);
  }
};

const removeFromComparison = (university: any) => {
  const universityId = getUniversityId(university);
  try {
    comparisonStore.removeUniversityFromComparison(universityId);
    showNotification(`${getUniversityName(university)} eliminada de la comparación`, 'info');
  } catch (error) {
    console.error('Error eliminando de comparación:', error);
  }
};

const clearComparison = () => {
  if (comparisonStore.universityCount === 0) {
    alert('No hay universidades en comparación');
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres limpiar todas las universidades de la comparación?')) {
    try {
      comparisonStore.clearComparison();
      showNotification('Comparación limpiada correctamente', 'info');
    } catch (error) {
      console.error('Error limpiando comparación:', error);
    }
  }
};

const goToComparison = () => {
  if (comparisonStore.universityCount === 0) {
    alert('Agrega al menos una universidad para comparar');
    return;
  }
  
  // Asegurarnos de que estamos en modo universidades
  comparisonStore.setViewMode('universities');
  
  router.push('/comparison');
  showComparisonDropdown.value = false;
};

// ============ MÉTODOS DE NAVEGACIÓN ============

const goToFavorites = () => {
  router.push('/favorites');
};

const goToReviews = () => {
  router.push('/reviews');
};

const goToProfile = () => {
  router.push('/perfil');
};

const goToNotifications = () => {
  router.push('/notifications');
};

const viewUniversityReviews = (university: any) => {
  const universityId = getUniversityId(university);
  router.push(`/university/${universityId}/reviews`);
};

const goToAddUniversity = () => {
  router.push('/admin/add-university');
};

const goToWriteReview = () => {
  if (universitiesStore.universities.length > 0) {
    router.push('/write-review');
  } else {
    alert('Primero selecciona una universidad para reseñar');
  }
};

const goToScholarships = () => {
  router.push('/scholarships');
};

const logout = () => {
  authStore.logout();
  // Lógica de logout
  showUserMenu.value = false;
  router.push('/login');
};

// ============ MÉTODOS DE FILTRADO Y BÚSQUEDA ============

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchInput = () => {
  // Debounce natural
  currentPage.value = 1;
};

const filterByCity = (city: string) => {
  selectedCity.value = city;
  currentPage.value = 1;
  showAllCities.value = false;
};

const clearCityFilter = () => {
  selectedCity.value = '';
  currentPage.value = 1;
};

const applyFilters = () => {
  currentPage.value = 1;
};

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'city':
      selectedCity.value = '';
      break;
    case 'type':
      selectedType.value = '';
      break;
    case 'cost':
      selectedCost.value = '';
      break;
  }
  currentPage.value = 1;
};

const clearAllFilters = () => {
  selectedCity.value = '';
  selectedType.value = '';
  selectedCost.value = '';
  searchQuery.value = '';
  sortBy.value = 'name';
  currentPage.value = 1;
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

const goToPage = (page: number) => {
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// ============ DROPDOWNS ============

const toggleComparisonDropdown = () => {
  showComparisonDropdown.value = !showComparisonDropdown.value;
  showUserMenu.value = false;
};

const toggleUserMenu = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  showUserMenu.value = !showUserMenu.value;
  showComparisonDropdown.value = false;
};

const handleUserAction = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  if (authStore.isSuperAdmin) {
    router.push('/admin');
  } else {
    router.push('/perfil');
  }

  showUserMenu.value = false;
};

// ============ MOUNTED Y WATCHERS ============

onMounted(() => {
  authStore.checkAuth();
  console.log('🏠 HomeView mounted con sistema de reseñas');
  
  if (!universitiesStore.universities || universitiesStore.universities.length === 0) {
    universitiesStore.fetchUniversities();
  }
});

// Cerrar dropdowns al hacer click fuera
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.comparison-dropdown') && !target.closest('.user-menu-dropdown')) {
    showComparisonDropdown.value = false;
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// ============ DATOS DE EJEMPLO PARA RESEÑAS ============
// Nota: En producción, estos datos vendrán del store de reseñas

// Función para inicializar datos de ejemplo
const initSampleReviews = () => {
  if (reviewsStore && reviewsStore.reviews.length === 0 && universitiesStore.universities.length > 0) {
    const sampleReviews = [
      {
        id: 'rev-1',
        entityId: getUniversityId(universitiesStore.universities[0]),
        entityType: 'university',
        userId: 'user-1',
        userName: 'Ana Martínez',
        userAvatar: 'https://i.pravatar.cc/150?img=8',
        rating: 4.5,
        title: 'Excelente universidad',
        content: 'La infraestructura es moderna y los profesores son muy capacitados.',
        createdAt: new Date('2024-01-15'),
        helpfulCount: 12,
        notHelpfulCount: 2,
        status: 'approved'
      },
      {
        id: 'rev-2',
        entityId: getUniversityId(universitiesStore.universities[0]),
        entityType: 'university',
        userId: 'user-2',
        userName: 'Carlos López',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        rating: 3.8,
        title: 'Buena relación calidad-precio',
        content: 'Los programas son buenos pero las instalaciones podrían mejorar.',
        createdAt: new Date('2024-02-10'),
        helpfulCount: 8,
        notHelpfulCount: 1,
        status: 'approved'
      }
    ];
    
    // Agregar reseñas de ejemplo al store
    sampleReviews.forEach(review => {
      reviewsStore.addReview(review);
    });
  }
};

// Inicializar datos de ejemplo después de cargar las universidades
watch(() => universitiesStore.universities, () => {
  if (universitiesStore.universities.length > 0) {
    setTimeout(initSampleReviews, 500);
  }
});
</script>

<style scoped>
/* Estilos generales */
.home {
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Layout de dos columnas */
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr 300px;
  }
  
  .main-column {
    grid-column: 1;
  }
  
  .sidebar {
    grid-column: 2;
  }
}

/* Header mejorado */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem 0;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  font-size: 2rem;
  margin: 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.tagline {
  margin: 0;
  opacity: 0.9;
}

/* Header actions con dropdowns */
.header-actions {
  display: flex;
  gap: 1rem;
  position: relative;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.dropdown-arrow {
  font-size: 0.7rem;
  margin-left: 0.25rem;
}

.badge {
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 5px;
  font-weight: bold;
}

/* Dropdown menus */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  z-index: 1001;
  margin-top: 0.5rem;
}

.comparison-menu {
  max-width: 350px;
}

.user-menu {
  min-width: 250px;
}

.dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h4 {
  margin: 0;
  color: #333;
}

.clear-all-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.comparison-items {
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.remove-btn:hover {
  color: #ff6b6b;
}

.dropdown-actions {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 0.5rem;
}

/* User menu */
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.menu-items {
  padding: 0.5rem 0;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #333;
  transition: background-color 0.3s ease;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item.logout {
  color: #ff6b6b;
  border-top: 1px solid #e9ecef;
  margin-top: 0.5rem;
}

.notification-badge {
  background: #ff6b6b;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: auto;
}

/* Hero section mejorada */
.hero {
  background: white;
  padding: 3rem 0;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: #666;
  margin-bottom: 2rem;
}

/* Búsqueda mejorada */
.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-wrapper {
  display: flex;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  font-size: 1rem;
  background: white;
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0 2rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-btn:hover {
  opacity: 0.9;
}

/* Filtros avanzados */
.advanced-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  min-width: 150px;
}

/* Filtros rápidos */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-btn {
  padding: 0.75rem 1.25rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.filter-btn.show-more {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.all-cities {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.city-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.city-btn:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.city-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Barra de estado de comparación */
.comparison-status-bar {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px dashed #667eea;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  color: #333;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

/* Botones */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

/* Resultados */
.results-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.results-header {
  margin-bottom: 2rem;
}

.results-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.results-title h3 {
  margin: 0;
  color: #333;
}

.results-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: #666;
  font-size: 0.9rem;
}

.stats-separator {
  color: #999;
}

.average-rating {
  color: #f39c12;
  font-weight: 500;
}

/* Filtros activos */
.active-filters {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.active-filter-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: #333;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-tag {
  background: white;
  border: 1px solid #dee2e6;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #ff6b6b;
}

/* Grid de universidades mejorado */
.universities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

@media (max-width: 768px) {
  .universities-grid {
    grid-template-columns: 1fr;
  }
}

.university-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.university-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.university-card.favorited {
  border-color: #FFD700;
  background: linear-gradient(135deg, #ffffff 0%, #fff9e6 100%);
}

.university-card.in-comparison {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9f0 100%);
}

.university-card.has-reviews {
  border-left: 4px solid #9b59b6;
}

/* Indicadores de estado */
.card-indicators {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.indicator.favorite {
  background: #FFD700;
  color: #333;
}

.indicator.comparison {
  background: #4CAF50;
  color: white;
}

.indicator.reviews {
  background: #9b59b6;
  color: white;
}

/* Card header */
.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.university-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.university-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  line-height: 1.3;
  flex: 1;
  min-width: 200px;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.university-type {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.university-type.public {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.university-type.private {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.rating-section {
  display: flex;
  align-items: center;
}

.rating-display {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(255, 165, 0, 0.2);
}

.stars {
  font-size: 0.9rem;
}

.rating-value {
  font-weight: bold;
}

.reviews-count {
  opacity: 0.9;
  font-size: 0.8rem;
}

.cost-badge {
  background: #2ecc71;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

/* Card body */
.location-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.location-icon {
  font-size: 1.2rem;
}

.location-info {
  display: flex;
  flex-direction: column;
}

.reviews-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 3px solid #9b59b6;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.reviews-header h5 {
  margin: 0;
  color: #333;
}

.view-reviews-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.reviews-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-preview {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #f39c12;
  font-weight: 500;
}

.review-stars {
  font-size: 0.9rem;
}

.review-excerpt {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Programs section */
.programs-section {
  margin: 1rem 0;
}

.programs-section h5 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.programs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.program-tag {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.program-tag.undergrad {
  background: #3498db;
}

.program-tag.graduate {
  background: #9b59b6;
}

.program-tag.technical {
  background: #2ecc71;
}

.program-duration {
  font-size: 0.7rem;
  opacity: 0.9;
}

.more-programs {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
  margin-left: 0.25rem;
}

/* Description */
.description {
  color: #555;
  margin: 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Metadata */
.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

/* Card footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}

.btn-favorite {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.btn-favorite:hover {
  background: #ffe0b2;
}

.btn-favorite.active {
  background: #FFD700;
  color: #333;
  border-color: #FFA500;
  font-weight: 600;
}

.btn-compare {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.btn-compare:hover {
  background: #bbdefb;
}

.btn-compare.active {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

.btn-reviews {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.btn-reviews:hover {
  background: #e1bee7;
}

.btn-details {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 500;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.btn-details:hover {
  color: #764ba2;
  transform: translateX(4px);
}

/* Sección de reseñas recientes mejorada */
.reviews-preview-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-all-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-all-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.reviews-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.review-preview-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.review-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.review-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.reviewer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reviewer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.reviewer-info {
  flex: 1;
}

.reviewer-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1rem;
}

.review-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.university-name {
  color: #667eea;
  font-weight: 500;
  font-size: 0.9rem;
}

.review-date {
  color: #666;
  font-size: 0.8rem;
}

.review-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.review-rating .stars {
  color: #FFD700;
  font-size: 1.2rem;
}

.rating-value {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.review-title {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1.1rem;
  line-height: 1.4;
}

.review-excerpt {
  color: #666;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.helpful-count {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.read-more-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 500;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.read-more-btn:hover {
  color: #764ba2;
  transform: translateX(4px);
}

/* No results */
.no-results {
  text-align: center;
  padding: 4rem 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results h4 {
  color: #333;
  margin-bottom: 1rem;
}

.suggestions {
  text-align: left;
  max-width: 400px;
  margin: 1.5rem auto;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.suggestions p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #666;
}

.suggestions li {
  margin-bottom: 0.25rem;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
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

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover {
  border-color: #667eea;
}

.page-number.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.ellipsis {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  color: #999;
}

/* Sidebar */
.sidebar {
  position: sticky;
  top: 120px;
  align-self: start;
}

.stats-card,
.quick-actions,
.top-universities {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.stats-card h4,
.quick-actions h4,
.top-universities h4 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  text-align: left;
}

.quick-action-btn:hover {
  border-color: #667eea;
  background: #f8f9fa;
  transform: translateX(4px);
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.top-item:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.rank {
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
}

.rating {
  color: #f39c12;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Footer */
.footer {
  background: linear-gradient(135deg, #343a40 0%, #212529 100%);
  color: white;
  padding: 3rem 0;
  margin-top: 4rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
}

.footer-section {
  flex: 1;
  min-width: 200px;
}

.footer-section h5 {
  margin: 0 0 1rem 0;
  color: white;
  font-size: 1.1rem;
}

.footer-section a {
  display: block;
  color: #adb5bd;
  text-decoration: none;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: white;
  text-decoration: underline;
}

.footer-section p {
  margin: 0.5rem 0;
  color: #adb5bd;
}

.footer-section small {
  color: #6c757d;
}

/* Responsive para la sección de reseñas */
@media (max-width: 768px) {
  .reviews-preview-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .view-all-link {
    align-self: flex-end;
  }
}

/* Responsive general */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .dropdown-menu {
    position: fixed;
    top: 80px;
    left: 20px;
    right: 20px;
    width: calc(100% - 40px);
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .advanced-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .status-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .status-actions {
    justify-content: center;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .sidebar {
    position: static;
    margin-top: 2rem;
  }
}

@media (max-width: 480px) {
  .action-text {
    display: none;
  }
  
  .action-btn {
    padding: 0.75rem;
  }
  
  .search-wrapper {
    flex-direction: column;
    border-radius: 8px;
  }
  
  .search-btn {
    padding: 1rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .btn-action {
    padding: 0.5rem;
  }
  
  .btn-details {
    width: 100%;
    text-align: center;
  }
}
</style>
