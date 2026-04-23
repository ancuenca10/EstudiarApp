<template>
  <div class="programs-view">
    <!-- Header (mismo que UniversitiesView) -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo-section">
            <h1 class="logo">🎓 EstudiarApp</h1>
            <p class="tagline">Todos los Programas Académicos</p>
          </div>
          
          <!-- Acciones del header -->
          <div class="header-actions">
            <!-- Comparador -->
            <div class="comparison-dropdown">
              <button @click="toggleComparisonDropdown" class="action-btn comparison-btn">
                <span class="action-icon">⚖️</span>
                <span class="action-text">Comparar</span>
                <span v-if="comparisonStore.programCount > 0" class="badge">
                  {{ comparisonStore.programCount }}
                </span>
                <span class="dropdown-arrow">▼</span>
              </button>
              
              <!-- Dropdown de comparación -->
              <div v-if="showComparisonDropdown" class="dropdown-menu comparison-menu">
                <div class="dropdown-header">
                  <h4>Programas en Comparación</h4>
                  <button @click="clearComparison" class="clear-all-btn">Limpiar</button>
                </div>
                <div v-if="comparisonStore.programCount === 0" class="empty-state">
                  <p>No hay programas para comparar</p>
                  <button @click="showComparisonDropdown = false" class="btn-primary">Cerrar</button>
                </div>
                <div v-else>
                  <div class="comparison-items">
                    <div 
                      v-for="item in comparisonStore.programs" 
                      :key="`${item.universityId}_${item.programId}`"
                      class="comparison-item"
                    >
                      <div class="comparison-item-info">
                        <strong>{{ item.programName }}</strong>
                        <small>{{ item.universityName }}</small>
                      </div>
                      <button 
                        @click.stop="removeProgramFromComparison(item)" 
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
              <span v-if="favoritesStore.programFavoritesCount > 0" class="badge">
                {{ favoritesStore.programFavoritesCount }}
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
        <span class="breadcrumb-current">🎓 Todos los Programas</span>
      </div>
    </nav>

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container">
        <!-- Mensaje temporal -->
        <div class="temporary-message">
          <div class="message-icon">🚧</div>
          <h2>Vista en construcción</h2>
          <p>
            La vista completa de todos los programas está en desarrollo. 
            Por ahora, puedes explorar programas desde:
          </p>
          <div class="suggestions">
            <router-link to="/universities" class="suggestion-link">
              <span>🏛️</span> Ver todas las universidades
            </router-link>
            <router-link to="/" class="suggestion-link">
              <span>🔍</span> Buscar en el inicio
            </router-link>
            <router-link to="/favorites" class="suggestion-link">
              <span>⭐</span> Ver mis favoritos
            </router-link>
          </div>
        </div>

        <!-- Próximas características -->
        <div class="coming-soon">
          <h3>Próximamente en esta vista:</h3>
          <ul class="features-list">
            <li>🎯 <strong>Buscador avanzado de programas</strong> por nombre, nivel, modalidad</li>
            <li>📊 <strong>Comparación en tabla</strong> de múltiples programas</li>
            <li>⭐ <strong>Filtros inteligentes</strong> por costo, duración, rating</li>
            <li>📈 <strong>Estadísticas comparativas</strong> entre programas similares</li>
            <li>🎓 <strong>Recomendaciones personalizadas</strong> según tu perfil</li>
          </ul>
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
            <router-link to="/favorites" class="footer-link">
              ⭐ Favoritos
            </router-link>
            <router-link to="/comparison" class="footer-link">
              ⚖️ Comparar
            </router-link>
            <router-link to="/reviews" class="footer-link">
              📝 Reseñas
            </router-link>
          </div>
          <div class="footer-section">
            <p>&copy; 2025 EstudiarApp</p>
            <small>v1.3.0 • Desarrollo en progreso</small>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';

const router = useRouter();
const comparisonStore = useComparisonStore();
const favoritesStore = useFavoritesStore();

// Estados
const showComparisonDropdown = ref(false);
const showUserMenu = ref(false);

// Métodos de navegación
const goToComparison = () => {
  if (comparisonStore.programCount === 0) {
    alert('Agrega al menos un programa para comparar');
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
  // Por implementar
  alert('Sistema de notificaciones en desarrollo');
};

// Métodos de comparación
const removeProgramFromComparison = (item: any) => {
  comparisonStore.removeProgramFromComparison(item.programId, item.universityId);
};

const clearComparison = () => {
  if (comparisonStore.programCount === 0) {
    alert('No hay programas en comparación');
    return;
  }
  
  if (confirm('¿Estás seguro de que quieres limpiar todos los programas de la comparación?')) {
    comparisonStore.clearComparison();
  }
};

// Métodos de dropdown
const toggleComparisonDropdown = () => {
  showComparisonDropdown.value = !showComparisonDropdown.value;
  showUserMenu.value = false;
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  showComparisonDropdown.value = false;
};

const logout = () => {
  showUserMenu.value = false;
  // Lógica de logout por implementar
};

// Cerrar dropdowns al hacer click fuera
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.comparison-dropdown') && !target.closest('.user-menu-dropdown')) {
    showComparisonDropdown.value = false;
    showUserMenu.value = false;
  }
};

// Agregar listener para cerrar dropdowns
document.addEventListener('click', handleClickOutside);
</script>

<style scoped>
.programs-view {
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header (copiado de UniversitiesView) */
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

.badge {
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 5px;
  font-weight: bold;
}

.dropdown-arrow {
  font-size: 0.7rem;
  margin-left: 0.25rem;
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

.comparison-item-info {
  display: flex;
  flex-direction: column;
}

.comparison-item-info strong {
  font-size: 0.9rem;
  color: #333;
}

.comparison-item-info small {
  font-size: 0.8rem;
  color: #666;
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

.empty-state {
  text-align: center;
  padding: 1.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1rem;
}

/* User menu */
.user-menu {
  min-width: 250px;
}

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

/* Main content */
.main-content {
  padding: 3rem 0;
}

.temporary-message {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.message-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.temporary-message h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.temporary-message p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.suggestion-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px solid #667eea;
  border-radius: 8px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 200px;
}

.suggestion-link:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.suggestion-link span {
  font-size: 1.2rem;
}

.coming-soon {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.coming-soon h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  text-align: center;
}

.features-list {
  list-style: none;
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
}

.features-list li {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.features-list li strong {
  color: #333;
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

.footer-link {
  display: block;
  color: #adb5bd;
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.footer-link:hover {
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
  
  .dropdown-menu {
    position: fixed;
    top: 80px;
    left: 20px;
    right: 20px;
    width: calc(100% - 40px);
  }
  
  .temporary-message {
    padding: 2rem 1rem;
  }
  
  .suggestions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .suggestion-link {
    justify-content: center;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .action-text {
    display: none;
  }
  
  .action-btn {
    padding: 0.75rem;
  }
  
  .logo {
    font-size: 1.5rem;
  }
}
</style>