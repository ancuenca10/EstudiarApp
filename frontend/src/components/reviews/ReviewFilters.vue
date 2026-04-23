<!-- src/components/reviews/ReviewFilters.vue -->
<template>
  <div class="review-filters">
    <div class="filters-header">
      <h4>🔍 Filtros</h4>
      <button 
        v-if="hasActiveFilters" 
        @click="resetFilters" 
        class="reset-btn"
      >
        Limpiar filtros
      </button>
    </div>

    <div class="filters-grid">
      <!-- Ordenar por -->
      <div class="filter-group">
        <label class="filter-label">Ordenar por</label>
        <div class="sort-buttons">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            @click="updateSort(option.value)"
            :class="{ active: filters.sortBy === option.value }"
            class="sort-btn"
          >
            {{ option.icon }} {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Calificación mínima -->
      <div class="filter-group">
        <label class="filter-label">Calificación mínima</label>
        <div class="rating-filter">
          <button
            v-for="rating in ratingOptions"
            :key="rating.value"
            @click="updateMinRating(rating.value)"
            :class="{ active: filters.minRating === rating.value }"
            class="rating-btn"
          >
            {{ rating.icon }} {{ rating.label }}
          </button>
        </div>
      </div>

      <!-- Filtros de checkbox -->
      <div class="filter-group">
        <label class="filter-label">Filtrar por</label>
        <div class="checkbox-filters">
          <label class="checkbox-filter">
            <input
              type="checkbox"
              v-model="filters.verifiedOnly"
              @change="updateFilters"
            />
            <span class="checkbox-icon">✅</span>
            <span>Solo estudiantes verificados</span>
          </label>
          
          <label class="checkbox-filter">
            <input
              type="checkbox"
              v-model="filters.withReplies"
              @change="updateFilters"
            />
            <span class="checkbox-icon">💬</span>
            <span>Con respuesta de la universidad</span>
          </label>
          
          <label class="checkbox-filter">
            <input
              type="checkbox"
              v-model="filters.helpfulOnly"
              @change="updateFilters"
            />
            <span class="checkbox-icon">👍</span>
            <span>Solo reseñas útiles</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Filtros activos -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="active-filters-label">Filtros aplicados:</div>
      <div class="active-filters-list">
        <span 
          v-for="filter in activeFiltersList" 
          :key="filter.label"
          class="active-filter"
        >
          {{ filter.label }}
          <button 
            @click="removeFilter(filter.type, filter.value)"
            class="remove-filter-btn"
          >
            ×
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewFilters } from '@/types/reviews';

const props = defineProps<{
  filters: ReviewFilters;
}>();

const emit = defineEmits(['update:filters']);

// Opciones de ordenamiento
const sortOptions = [
  { value: 'recent', label: 'Más recientes', icon: '🕒' },
  { value: 'helpful', label: 'Más útiles', icon: '👍' },
  { value: 'highest', label: 'Mejor puntuación', icon: '⭐' },
  { value: 'lowest', label: 'Peor puntuación', icon: '📉' },
];

// Opciones de calificación
const ratingOptions = [
  { value: 0, label: 'Todas', icon: '🌟' },
  { value: 5, label: '5 estrellas', icon: '⭐⭐⭐⭐⭐' },
  { value: 4, label: '4+ estrellas', icon: '⭐⭐⭐⭐' },
  { value: 3, label: '3+ estrellas', icon: '⭐⭐⭐' },
];

// Computed
const hasActiveFilters = computed(() => {
  return (
    props.filters.sortBy !== 'recent' ||
    props.filters.minRating > 0 ||
    props.filters.verifiedOnly ||
    props.filters.withReplies ||
    props.filters.helpfulOnly
  );
});

const activeFiltersList = computed(() => {
  const filters = [];

  // Ordenamiento
  if (props.filters.sortBy !== 'recent') {
    const option = sortOptions.find(o => o.value === props.filters.sortBy);
    filters.push({
      type: 'sortBy',
      value: props.filters.sortBy,
      label: option?.label || 'Orden personalizado'
    });
  }

  // Calificación mínima
  if (props.filters.minRating > 0) {
    const option = ratingOptions.find(o => o.value === props.filters.minRating);
    filters.push({
      type: 'minRating',
      value: props.filters.minRating,
      label: option?.label || `${props.filters.minRating}+ estrellas`
    });
  }

  // Verificados
  if (props.filters.verifiedOnly) {
    filters.push({
      type: 'verifiedOnly',
      value: true,
      label: 'Estudiantes verificados'
    });
  }

  // Con respuestas
  if (props.filters.withReplies) {
    filters.push({
      type: 'withReplies',
      value: true,
      label: 'Con respuesta'
    });
  }

  // Útiles
  if (props.filters.helpfulOnly) {
    filters.push({
      type: 'helpfulOnly',
      value: true,
      label: 'Reseñas útiles'
    });
  }

  return filters;
});

// Métodos
const updateSort = (value: ReviewFilters['sortBy']) => {
  emit('update:filters', { ...props.filters, sortBy: value });
};

const updateMinRating = (value: number) => {
  emit('update:filters', { ...props.filters, minRating: value });
};

const updateFilters = () => {
  emit('update:filters', { ...props.filters });
};

const resetFilters = () => {
  const defaultFilters: ReviewFilters = {
    sortBy: 'recent',
    minRating: 0,
    verifiedOnly: false,
    withReplies: false,
    helpfulOnly: false,
  };
  emit('update:filters', defaultFilters);
};

const removeFilter = (type: string, value: any) => {
  const newFilters = { ...props.filters };

  switch (type) {
    case 'sortBy':
      newFilters.sortBy = 'recent';
      break;
    case 'minRating':
      newFilters.minRating = 0;
      break;
    case 'verifiedOnly':
      newFilters.verifiedOnly = false;
      break;
    case 'withReplies':
      newFilters.withReplies = false;
      break;
    case 'helpfulOnly':
      newFilters.helpfulOnly = false;
      break;
  }

  emit('update:filters', newFilters);
};
</script>

<style scoped>
.review-filters {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.filters-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.reset-btn {
  padding: 0.375rem 0.75rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.filters-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sort-btn {
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sort-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.sort-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.rating-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rating-btn {
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rating-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.rating-btn.active {
  background: #fbbf24;
  color: #92400e;
  border-color: #fbbf24;
}

.checkbox-filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #4b5563;
  font-size: 0.9rem;
}

.checkbox-filter input[type="checkbox"] {
  margin: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  cursor: pointer;
}

.checkbox-icon {
  font-size: 1rem;
}

/* Filtros activos */
.active-filters {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.active-filters-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.active-filters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.active-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.remove-filter-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.remove-filter-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .sort-buttons,
  .rating-filter {
    flex-direction: column;
  }
  
  .sort-btn,
  .rating-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>