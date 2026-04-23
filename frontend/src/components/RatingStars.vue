<template>
  <div class="rating-stars" :class="[size]">
    <div class="stars-container">
      <span 
        v-for="n in 5" 
        :key="n"
        class="star"
        :class="{ 
          'filled': n <= Math.floor(rating),
          'half': n === Math.ceil(rating) && rating % 1 !== 0
        }"
        :title="`${rating.toFixed(1)} de 5 estrellas`"
      >
        ★
      </span>
    </div>
    
    <div v-if="showNumber || showCount" class="rating-info">
      <span v-if="showNumber" class="rating-number">
        {{ rating.toFixed(1) }}
      </span>
      <span v-if="showCount && count > 0" class="rating-count">
        ({{ count }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rating: number;
  showNumber?: boolean;
  showCount?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  showNumber: false,
  showCount: false,
  count: 0,
  size: 'md',
  rating: 0
});
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stars-container {
  display: inline-flex;
  position: relative;
}

.star {
  font-size: 1rem;
  line-height: 1;
  margin-right: 2px;
  color: #e4e5e9;
  position: relative;
  transition: color 0.2s;
}

.star.filled {
  color: #ffc107;
}

.star.half {
  position: relative;
  overflow: hidden;
}

.star.half::before {
  content: '★';
  position: absolute;
  left: 0;
  width: 50%;
  overflow: hidden;
  color: #ffc107;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

.rating-number {
  font-weight: 600;
  color: #374151;
}

.rating-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Tamaños */
.rating-stars.sm .star {
  font-size: 0.875rem;
}

.rating-stars.sm .rating-number {
  font-size: 0.875rem;
}

.rating-stars.sm .rating-count {
  font-size: 0.75rem;
}

.rating-stars.md .star {
  font-size: 1rem;
}

.rating-stars.md .rating-number {
  font-size: 0.9375rem;
}

.rating-stars.md .rating-count {
  font-size: 0.8125rem;
}

.rating-stars.lg .star {
  font-size: 1.25rem;
}

.rating-stars.lg .rating-number {
  font-size: 1.125rem;
  font-weight: 700;
}

.rating-stars.lg .rating-count {
  font-size: 0.9375rem;
}

.rating-stars.xl .star {
  font-size: 1.5rem;
}

.rating-stars.xl .rating-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.rating-stars.xl .rating-count {
  font-size: 1.125rem;
}

/* Para alineación vertical */
.rating-stars .stars-container {
  display: inline-flex;
  align-items: center;
}
</style>