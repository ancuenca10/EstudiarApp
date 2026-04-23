<template>
  <div class="star-rating">
    <div class="stars">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="star-btn"
        :class="{ 
          'active': star <= modelValue,
          'hovered': star <= hoverRating,
          'disabled': disabled
        }"
        @click="!disabled && $emit('update:modelValue', star)"
        @mouseenter="!disabled && (hoverRating = star)"
        @mouseleave="!disabled && (hoverRating = 0)"
        :disabled="disabled"
        :title="getStarTitle(star)"
        :aria-label="`Calificar con ${star} ${star === 1 ? 'estrella' : 'estrellas'}`"
      >
        <span class="star-icon">★</span>
      </button>
    </div>
    
    <div v-if="showLabel" class="rating-label">
      <span v-if="hoverRating > 0 && !disabled" class="hover-label">
        {{ getRatingLabel(hoverRating) }}
      </span>
      <span v-else class="current-label">
        {{ getRatingLabel(modelValue) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: number;
  showLabel?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  showLabel: true,
  disabled: false,
  readonly: false
});

const emit = defineEmits(['update:modelValue']);

const hoverRating = ref(0);

const getStarTitle = (star: number) => {
  const labels = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
  return `${star} ${star === 1 ? 'estrella' : 'estrellas'} - ${labels[star - 1]}`;
};

const getRatingLabel = (rating: number) => {
  if (rating === 0) return 'Sin calificar';
  
  const labels = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
  return `${rating}/5 - ${labels[rating - 1]}`;
};
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
}

.stars {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.star-btn:not(.disabled):hover {
  transform: scale(1.1);
  background-color: rgba(255, 193, 7, 0.1);
}

.star-btn.active .star-icon {
  color: #ffc107;
}

.star-btn.hovered .star-icon {
  color: #ffd54f;
}

.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-icon {
  font-size: 2rem;
  color: #e4e5e9;
  transition: color 0.2s;
  line-height: 1;
}

.rating-label {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-label,
.current-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.hover-label {
  color: #3b82f6;
  font-weight: 600;
}

.current-label {
  color: #6b7280;
}

/* Tamaños */
.star-rating.sm .star-icon {
  font-size: 1.25rem;
}

.star-rating.md .star-icon {
  font-size: 1.5rem;
}

.star-rating.lg .star-icon {
  font-size: 2rem;
}

.star-rating.xl .star-icon {
  font-size: 2.5rem;
}
</style>