<!-- src/components/reviews/ReviewStats.vue -->
<template>
  <div class="review-stats">
    <!-- Rating promedio -->
    <div class="rating-summary">
      <div class="average-rating">
        <span class="rating-value">{{ stats.averageRating.toFixed(1) }}</span>
        <div class="stars">
          <span v-for="star in 5" :key="star" class="star">
            {{ star <= Math.round(stats.averageRating) ? '★' : '☆' }}
          </span>
        </div>
        <span class="total-reviews">{{ stats.totalReviews }} reseña{{ stats.totalReviews !== 1 ? 's' : '' }}</span>
      </div>
      
      <!-- Distribución de ratings -->
      <div class="rating-distribution">
        <div 
          v-for="rating in [5, 4, 3, 2, 1]" 
          :key="rating"
          class="distribution-row"
        >
          <span class="rating-label">{{ rating }} estrellas</span>
          <div class="distribution-bar">
            <div 
              class="bar-fill" 
              :style="{ width: getPercentage(rating) + '%' }"
            ></div>
          </div>
          <span class="percentage">{{ getPercentage(rating).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Recomendación -->
    <div v-if="stats.totalReviews > 0" class="recommendation-stats">
      <div class="recommendation-meter">
        <div class="meter-label">Recomendación</div>
        <div class="meter-bar">
          <div 
            class="meter-fill" 
            :style="{ width: stats.wouldRecommendPercentage + '%' }"
          ></div>
        </div>
        <div class="meter-value">{{ stats.wouldRecommendPercentage.toFixed(0) }}%</div>
      </div>
      <p class="recommendation-text">
        <strong>{{ stats.wouldRecommendPercentage.toFixed(0) }}%</strong> 
        de los estudiantes recomiendan esta {{ entityType === 'university' ? 'universidad' : 'programa' }}
      </p>
    </div>
    
    <!-- Pros y Cons más comunes -->
    <div v-if="stats.pros.length > 0 || stats.cons.length > 0" class="pros-cons-stats">
      <div v-if="stats.pros.length > 0" class="pros-section">
        <h4>👍 Ventajas más mencionadas</h4>
        <ul class="pros-list">
          <li v-for="(pro, index) in stats.pros" :key="index">
            {{ pro }}
          </li>
        </ul>
      </div>
      
      <div v-if="stats.cons.length > 0" class="cons-section">
        <h4>👎 Desventajas más mencionadas</h4>
        <ul class="cons-list">
          <li v-for="(con, index) in stats.cons" :key="index">
            {{ con }}
          </li>
        </ul>
      </div>
    </div>
    
    <!-- CTA -->
    <div v-if="showCta" class="stats-cta">
      <p>Comparte tu experiencia para ayudar a otros estudiantes</p>
      <button @click="emit('writeReview')" class="write-review-btn">
        ✏️ Escribir reseña
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReviewStats } from '@/types/reviews';

interface Props {
  stats: ReviewStats;
  showCta?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showCta: true,
});

const emit = defineEmits<{
  writeReview: [];
}>();

const entityType = computed(() => props.stats.entityType);

const getPercentage = (rating: number) => {
  const count = props.stats.ratingDistribution[rating as keyof typeof props.stats.ratingDistribution] || 0;
  return (count / props.stats.totalReviews) * 100;
};
</script>

<style scoped>
.review-stats {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.rating-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.average-rating {
  flex: 0 0 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stars {
  display: flex;
  gap: 0.25rem;
  font-size: 1.5rem;
  color: #FFD700;
}

.total-reviews {
  color: #666;
  font-size: 0.9rem;
}

.rating-distribution {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rating-label {
  width: 80px;
  color: #666;
  font-size: 0.9rem;
}

.distribution-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 4px;
  transition: width 1s ease-in-out;
}

.percentage {
  width: 40px;
  text-align: right;
  font-weight: 500;
  color: #333;
}

.recommendation-stats {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.recommendation-meter {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.meter-label {
  width: 120px;
  color: #333;
  font-weight: 500;
}

.meter-bar {
  flex: 1;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #2E7D32);
  border-radius: 6px;
  transition: width 1s ease-in-out;
}

.meter-value {
  width: 50px;
  text-align: right;
  font-weight: bold;
  color: #4CAF50;
  font-size: 1.1rem;
}

.recommendation-text {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.pros-cons-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.pros-cons-stats h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.pros-section h4 {
  color: #4CAF50;
}

.cons-section h4 {
  color: #f44336;
}

.pros-list,
.cons-list {
  margin: 0;
  padding-left: 1.5rem;
}

.pros-list li,
.cons-list li {
  margin-bottom: 0.75rem;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
}

.pros-list li:before {
  content: '👍 ';
}

.cons-list li:before {
  content: '👎 ';
}

.stats-cta {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.stats-cta p {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.write-review-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.write-review-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .rating-summary {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .average-rating {
    flex: none;
  }
  
  .pros-cons-stats {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>