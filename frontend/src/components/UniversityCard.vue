<template>
  <div class="university-card">
    <!-- Header de la tarjeta -->
    <div class="card-header">
      <div class="header-content">
        <h3 class="university-name">{{ university.name }}</h3>
        <div class="university-badges">
          <span class="type-badge" :class="university.type">
            {{ university.type === 'public' ? '🏛️ Pública' : '🏢 Privada' }}
          </span>
          <span class="cost-badge" :class="university.cost">
            {{ getCostText(university.cost) }}
          </span>
        </div>
      </div>
      <button 
        @click="toggleFavorite"
        class="favorite-btn"
        :class="{ active: isFavorite }"
        aria-label="Agregar a favoritos"
      >
        {{ isFavorite ? '★' : '☆' }}
      </button>
    </div>

    <!-- Contenido de la tarjeta -->
    <div class="card-content">
      <div class="location-info">
        <span class="location-icon">📍</span>
        <div class="location-text">
          <strong>{{ university.city }}</strong>
          <span>{{ university.country }}</span>
        </div>
      </div>

      <p class="description" v-if="university.description">
        {{ truncateDescription(university.description) }}
      </p>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-icon">📚</span>
          <div class="stat-info">
            <span class="stat-value">{{ university.programs?.length || 0 }}</span>
            <span class="stat-label">Programas</span>
          </div>
        </div>
        
        <div class="stat-item" v-if="university.accreditation">
          <span class="stat-icon">🏆</span>
          <div class="stat-info">
            <span class="stat-value">Acreditada</span>
            <span class="stat-label">Calidad</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones de la tarjeta -->
    <div class="card-actions">
      <button @click="viewDetails" class="btn btn-primary">
        <span class="btn-icon">👁️</span>
        <span class="btn-text">Ver Detalles</span>
      </button>
      
      <button 
        @click="toggleComparison" 
        class="btn btn-secondary"
        :class="{ active: isInComparison }"
      >
        <span class="btn-icon">{{ isInComparison ? '✓' : '⚖️' }}</span>
        <span class="btn-text">
          {{ isInComparison ? 'En comparación' : 'Comparar' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';

// Props
interface Props {
  university: {
    id: string;
    name: string;
    country: string;
    city: string;
    type: 'public' | 'private';
    cost: 'low' | 'medium' | 'high';
    description?: string;
    accreditation?: string;
    programs?: any[];
    contact?: {
      website?: string;
    };
  };
  showReviews?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showReviews: false
});

// Stores y router
const router = useRouter();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

// Computed properties
const isFavorite = computed(() => {
  return favoritesStore.favorites?.some(fav => fav.id === props.university.id) || false;
});

const isInComparison = computed(() => {
  return comparisonStore.comparisonItems?.some(item => item.id === props.university.id) || false;
});

// Métodos
const getCostText = (cost: string): string => {
  const costMap: Record<string, string> = {
    'low': 'Bajo costo',
    'medium': 'Costo medio', 
    'high': 'Alto costo'
  };
  return costMap[cost] || 'Costo no especificado';
};

const truncateDescription = (description: string, maxLength: number = 120): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
};

const toggleFavorite = (event: Event) => {
  event.stopPropagation();
  
  if (isFavorite.value) {
    favoritesStore.removeFavorite(props.university.id);
  } else {
    favoritesStore.addFavorite(props.university);
  }
};

const toggleComparison = (event: Event) => {
  event.stopPropagation();
  
  if (isInComparison.value) {
    comparisonStore.removeFromComparison(props.university.id);
  } else {
    if (comparisonStore.comparisonItems.length >= 3) {
      alert('Máximo 3 programas en comparación');
      return;
    }
    comparisonStore.addToComparison(props.university);
  }
};

const viewDetails = (event: Event) => {
  event.stopPropagation();
  router.push(`/university/${props.university.id}`);
};
</script>

<style scoped>
.university-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.university-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header-content {
  flex: 1;
}

.university-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #333;
  font-weight: 600;
  line-height: 1.3;
}

.university-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-badge, .cost-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

.type-badge.public {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.type-badge.private {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.cost-badge.low {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.cost-badge.medium {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.cost-badge.high {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.favorite-btn {
  background: transparent;
  border: 2px solid #ffd700;
  color: #ffd700;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.favorite-btn:hover {
  background: rgba(255, 215, 0, 0.1);
  transform: scale(1.1);
}

.favorite-btn.active {
  background: #ffd700;
  color: white;
}

/* Contenido */
.card-content {
  flex: 1;
  margin-bottom: 1.5rem;
}

.location-info {
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

.location-text {
  display: flex;
  flex-direction: column;
}

.location-text strong {
  color: #333;
  font-size: 1rem;
}

.location-text span {
  color: #666;
  font-size: 0.9rem;
}

.description {
  color: #555;
  line-height: 1.5;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.stat-label {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.1rem;
}

/* Acciones */
.card-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: auto;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.btn-secondary:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.btn-secondary.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #bbdefb;
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .university-card {
    padding: 1.25rem;
  }
  
  .university-name {
    font-size: 1.1rem;
  }
  
  .card-actions {
    grid-template-columns: 1fr;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .university-badges {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .btn-text {
    font-size: 0.8rem;
  }
}
</style>