<template>
  <div class="program-card">
    <!-- ... código existente ... -->
    
    <!-- Sección de reseñas -->
    <div v-if="showReviews" class="program-reviews-section">
      <div class="reviews-summary" @click="openReviewsModal">
        <RatingStars 
          :rating="reviewStats.averageRating" 
          :showNumber="true"
          :showCount="true"
          :count="reviewStats.totalReviews"
          size="sm"
        />
        <button class="review-btn" @click.stop="openReviewsModal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          Reseñas
        </button>
      </div>
    </div>
    
    <!-- ... código existente ... -->
  </div>

  <!-- Modal de reseñas para programas -->
  <ReviewModal 
    v-if="showReviewModal"
    :isVisible="showReviewModal"
    :entityId="program.id"
    entityType="program"
    :entityName="program.name"
    @close="closeReviewsModal"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import RatingStars from './RatingStars.vue';
import ReviewModal from './ReviewModal.vue';
import type { Program } from '@/types';

interface Props {
  program: Program;
  showReviews?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showReviews: true
});

const reviewsStore = useReviewsStore();
const showReviewModal = ref(false);

const reviewStats = computed(() => {
  return reviewsStore.getReviewStats(props.program.id, 'program');
});

const openReviewsModal = () => {
  showReviewModal.value = true;
};

const closeReviewsModal = () => {
  showReviewModal.value = false;
};
</script>

<style scoped>
/* Estilos para la sección de reseñas en programas */
.program-reviews-section {
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}

.reviews-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.reviews-summary:hover {
  opacity: 0.8;
}

/* Reutilizar estilos de review-btn de UniversityCard */
.review-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #4b5563;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.review-btn:hover {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

.review-btn svg {
  width: 0.875rem;
  height: 0.875rem;
  stroke-width: 2;
}
</style>