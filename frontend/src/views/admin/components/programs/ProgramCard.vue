<!-- src/components/programs/ProgramCard.vue -->
<template>
  <div class="program-card" :class="{ 'has-university': showUniversityInfo }">
    <!-- Header del programa -->
    <div class="program-header">
      <div class="program-title-section">
        <h3 class="program-name">{{ program.name }}</h3>
        <div class="program-level">
          <span class="level-badge" :class="program.level.toLowerCase()">
            {{ program.level }}
          </span>
          <span v-if="program.duration" class="duration">
            📅 {{ program.duration }}
          </span>
        </div>
      </div>
      
      <!-- Indicadores de estado -->
      <div class="program-indicators">
        <div v-if="isFavorite" class="indicator favorite" title="Favorito">
          ⭐
        </div>
        <div v-if="isInComparison" class="indicator comparison" title="En comparación">
          ⚖️
        </div>
      </div>
    </div>

    <!-- Info de universidad si se muestra -->
    <div v-if="showUniversityInfo && university" class="university-info">
      <div class="university-header">
        <span class="university-name">{{ university.name }}</span>
        <span class="university-location">
          📍 {{ university.city }}, {{ university.country }}
        </span>
      </div>
      <div class="university-type" :class="university.type.toLowerCase()">
        {{ university.type }}
      </div>
    </div>

    <!-- Detalles del programa -->
    <div class="program-details">
      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-label">💵 Costo:</span>
          <span class="detail-value">{{ formatPrice(program.price) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">🎓 Modalidad:</span>
          <span class="detail-value">{{ program.modality }}</span>
        </div>
      </div>
      
      <div class="detail-row">
        <div class="detail-item">
          <span class="detail-label">⏰ Horario:</span>
          <span class="detail-value">{{ program.schedule }}</span>
        </div>
        <div v-if="program.weekly_hours" class="detail-item">
          <span class="detail-label">🕒 Horas/semana:</span>
          <span class="detail-value">{{ program.weekly_hours }}h</span>
        </div>
      </div>

      <!-- Rating si existe -->
      <div v-if="program.quality_rating" class="program-rating">
        <div class="rating-stars">
          <span v-for="star in 5" :key="star" class="star">
            {{ star <= Math.round(program.quality_rating) ? '★' : '☆' }}
          </span>
        </div>
        <span class="rating-value">{{ program.quality_rating.toFixed(1) }}/5</span>
      </div>

      <!-- Descripción breve -->
      <p v-if="program.description" class="program-description">
        {{ truncateText(program.description, 120) }}
      </p>
    </div>

    <!-- Requisitos rápidos -->
    <div v-if="program.requirements && program.requirements.length > 0" class="program-requirements">
      <h4>📋 Requisitos:</h4>
      <div class="requirements-list">
        <span v-for="(req, index) in program.requirements.slice(0, 2)" :key="index" class="requirement-tag">
          {{ req }}
        </span>
        <span v-if="program.requirements.length > 2" class="more-requirements">
          +{{ program.requirements.length - 2 }} más
        </span>
      </div>
    </div>

    <!-- Footer con botones de acción -->
    <div class="program-footer">
      <div class="action-buttons">
        <!-- Botón Favorito -->
        <button 
          @click.stop="toggleFavorite"
          class="btn-action btn-favorite"
          :class="{ active: isFavorite }"
          :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        >
          <span>{{ isFavorite ? '★' : '☆' }}</span>
          <span class="btn-text">Favorito</span>
        </button>
        
        <!-- Botón Comparar -->
        <button 
          @click.stop="toggleComparison"
          class="btn-action btn-compare"
          :class="{ active: isInComparison }"
          :title="isInComparison ? 'Quitar de comparación' : 'Comparar programa'"
        >
          <span>⚖️</span>
          <span class="btn-text">Comparar</span>
        </button>
        
        <!-- Botón Detalles -->
        <button 
          @click.stop="viewProgramDetails"
          class="btn-action btn-details"
        >
          <span>🔍</span>
          <span class="btn-text">Ver detalles</span>
        </button>
      </div>
      
      <!-- Contador de comparación -->
      <div v-if="comparisonStore.programCount > 0" class="comparison-counter">
        <small>{{ comparisonStore.programCount }}/4 en comparación</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';
import type { Program, University } from '@/types';

interface Props {
  program: Program;
  university?: University;
  showUniversityInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showUniversityInfo: true
});

const router = useRouter();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

// Computed properties
const isFavorite = computed(() => {
  if (!props.university) return false;
  return favoritesStore.isProgramFavorite(props.program._id, props.university._id);
});

const isInComparison = computed(() => {
  if (!props.university) return false;
  return comparisonStore.isProgramInComparison(props.program._id, props.university._id);
});

// Métodos
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price);
};

const truncateText = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const toggleFavorite = () => {
  if (!props.university) return;
  
  const result = favoritesStore.toggleProgramFavorite(props.program, props.university);
  const message = result 
    ? `⭐ "${props.program.name}" agregado a favoritos`
    : `❌ "${props.program.name}" removido de favoritos`;
  
  showNotification(message, result ? 'success' : 'info');
};

const toggleComparison = () => {
  if (!props.university) return;
  
  try {
    if (isInComparison.value) {
      comparisonStore.removeProgramFromComparison(props.program._id, props.university._id);
      showNotification(`⚖️ "${props.program.name}" removido de comparación`, 'info');
    } else {
      if (comparisonStore.isFull) {
        alert('Máximo 4 programas en comparación. Elimina uno para agregar otro.');
        return;
      }
      
      comparisonStore.addProgramToComparison(
        props.program._id,
        props.university._id,
        props.program.name,
        props.university.name,
        props.program // Pasamos todos los datos del programa
      );
      showNotification(`⚖️ "${props.program.name}" agregado a comparación`, 'success');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar comparación';
    showNotification(errorMessage, 'error');
  }
};

const viewProgramDetails = () => {
  if (!props.university) return;
  
  router.push(`/university/${props.university._id}/program/${props.program._id}`);
};

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Usar la misma función de notificación del HomeView
  const event = new CustomEvent('show-notification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};
</script>

<style scoped>
.program-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.program-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.program-card.has-university {
  border-left: 4px solid #9b59b6;
}

/* Header */
.program-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.program-title-section {
  flex: 1;
}

.program-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
  line-height: 1.3;
}

.program-level {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.level-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.level-badge.pregrado {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.level-badge.posgrado {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.level-badge.técnico,
.level-badge.tecnológico {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.duration {
  color: #666;
  font-size: 0.9rem;
}

/* Indicadores */
.program-indicators {
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

/* Universidad */
.university-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-left: 3px solid #667eea;
}

.university-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.university-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.university-location {
  color: #666;
  font-size: 0.85rem;
}

.university-type {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.university-type.pública {
  background: #e3f2fd;
  color: #1976d2;
}

.university-type.privada {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* Detalles */
.program-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.detail-value {
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Rating */
.program-rating {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #fff8e1;
  border-radius: 8px;
}

.rating-stars {
  color: #FFD700;
  font-size: 1.2rem;
}

.rating-value {
  font-weight: 600;
  color: #333;
}

/* Descripción */
.program-description {
  color: #555;
  margin: 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Requisitos */
.program-requirements {
  margin: 1rem 0;
}

.program-requirements h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.95rem;
}

.requirements-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.requirement-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
}

.more-requirements {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
  align-self: center;
}

/* Footer */
.program-footer {
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

.btn-details {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.btn-details:hover {
  background: #e1bee7;
}

.comparison-counter {
  color: #666;
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 768px) {
  .program-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .university-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>