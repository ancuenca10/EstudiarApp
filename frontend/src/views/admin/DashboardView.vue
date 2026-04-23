<template>
  <div class="dashboard-view">
    <div class="container">
      <h1>📊 Dashboard de Administración</h1>
      
      <!-- Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏛️</div>
          <div class="stat-content">
            <h3>{{ universitiesCount }}</h3>
            <p>Universidades</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <h3>{{ pendingReviewsCount }}</h3>
            <p>Reseñas pendientes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>0</h3>
            <p>Usuarios activos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h3>100%</h3>
            <p>Sistema operativo</p>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="quick-actions">
        <h2>Acciones rápidas</h2>
        <div class="actions-grid">
          <button @click="$router.push('/admin/universities')" class="action-btn">
            <span class="action-icon">🏛️</span>
            <span class="action-text">Gestionar Universidades</span>
          </button>
          
          <button @click="$router.push('/admin/reviews')" class="action-btn">
            <span class="action-icon">⭐</span>
            <span class="action-text">Moderar Reseñas</span>
          </button>
          
          <button @click="$router.push('/admin/users')" class="action-btn">
            <span class="action-icon">👥</span>
            <span class="action-text">Gestionar Usuarios</span>
          </button>
          
          <button @click="$router.push('/')" class="action-btn">
            <span class="action-icon">🏠</span>
            <span class="action-text">Ir al Inicio</span>
          </button>
        </div>
      </div>

      <!-- Últimas actividades -->
      <div class="recent-activities">
        <h2>Actividad reciente</h2>
        <div class="activities-list">
          <div class="activity-item">
            <div class="activity-icon">➕</div>
            <div class="activity-content">
              <p><strong>Nueva universidad añadida</strong></p>
              <p class="activity-time">Hace 2 horas</p>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">⭐</div>
            <div class="activity-content">
              <p><strong>Nueva reseña publicada</strong></p>
              <p class="activity-time">Hace 4 horas</p>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
              <p><strong>Nuevo usuario registrado</strong></p>
              <p class="activity-time">Hace 1 día</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUniversitiesStore } from '@/stores/universities';
import { useReviewsStore } from '@/stores/reviews';

// Usar los stores correctos
const universitiesStore = useUniversitiesStore();
const reviewsStore = useReviewsStore();

// Computed properties
const universitiesCount = computed(() => {
  return universitiesStore.universities.length;
});

const pendingReviewsCount = computed(() => {
  // Asumiendo que tienes una forma de obtener reseñas pendientes
  const allReviews = reviewsStore.reviews || [];
  return allReviews.filter((review: any) => review.status === 'pending').length;
});
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

/* Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #1f2937;
}

.stat-content p {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
}

/* Acciones rápidas */
.quick-actions {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.quick-actions h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-btn {
  padding: 1.5rem;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  text-align: left;
}

.action-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.action-icon {
  font-size: 1.5rem;
}

.action-text {
  font-weight: 500;
  font-size: 1rem;
}

/* Actividades recientes */
.recent-activities {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.recent-activities h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f9fafb;
  transition: background 0.3s;
}

.activity-item:hover {
  background: #f3f4f6;
}

.activity-icon {
  font-size: 1.5rem;
  background: #e0e7ff;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-content p {
  margin: 0;
}

.activity-content .activity-time {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  h1 {
    font-size: 2rem;
  }
}
</style>