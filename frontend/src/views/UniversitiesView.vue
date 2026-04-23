<template>
  <div class="universities-view">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo-section">
            <h1 class="logo">🎓 EstudiarApp</h1>
            <p class="tagline">Todas las Universidades</p>
          </div>
          
          <!-- Acciones del header -->
          <div class="header-actions">
            <!-- Comparador -->
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
                  <button @click="clearComparison" class="clear-all-btn">Limpiar</button>
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
                        @click.stop="removeUniversityFromComparison(item)" 
                        class="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div class="dropdown-actions">
                    <button @click="goToComparison" class="btn-primary">
                      Ver Comparación
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
              <span v-if="favoritesStore.universityFavoritesCount > 0" class="badge">
                {{ favoritesStore.universityFavoritesCount }}
              </span>
            </button>

            <!-- Menú de usuario -->
            <div class="user-menu-dropdown">
              <button @click="toggleUserMenu" class="action-btn user-btn">
                <span class="action-icon">👤</span>
                <span class="action-text">Mi Cuenta</span>
              </button>
              
              <div v-if="showUserMenu" class="dropdown-menu user-menu">
                <div class="user-info">
                  <div class="user-avatar">
                    <span>👤</span>
                  </div>
                  <div class="user-details">
                    <strong>Usuario</strong>
                    <small>Invitado</small>
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

    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <div class="container">
        <router-link to="/" class="breadcrumb-link">
          <span>🏠</span> Inicio
        </router-link>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">🏛️ Todas las Universidades</span>
      </div>
    </nav>

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">Explora Todas las Universidades</h1>
            <p class="hero-subtitle">
              Descubre y compara más de {{ universitiesStore.universities?.length || 0 }} instituciones 
              educativas disponibles
            </p>
            
            <!-- Búsqueda principal -->
            <div class="search-container">
              <div class="search-wrapper">
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Buscar universidades por nombre, ciudad, programas..."
                  class="search-input"
                  @keyup.enter="handleSearch"
                  @input="handleSearchInput"
                >
                <button @click="handleSearch" class="search-btn">
                  <span class="search-icon">🔍</span>
                  <span class="search-text">Buscar</span>
                </button>
              </div>
            </div>

            <!-- Filtros rápidos -->
            <div class="quick-filters">
              <div class="filters-header">
                <h4>Filtrar por:</h4>
                <button 
                  v-if="hasActiveFilters" 
                  @click="clearAllFilters" 
                  class="clear-filters-btn"
                >
                  ✕ Limpiar filtros
                </button>
              </div>
              
              <div class="filters-grid">
                <!-- Tipo de universidad -->
                <div class="filter-group">
                  <h5>Tipo</h5>
                  <div class="filter-options">
                    <button 
                      @click="toggleFilter('type', 'public')"
                      class="filter-option"
                      :class="{ active: filters.type.includes('public') }"
                    >
                      <span class="filter-icon">🏛️</span>
                      <span class="filter-text">Pública</span>
                      <span class="filter-count">
                        {{ publicCount }}
                      </span>
                    </button>
                    <button 
                      @click="toggleFilter('type', 'private')"
                      class="filter-option"
                      :class="{ active: filters.type.includes('private') }"
                    >
                      <span class="filter-icon">🏢</span>
                      <span class="filter-text">Privada</span>
                      <span class="filter-count">
                        {{ privateCount }}
                      </span>
                    </button>
                  </div>
                </div>

                <!-- Ciudad -->
                <div class="filter-group">
                  <h5>Ciudad</h5>
                  <div class="filter-options">
                    <button 
                      v-for="city in topCities" 
                      :key="city.name"
                      @click="toggleFilter('city', city.name)"
                      class="filter-option"
                      :class="{ active: filters.city.includes(city.name) }"
                    >
                      <span class="filter-icon">🏙️</span>
                      <span class="filter-text">{{ city.name }}</span>
                      <span class="filter-count">
                        {{ city.count }}
                      </span>
                    </button>
                    <button 
                      @click="showAllCities = !showAllCities"
                      class="filter-option show-more"
                    >
                      <span class="filter-icon">{{ showAllCities ? '👆' : '👇' }}</span>
                      <span class="filter-text">
                        {{ showAllCities ? 'Ver menos' : 'Ver más' }}
                      </span>
                    </button>
                  </div>
                  
                  <!-- Ciudades adicionales -->
                  <div v-if="showAllCities" class="additional-cities">
                    <div class="cities-grid">
                      <button 
                        v-for="city in additionalCities" 
                        :key="city.name"
                        @click="toggleFilter('city', city.name)"
                        class="city-option"
                        :class="{ active: filters.city.includes(city.name) }"
                      >
                        {{ city.name }} ({{ city.count }})
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Acreditación -->
                <div class="filter-group">
                  <h5>Acreditación</h5>
                  <div class="filter-options">
                    <button 
                      @click="toggleFilter('accreditation', 'alta')"
                      class="filter-option"
                      :class="{ active: filters.accreditation.includes('alta') }"
                    >
                      <span class="filter-icon">⭐</span>
                      <span class="filter-text">Alta calidad</span>
                    </button>
                    <button 
                      @click="toggleFilter('accreditation', 'media')"
                      class="filter-option"
                      :class="{ active: filters.accreditation.includes('media') }"
                    >
                      <span class="filter-icon">📊</span>
                      <span class="filter-text">Media</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="quick-stats">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">🏛️</div>
                  <div class="stat-content">
                    <h4>{{ universitiesStore.universities?.length || 0 }}</h4>
                    <p>Universidades totales</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🎓</div>
                  <div class="stat-content">
                    <h4>{{ totalPrograms }}</h4>
                    <p>Programas disponibles</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📍</div>
                  <div class="stat-content">
                    <h4>{{ citiesWithCount.length }}</h4>
                    <p>Ciudades diferentes</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-content">
                    <h4>{{ averageRating.toFixed(1) }}</h4>
                    <p>Rating promedio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Resultados -->
        <section class="results-section">
          <div class="results-header">
            <div class="results-title">
              <h2>Universidades Disponibles</h2>
              <div class="results-stats">
                <span class="count">({{ filteredUniversities.length }} resultados)</span>
                <span class="separator">•</span>
                <span class="sorting">
                  Ordenar por:
                  <select v-model="sortBy" @change="applySorting" class="sort-select">
                    <option value="name">Nombre (A-Z)</option>
                    <option value="rating">Rating (Mayor a menor)</option>
                    <option value="programs">Más programas</option>
                    <option value="city">Ciudad</option>
                  </select>
                </span>
              </div>
            </div>

            <!-- Vista toggle -->
            <div class="view-toggle">
              <button 
                @click="viewMode = 'grid'"
                class="view-btn"
                :class="{ active: viewMode === 'grid' }"
                title="Vista de cuadrícula"
              >
                ▦
              </button>
              <button 
                @click="viewMode = 'list'"
                class="view-btn"
                :class="{ active: viewMode === 'list' }"
                title="Vista de lista"
              >
                ☰
              </button>
            </div>
          </div>

          <!-- Filtros activos -->
          <div v-if="hasActiveFilters" class="active-filters">
            <div class="active-filters-content">
              <span class="filters-label">Filtros aplicados:</span>
              <div class="filter-tags">
                <span 
                  v-for="filter in activeFilters" 
                  :key="filter.key"
                  class="filter-tag"
                >
                  {{ filter.label }}
                  <button @click="removeFilter(filter.key)" class="tag-remove">✕</button>
                </span>
                <button @click="clearAllFilters" class="clear-all-btn">
                  Limpiar todos
                </button>
              </div>
            </div>
          </div>

          <!-- Estado de carga -->
          <div v-if="loading" class="loading-state">
            <div class="spinner">🌀</div>
            <p>Cargando universidades...</p>
          </div>

          <!-- Sin resultados -->
          <div v-else-if="filteredUniversities.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3>No se encontraron universidades</h3>
            <p>No hay universidades que coincidan con tu búsqueda o filtros.</p>
            <button @click="clearAllFilters" class="btn-primary">
              Ver todas las universidades
            </button>
          </div>

          <!-- Grid de universidades -->
          <div v-else class="universities-container">
            <!-- Vista de cuadrícula -->
            <div v-if="viewMode === 'grid'" class="universities-grid">
              <div 
                v-for="university in paginatedUniversities" 
                :key="getUniversityId(university)"
                class="university-card"
                :class="{
                  'favorited': isFavorite(university),
                  'in-comparison': isInComparison(university),
                  'has-reviews': hasReviews(university)
                }"
                @click="goToUniversityDetails(university)"
              >
                <!-- Indicadores de estado -->
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

                <!-- Reseñas recientes -->
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
                  </div>
                  
                  <button 
                    @click.stop="goToUniversityDetails(university)"
                    class="btn-details"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            </div>

            <!-- Vista de lista -->
            <div v-else class="universities-list">
              <div 
                v-for="university in paginatedUniversities" 
                :key="getUniversityId(university)"
                class="university-list-item"
                :class="{
                  'favorited': isFavorite(university),
                  'in-comparison': isInComparison(university)
                }"
              >
                <div class="list-item-content">
                  <!-- Columna izquierda: Información principal -->
                  <div class="list-item-main" @click="goToUniversityDetails(university)">
                    <div class="list-item-header">
                      <h3>{{ getUniversityName(university) }}</h3>
                      <div class="list-item-badges">
                        <span class="university-type" :class="getUniversityType(university)">
                          {{ getUniversityType(university) === 'public' ? '🏛️ Pública' : '🏢 Privada' }}
                        </span>
                        <span class="location">
                          📍 {{ university.city }}, {{ university.country }}
                        </span>
                        <span v-if="getUniversityRating(university)" class="rating">
                          ⭐ {{ getUniversityRating(university)?.toFixed(1) }}
                          <small v-if="getReviewsCount(university) > 0">
                            ({{ getReviewsCount(university) }} reseñas)
                          </small>
                        </span>
                      </div>
                    </div>
                    
                    <div class="list-item-programs">
                      <span class="programs-count">
                        🎓 {{ getProgramsCount(university) }} programas
                      </span>
                      <div class="program-tags">
                        <span 
                          v-for="program in getTopPrograms(university, 2)" 
                          :key="program.name"
                          class="program-tag-small"
                        >
                          {{ program.name }}
                        </span>
                        <span v-if="getProgramsCount(university) > 2" class="more-programs">
                          +{{ getProgramsCount(university) - 2 }} más
                        </span>
                      </div>
                    </div>
                    
                    <p v-if="university.description" class="list-item-description">
                      {{ truncateText(university.description, 150) }}
                    </p>
                  </div>

                  <!-- Columna derecha: Acciones -->
                  <div class="list-item-actions">
                    <div class="action-buttons">
                      <button 
                        @click.stop="toggleFavorite(university)"
                        class="btn-action btn-favorite"
                        :class="{ active: isFavorite(university) }"
                        title="Favorito"
                      >
                        {{ isFavorite(university) ? '★' : '☆' }}
                      </button>
                      
                      <button 
                        @click.stop="toggleComparison(university)"
                        class="btn-action btn-compare"
                        :class="{ active: isInComparison(university) }"
                        title="Comparar"
                      >
                        ⚖️
                      </button>
                      
                      <button 
                        @click.stop="goToUniversityDetails(university)"
                        class="btn-action btn-details"
                        title="Ver detalles"
                      >
                        🔍
                      </button>
                    </div>
                    
                    <div class="cost-info">
                      <span class="cost-label">Costo anual:</span>
                      <span class="cost-value">{{ getEstimatedCost(university) }}</span>
                    </div>
                  </div>
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
        </section>

        <!-- Sidebar de ayuda -->
        <aside class="sidebar">
          <!-- Comparación rápida -->
          <div v-if="comparisonStore.universityCount > 0" class="comparison-sidebar">
            <h3>⚖️ En comparación</h3>
            <div class="comparison-items-sidebar">
              <div 
                v-for="item in comparisonStore.universityItems" 
                :key="item.id"
                class="comparison-item-sidebar"
              >
                <span class="item-name">{{ item.name }}</span>
                <button 
                  @click="removeUniversityFromComparison(item)"
                  class="item-remove"
                >
                  ✕
                </button>
              </div>
            </div>
            <div class="comparison-actions">
              <button @click="goToComparison" class="btn-primary">
                Ver comparación
              </button>
              <button @click="clearComparison" class="btn-secondary">
                Limpiar
              </button>
            </div>
          </div>

          <!-- Filtros avanzados -->
          <div class="advanced-filters">
            <h3>🔍 Filtros avanzados</h3>
            
            <!-- Rango de costos -->
            <div class="filter-group-advanced">
              <label for="costRange">Rango de costo anual:</label>
              <div class="cost-range">
                <input 
                  type="range" 
                  id="costRange"
                  v-model="costRange"
                  min="0"
                  max="50000000"
                  step="1000000"
                  class="range-slider"
                  @change="applyCostFilter"
                >
                <div class="range-labels">
                  <span>$0</span>
                  <span>{{ formatPrice(maxCost) }}</span>
                </div>
                <div class="selected-cost">
                  Hasta: {{ formatPrice(costRange) }}
                </div>
              </div>
            </div>

            <!-- Número de programas -->
            <div class="filter-group-advanced">
              <label>Programas mínimos:</label>
              <div class="programs-filter">
                <button 
                  v-for="num in [5, 10, 20, 50]"
                  :key="num"
                  @click="toggleProgramsFilter(num)"
                  class="programs-option"
                  :class="{ active: filters.minPrograms === num }"
                >
                  {{
                    num === 50 ? '50+' :
                    num === 20 ? '20+' :
                    num === 10 ? '10+' :
                    '5+'
                  }}
                </button>
              </div>
            </div>

            <!-- Acreditación específica -->
            <div class="filter-group-advanced">
              <label>Acreditación:</label>
              <select 
                v-model="filters.accreditationType" 
                @change="applyFilters"
                class="filter-select-advanced"
              >
                <option value="">Cualquier acreditación</option>
                <option value="alta">Alta calidad</option>
                <option value="multicampus">Multicampus</option>
                <option value="internacional">Internacional</option>
              </select>
            </div>

            <!-- Reset filters -->
            <button 
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="btn-reset-filters"
            >
              🗑️ Limpiar todos los filtros
            </button>
          </div>

          <!-- Universidades top -->
          <div class="top-universities">
            <h3>🏆 Top Universidades</h3>
            <div class="top-list">
              <div 
                v-for="(uni, index) in topRatedUniversities" 
                :key="getUniversityId(uni)"
                class="top-item"
                @click="goToUniversityDetails(uni)"
              >
                <span class="rank">{{ index + 1 }}</span>
                <span class="name">{{ getUniversityName(uni) }}</span>
                <span class="rating">⭐ {{ getUniversityRating(uni) || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </aside>
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
            <small>v1.3.0 • Con sistema de comparación avanzado</small>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUniversitiesStore } from '@/stores/universities';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';
import { useReviewsStore } from '@/stores/reviews';

const router = useRouter();
const universitiesStore = useUniversitiesStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();
const reviewsStore = useReviewsStore();

// ============ REFS Y ESTADOS ============
const searchQuery = ref('');
const filters = ref({
  type: [] as string[],
  city: [] as string[],
  accreditation: [] as string[],
  accreditationType: '',
  minPrograms: 0
});
const sortBy = ref('name');
const viewMode = ref<'grid' | 'list'>('grid');
const currentPage = ref(1);
const itemsPerPage = ref(12);
const loading = ref(false);
const showAllCities = ref(false);
const showComparisonDropdown = ref(false);
const showUserMenu = ref(false);
const costRange = ref(50000000);
const maxCost = ref(50000000);

// ============ COMPUTED PROPERTIES ============

const citiesWithCount = computed(() => {
  const cityCount: { [key: string]: number } = {};
  
  if (!universitiesStore.universities) return [];
  
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
  return citiesWithCount.value.slice(0, 5);
});

const additionalCities = computed(() => {
  return citiesWithCount.value.slice(5);
});

const totalPrograms = computed(() => {
  return universitiesStore.universities?.reduce((total, uni) => 
    total + (uni.programs?.length || 0), 0
  ) || 0;
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

const averageRating = computed(() => {
  const universities = universitiesStore.universities || [];
  if (universities.length === 0) return 0;
  
  const total = universities.reduce((sum, uni) => {
    const rating = getUniversityRating(uni);
    return sum + (rating || 0);
  }, 0);
  
  return total / universities.length;
});

const hasActiveFilters = computed(() => {
  return filters.value.type.length > 0 || 
         filters.value.city.length > 0 || 
         filters.value.accreditation.length > 0 ||
         filters.value.accreditationType !== '' ||
         filters.value.minPrograms > 0 ||
         searchQuery.value !== '' ||
         costRange.value < maxCost.value;
});

const activeFilters = computed(() => {
  const active = [];
  
  if (filters.value.type.length > 0) {
    active.push({
      key: 'type',
      label: `Tipo: ${filters.value.type.map(t => t === 'public' ? 'Pública' : 'Privada').join(', ')}`
    });
  }
  
  if (filters.value.city.length > 0) {
    active.push({
      key: 'city',
      label: `Ciudad: ${filters.value.city.join(', ')}`
    });
  }
  
  if (filters.value.accreditation.length > 0) {
    active.push({
      key: 'accreditation',
      label: `Acreditación: ${filters.value.accreditation.map(a => 
        a === 'alta' ? 'Alta calidad' : 'Media'
      ).join(', ')}`
    });
  }
  
  if (filters.value.accreditationType) {
    active.push({
      key: 'accreditationType',
      label: `Tipo: ${filters.value.accreditationType}`
    });
  }
  
  if (filters.value.minPrograms > 0) {
    active.push({
      key: 'minPrograms',
      label: `Mínimo ${filters.value.minPrograms} programas`
    });
  }
  
  if (searchQuery.value) {
    active.push({
      key: 'search',
      label: `Búsqueda: "${searchQuery.value}"`
    });
  }
  
  if (costRange.value < maxCost.value) {
    active.push({
      key: 'cost',
      label: `Costo hasta: ${formatPrice(costRange.value)}`
    });
  }
  
  return active;
});

const filteredUniversities = computed(() => {
  if (!universitiesStore.universities) return [];
  
  let filtered = universitiesStore.universities;

  // Filtrar por tipo
  if (filters.value.type.length > 0) {
    filtered = filtered.filter(u => 
      filters.value.type.includes(getUniversityType(u))
    );
  }

  // Filtrar por ciudad
  if (filters.value.city.length > 0) {
    filtered = filtered.filter(u => 
      u.city && filters.value.city.includes(u.city)
    );
  }

  // Filtrar por acreditación
  if (filters.value.accreditation.length > 0) {
    filtered = filtered.filter(u => {
      const accLevel = getAccreditationLevel(u);
      return filters.value.accreditation.includes(accLevel);
    });
  }

  // Filtrar por tipo de acreditación específica
  if (filters.value.accreditationType) {
    filtered = filtered.filter(u => {
      return u.accreditation?.toLowerCase().includes(filters.value.accreditationType);
    });
  }

  // Filtrar por número mínimo de programas
  if (filters.value.minPrograms > 0) {
    filtered = filtered.filter(u => 
      getProgramsCount(u) >= filters.value.minPrograms
    );
  }

  // Filtrar por costo máximo
  if (costRange.value < maxCost.value) {
    filtered = filtered.filter(u => {
      const cost = u.cost || u.tuition;
      if (!cost || typeof cost !== 'number') return true;
      return cost <= costRange.value;
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
      
    case 'city':
      return universities.sort((a, b) => {
        const cityA = a.city || '';
        const cityB = b.city || '';
        return cityA.localeCompare(cityB);
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

const topRatedUniversities = computed(() => {
  const universities = [...(universitiesStore.universities || [])]
    .filter(uni => getUniversityRating(uni))
    .sort((a, b) => {
      const ratingA = getUniversityRating(a) || 0;
      const ratingB = getUniversityRating(b) || 0;
      return ratingB - ratingA;
    })
    .slice(0, 5);
  
  return universities;
});

const unreadNotifications = computed(() => {
  return 0; // Por implementar
});

// ============ FUNCIONES HELPER ============

const getUniversityId = (university: any): string => {
  return university.id || university._id || `uni-${university.name?.toLowerCase().replace(/\s+/g, '-')}`;
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
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cost);
  }
  
  return cost;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
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

const truncateText = (text: string, length: number = 100): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const getAccreditationLevel = (university: any): string => {
  const accreditation = (university.accreditation || '').toLowerCase();
  if (accreditation.includes('alta') || accreditation.includes('alta calidad')) {
    return 'alta';
  }
  return 'media';
};

// ============ FUNCIONES DE RESEÑAS ============

const hasReviews = (university: any): boolean => {
  return getUniversityReviews(university).length > 0;
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

// ============ FUNCIONES DE FAVORITOS Y COMPARACIÓN ============

const isFavorite = (university: any): boolean => {
  const universityId = getUniversityId(university);
  return favoritesStore.isUniversityFavorite(universityId);
};

const isInComparison = (university: any): boolean => {
  const universityId = getUniversityId(university);
  return comparisonStore.isUniversityInComparison(universityId);
};

const toggleFavorite = (university: any, event?: Event) => {
  if (event) event.stopPropagation();
  
  const universityId = getUniversityId(university);
  const universityName = getUniversityName(university);
  
  if (!universityId) return;
  
  try {
    const result = favoritesStore.toggleUniversityFavorite(university);
    const message = result 
      ? `⭐ "${universityName}" agregada a favoritos`
      : `❌ "${universityName}" removida de favoritos`;
    
    showNotification(message, result ? 'success' : 'info');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar favoritos';
    showNotification(errorMessage, 'error');
  }
};

const toggleComparison = (university: any, event?: Event) => {
  if (event) event.stopPropagation();
  
  const universityId = getUniversityId(university);
  const universityName = getUniversityName(university);
  
  if (!universityId) return;
  
  try {
    if (isInComparison(university)) {
      // Si ya está en comparación, eliminarla
      comparisonStore.removeUniversityFromComparison(universityId);
      showNotification(`⚖️ "${universityName}" removida de comparación`, 'info');
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
      showNotification(`⚖️ "${universityName}" agregada a comparación`, 'success');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar comparación';
    showNotification(errorMessage, 'error');
  }
};

const removeUniversityFromComparison = (university: any) => {
  const universityId = getUniversityId(university);
  try {
    comparisonStore.removeUniversityFromComparison(universityId);
    showNotification(`${getUniversityName(university)} removida de comparación`, 'info');
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

// ============ FUNCIONES DE FILTRADO ============

const toggleFilter = (filterType: string, value: string) => {
  if (filters.value[filterType as keyof typeof filters.value]) {
    const filterArray = filters.value[filterType as keyof typeof filters.value];
    if (Array.isArray(filterArray)) {
      const index = filterArray.indexOf(value);
      if (index > -1) {
        filterArray.splice(index, 1);
      } else {
        filterArray.push(value);
      }
    }
  }
  currentPage.value = 1;
};

const toggleProgramsFilter = (num: number) => {
  if (filters.value.minPrograms === num) {
    filters.value.minPrograms = 0;
  } else {
    filters.value.minPrograms = num;
  }
  currentPage.value = 1;
};

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'type':
      filters.value.type = [];
      break;
    case 'city':
      filters.value.city = [];
      break;
    case 'accreditation':
      filters.value.accreditation = [];
      break;
    case 'accreditationType':
      filters.value.accreditationType = '';
      break;
    case 'minPrograms':
      filters.value.minPrograms = 0;
      break;
    case 'search':
      searchQuery.value = '';
      break;
    case 'cost':
      costRange.value = maxCost.value;
      break;
  }
  currentPage.value = 1;
};

const clearAllFilters = () => {
  filters.value = {
    type: [],
    city: [],
    accreditation: [],
    accreditationType: '',
    minPrograms: 0
  };
  searchQuery.value = '';
  costRange.value = maxCost.value;
  currentPage.value = 1;
};

const applyCostFilter = () => {
  currentPage.value = 1;
};

const applySorting = () => {
  currentPage.value = 1;
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchInput = () => {
  currentPage.value = 1;
};

// ============ FUNCIONES DE PAGINACIÓN ============

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

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// ============ FUNCIONES DE NAVEGACIÓN ============

const goToUniversityDetails = (university: any) => {
  const universityId = getUniversityId(university);
  router.push(`/university/${universityId}`);
};

const viewUniversityReviews = (university: any) => {
  const universityId = getUniversityId(university);
  router.push(`/university/${universityId}/reviews`);
};

const goToComparison = () => {
  if (comparisonStore.universityCount === 0) {
    alert('Agrega al menos una universidad para comparar');
    return;
  }
  router.push('/comparison');
  showComparisonDropdown.value = false;
};

const goToFavorites = () => {
  router.push('/favorites');
};

const goToReviews = () => {
  router.push('/reviews');
};

const goToProfile = () => {
  router.push('/profile');
};

const goToNotifications = () => {
  router.push('/notifications');
};

const logout = () => {
  // Lógica de logout
  showUserMenu.value = false;
};

// ============ FUNCIONES DE DROPDOWN ============

const toggleComparisonDropdown = () => {
  showComparisonDropdown.value = !showComparisonDropdown.value;
  showUserMenu.value = false;
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  showComparisonDropdown.value = false;
};

// ============ FUNCIONES DE NOTIFICACIÓN ============

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const event = new CustomEvent('show-notification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

// ============ LIFECYCLE ============

onMounted(() => {
  console.log('🏛️ UniversitiesView mounted');
  
  if (!universitiesStore.universities || universitiesStore.universities.length === 0) {
    loading.value = true;
    universitiesStore.fetchUniversities().finally(() => {
      loading.value = false;
    });
  }
  
  // Calcular costo máximo
  if (universitiesStore.universities?.length > 0) {
    const max = Math.max(...universitiesStore.universities
      .map(u => u.cost || u.tuition || 0)
      .filter(cost => typeof cost === 'number')
    );
    maxCost.value = Math.ceil(max / 1000000) * 1000000;
    costRange.value = maxCost.value;
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

// Escuchar notificaciones
onMounted(() => {
  window.addEventListener('show-notification', ((event: CustomEvent) => {
    const { message, type } = event.detail;
    alert(`${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`);
  }) as EventListener);
});
</script>

<style scoped>
/* Estilos generales */
.universities-view {
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header - Copiado de HomeView */
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

/* Breadcrumb */
.breadcrumb {
  background: white;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
}

.breadcrumb .container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  color: #667eea;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #999;
}

.breadcrumb-current {
  color: #333;
  font-weight: 500;
}

/* Hero Section */
.hero-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-title {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* Search container */
.search-container {
  max-width: 800px;
  margin: 0 auto 2rem;
}

.search-wrapper {
  display: flex;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-btn:hover {
  opacity: 0.9;
}

/* Quick filters */
.quick-filters {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h4 {
  margin: 0;
  color: #333;
}

.clear-filters-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group h5 {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-option {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.filter-option:hover {
  border-color: #667eea;
}

.filter-option.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.filter-icon {
  font-size: 1rem;
}

.filter-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
}

.show-more {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.additional-cities {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.city-option {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.city-option:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.city-option.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Quick stats */
.quick-stats {
  margin-top: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-icon {
  font-size: 2rem;
  color: #667eea;
}

.stat-content h4 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.stat-content p {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

/* Results section */
.results-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-title h2 {
  margin: 0;
  color: #333;
}

.results-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.count {
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: #666;
  font-size: 0.9rem;
}

.separator {
  color: #999;
}

.sorting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.sort-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.25rem;
}

.view-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.2rem;
  color: #666;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: #e9ecef;
}

.view-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Active filters */
.active-filters {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #667eea;
}

.active-filters-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters-label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
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
  font-size: 0.85rem;
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

.clear-all-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.clear-all-btn:hover {
  text-decoration: underline;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* No results */
.no-results {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.no-results p {
  color: #666;
  margin-bottom: 1.5rem;
}

/* Universities grid (grid view) */
.universities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

/* Universities list (list view) */
.universities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}

.university-list-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.university-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.university-list-item.favorited {
  border-left: 4px solid #FFD700;
}

.university-list-item.in-comparison {
  border-right: 4px solid #4CAF50;
}

.list-item-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.list-item-main {
  flex: 1;
  cursor: pointer;
}

.list-item-header {
  margin-bottom: 1rem;
}

.list-item-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.list-item-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.university-type {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.university-type.public {
  background: #e3f2fd;
  color: #1976d2;
}

.university-type.private {
  background: #f3e5f5;
  color: #7b1fa2;
}

.location {
  color: #666;
  font-size: 0.9rem;
}

.rating {
  color: #f39c12;
  font-weight: 500;
  font-size: 0.9rem;
}

.rating small {
  color: #999;
  font-weight: normal;
}

.list-item-programs {
  margin-bottom: 1rem;
}

.programs-count {
  color: #666;
  font-size: 0.9rem;
  margin-right: 1rem;
}

.program-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.program-tag-small {
  background: #f8f9fa;
  color: #333;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid #e9ecef;
}

.more-programs {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}

.list-item-description {
  color: #555;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.list-item-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 150px;
}

.list-item-actions .action-buttons {
  display: flex;
  gap: 0.5rem;
}

.cost-info {
  text-align: right;
}

.cost-label {
  display: block;
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.cost-value {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

/* Pagination */
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

/* Sidebar */
.sidebar {
  position: sticky;
  top: 120px;
  align-self: start;
}

.comparison-sidebar,
.advanced-filters,
.top-universities {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.comparison-sidebar h3,
.advanced-filters h3,
.top-universities h3 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comparison-items-sidebar {
  margin-bottom: 1rem;
}

.comparison-item-sidebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.item-name {
  font-size: 0.85rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.item-remove {
  background: #ff6b6b;
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-group-advanced {
  margin-bottom: 1.5rem;
}

.filter-group-advanced label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.cost-range {
  padding: 0.5rem 0;
}

.range-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e9ecef;
  outline: none;
  -webkit-appearance: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.8rem;
}

.selected-cost {
  margin-top: 0.5rem;
  color: #667eea;
  font-weight: 500;
  font-size: 0.9rem;
}

.programs-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.programs-option {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.programs-option:hover {
  border-color: #667eea;
}

.programs-option.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.filter-select-advanced {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.btn-reset-filters {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ff6b6b;
  background: white;
  color: #ff6b6b;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-reset-filters:hover {
  background: #ff6b6b;
  color: white;
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

/* Botones generales */
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

/* Layout principal */
@media (min-width: 1024px) {
  .container {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
  }
  
  .hero-section,
  .results-section {
    grid-column: 1;
  }
  
  .sidebar {
    grid-column: 2;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .list-item-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .list-item-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .universities-grid {
    grid-template-columns: 1fr;
  }
  
  .container {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
    margin-top: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .results-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .results-stats {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>