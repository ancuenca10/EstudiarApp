<!-- src/components/reviews/ReviewStats.vue -->
<template>
  <div class="review-stats">
    <!-- Puntuación general -->
    <div class="overall-rating">
      <div class="average-score">
        <span class="score-number">{{ stats.averageRating.toFixed(1) }}</span>
        <span class="score-label">de 5</span>
      </div>
      
      <div class="rating-details">
        <RatingStars :rating="stats.averageRating" :readonly="true" :show-value="false" />
        <div class="total-reviews">{{ stats.totalReviews }} reseñas</div>
        <div v-if="stats.wouldRecommendPercentage > 0" class="recommendation-rate">
          <span class="rate-percentage">{{ stats.wouldRecommendPercentage.toFixed(0) }}%</span>
          <span class="rate-label">lo recomiendan</span>
        </div>
      </div>
    </div>

    <!-- Distribución de puntuaciones -->
    <div class="distribution">
      <div v-for="rating in 5" :key="rating" class="rating-bar">
        <div class="star-label">
          <span class="star-number">{{ rating }}</span>
          <span class="star-icon">★</span>
        </div>
        
        <div class="bar-container">
          <div 
            class="bar-fill" 
            :style="{ width: `${getPercentage(rating)}%` }"
            :class="`rating-${rating}`"
          ></div>
        </div>
        
        <div class="bar-count">{{ stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] }}</div>
      </div>
    </div>

    <!-- Estadísticas adicionales -->
    <div v-if="showAdvancedStats" class="advanced-stats">
      <div class="stat-item">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalReviews }}</div>
          <div class="stat-label">Total reseñas</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">👍</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.wouldRecommendPercentage.toFixed(0) }}%</div>
          <div class="stat-label">Recomendaciones</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ verifiedPercentage.toFixed(0) }}%</div>
          <div class="stat-label">Verificadas</div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-value">{{ withRepliesPercentage.toFixed(0) }}%</div>
          <div class="stat-label">Con respuesta</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewStats } from '@/types/reviews';
import RatingStars from '../RatingStars.vue';

const props = defineProps<{
  stats: ReviewStats;
  totalVerified?: number;
  totalWithReplies?: number;
  showAdvancedStats?: boolean;
}>();

const getPercentage = (rating: number) => {
  const count = props.stats.ratingDistribution[rating as keyof typeof props.stats.ratingDistribution];
  return props.stats.totalReviews > 0 ? (count / props.stats.totalReviews) * 100 : 0;
};

const verifiedPercentage = computed(() => {
  if (!props.totalVerified || props.stats.totalReviews === 0) return 0;
  return (props.totalVerified / props.stats.totalReviews) * 100;
});

const withRepliesPercentage = computed(() => {
  if (!props.totalWithReplies || props.stats.totalReviews === 0) return 0;
  return (props.totalWithReplies / props.stats.totalReviews) * 100;
});
</script>

<style scoped>
.review-stats {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.overall-rating {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.average-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.score-number {
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
}

.score-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.rating-details {
  flex: 1;
}

.rating-details > * {
  margin-bottom: 0.5rem;
}

.total-reviews {
  font-size: 0.95rem;
  color: #4b5563;
}

.recommendation-rate {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.rate-percentage {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.rate-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Distribución */
.distribution {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.star-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 40px;
}

.star-number {
  font-weight: 600;
  color: #4b5563;
  width: 12px;
}

.star-icon {
  color: #fbbf24;
  font-size: 0.9rem;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.bar-fill.rating-5 {
  background: linear-gradient(90deg, #10b981, #059669);
}

.bar-fill.rating-4 {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.bar-fill.rating-3 {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.bar-fill.rating-2 {
  background: linear-gradient(90deg, #f97316, #ea580c);
}

.bar-fill.rating-1 {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.bar-count {
  width: 40px;
  text-align: right;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Estadísticas avanzadas */
.advanced-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 640px) {
  .overall-rating {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .rating-details {
    text-align: center;
  }
  
  .advanced-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>