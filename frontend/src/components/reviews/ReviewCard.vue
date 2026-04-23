<!-- src/components/reviews/ReviewCard.vue -->
<template>
  <div class="review-card" :class="{ 'has-reply': review.universityReply }">
    <!-- Encabezado -->
    <div class="review-header">
      <div class="user-info">
        <div class="avatar-container">
          <img 
            :src="review.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.userName" 
            :alt="review.userName"
            class="user-avatar"
          />
          <span v-if="review.isVerifiedStudent" class="verified-badge" title="Estudiante verificado">
            ✅
          </span>
        </div>
        <div class="user-details">
          <h4 class="user-name">{{ review.userName }}</h4>
          <div class="review-meta">
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            <span v-if="review.isVerifiedStudent" class="verified-label">Estudiante verificado</span>
          </div>
        </div>
      </div>
      
      <div class="review-rating">
        <RatingStars :rating="review.rating" :readonly="true" />
        <span class="rating-text">{{ getRatingText(review.rating) }}</span>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="review-content">
      <h3 class="review-title">{{ review.title }}</h3>
      <p class="review-text">{{ review.content }}</p>
      
      <!-- Pros y Cons -->
      <div class="pros-cons">
        <div v-if="review.pros.length > 0" class="pros">
          <h5>✅ Puntos positivos</h5>
          <ul>
            <li v-for="(pro, index) in review.pros" :key="`pro-${index}`">{{ pro }}</li>
          </ul>
        </div>
        <div v-if="review.cons.length > 0" class="cons">
          <h5>❌ Puntos a mejorar</h5>
          <ul>
            <li v-for="(con, index) in review.cons" :key="`con-${index}`">{{ con }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Recomendación -->
      <div class="recommendation">
        <span class="recommendation-icon" :class="{ recommended: review.wouldRecommend }">
          {{ review.wouldRecommend ? '👍' : '👎' }}
        </span>
        <span class="recommendation-text">
          {{ review.wouldRecommend ? 'Recomendaría este programa' : 'No recomendaría este programa' }}
        </span>
      </div>
    </div>

    <!-- Respuesta de la universidad -->
    <div v-if="review.universityReply" class="university-reply">
      <div class="reply-header">
        <span class="reply-icon">🏫</span>
        <strong>Respuesta de la universidad</strong>
        <span class="reply-date">{{ formatDate(review.replyDate!) }}</span>
      </div>
      <p class="reply-content">{{ review.universityReply }}</p>
    </div>

    <!-- Pie de reseña -->
    <div class="review-footer">
      <div class="helpful-section">
        <span class="helpful-text">¿Te resultó útil esta reseña?</span>
        <div class="helpful-buttons">
          <button 
            @click="handleVote(true)"
            :class="{ active: userVote === 'helpful' }"
            class="helpful-btn"
            :disabled="hasVoted"
          >
            👍 {{ review.helpfulCount }}
          </button>
          <button 
            @click="handleVote(false)"
            :class="{ active: userVote === 'not-helpful' }"
            class="not-helpful-btn"
            :disabled="hasVoted"
          >
            👎 {{ review.notHelpfulCount }}
          </button>
        </div>
      </div>
      
      <div class="review-actions">
        <button 
          v-if="canReport"
          @click="handleReport"
          class="report-btn"
          title="Reportar reseña"
        >
          🚨 Reportar
        </button>
        <button 
          v-if="canReply && userRole === 'university'"
          @click="$emit('reply', review.id)"
          class="reply-btn"
        >
          💬 Responder
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Review } from '@/types/reviews';
import RatingStars from '../RatingStars.vue';

const props = defineProps<{
  review: Review;
  userId?: string;
  userRole?: string;
}>();

const emit = defineEmits(['vote-helpful', 'vote-not-helpful', 'report', 'reply']);

const authStore = useAuthStore();
const userVote = ref<'helpful' | 'not-helpful' | null>(null);

// Computed
const canReport = computed(() => {
  return authStore.isAuthenticated && 
         props.userId !== props.review.userId && 
         props.review.status === 'approved';
});

const canReply = computed(() => {
  return !props.review.universityReply && 
         ['admin', 'super_admin', 'university'].includes(props.userRole || '');
});

const hasVoted = computed(() => userVote.value !== null);

// Métodos
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getRatingText = (rating: number) => {
  const texts = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
  return texts[rating - 1] || '';
};

const handleVote = (isHelpful: boolean) => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para votar');
    return;
  }

  if (hasVoted.value) {
    alert('Ya has votado esta reseña');
    return;
  }

  userVote.value = isHelpful ? 'helpful' : 'not-helpful';
  
  if (isHelpful) {
    emit('vote-helpful', props.review.id);
  } else {
    emit('vote-not-helpful', props.review.id);
  }
};

const handleReport = () => {
  if (!authStore.isAuthenticated) {
    alert('Debes iniciar sesión para reportar');
    return;
  }

  const reason = prompt('¿Por qué quieres reportar esta reseña?');
  if (reason && reason.trim()) {
    emit('report', props.review.id, reason);
  }
};
</script>

<style scoped>
.review-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.review-card.has-reply {
  border-left: 4px solid #3b82f6;
}

/* Encabezado */
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-container {
  position: relative;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.verified-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  padding: 2px;
  font-size: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1f2937;
}

.review-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.verified-label {
  color: #059669;
  font-weight: 500;
}

.review-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.rating-text {
  font-size: 0.875rem;
  color: #4f46e5;
  font-weight: 500;
}

/* Contenido */
.review-content {
  margin-bottom: 1.5rem;
}

.review-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
}

.review-text {
  margin: 0 0 1.25rem 0;
  color: #374151;
  line-height: 1.6;
  white-space: pre-line;
}

.pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.pros-cons h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.pros h5 {
  color: #059669;
}

.cons h5 {
  color: #dc2626;
}

.pros-cons ul {
  margin: 0;
  padding-left: 1.25rem;
}

.pros-cons li {
  margin-bottom: 0.25rem;
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.4;
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 3px solid #d1d5db;
}

.recommendation.recommended {
  background: #f0f9ff;
  border-left-color: #3b82f6;
}

.recommendation-icon {
  font-size: 1.25rem;
}

.recommendation-text {
  color: #4b5563;
  font-weight: 500;
}

/* Respuesta de la universidad */
.university-reply {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border-left: 4px solid #0ea5e9;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #0369a1;
}

.reply-icon {
  font-size: 1.25rem;
}

.reply-date {
  margin-left: auto;
  font-size: 0.75rem;
  opacity: 0.8;
}

.reply-content {
  margin: 0;
  color: #0c4a6e;
  line-height: 1.5;
  white-space: pre-line;
}

/* Pie de reseña */
.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.helpful-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.helpful-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.helpful-buttons {
  display: flex;
  gap: 0.5rem;
}

.helpful-btn,
.not-helpful-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.helpful-btn:hover:not(:disabled),
.helpful-btn.active {
  background: #d1fae5;
  border-color: #10b981;
  color: #065f46;
}

.not-helpful-btn:hover:not(:disabled),
.not-helpful-btn.active {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.helpful-btn:disabled,
.not-helpful-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
}

.report-btn,
.reply-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.report-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

.reply-btn:hover {
  background: #f0f9ff;
  border-color: #0ea5e9;
  color: #0284c7;
}

/* Responsive */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .review-rating {
    align-items: flex-start;
  }
  
  .pros-cons {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .review-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .helpful-section {
    justify-content: space-between;
  }
  
  .review-actions {
    justify-content: flex-end;
  }
}
</style>