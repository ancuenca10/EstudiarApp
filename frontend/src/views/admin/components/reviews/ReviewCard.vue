<!-- src/components/reviews/ReviewCard.vue -->
<template>
  <div class="review-card" :class="{ 'has-reply': review.universityReply }">
    <!-- Header -->
    <div class="review-header">
      <div class="reviewer-info">
        <div class="avatar">
          <img v-if="review.userAvatar" :src="review.userAvatar" :alt="review.userName">
          <div v-else class="avatar-fallback">
            {{ review.userName.charAt(0) }}
          </div>
        </div>
        <div class="reviewer-details">
          <h4 class="reviewer-name">{{ review.userName }}</h4>
          <div class="reviewer-meta">
            <span v-if="review.isVerifiedStudent" class="verified-badge">
              ✅ Estudiante verificado
            </span>
            <span class="review-date">
              {{ formatDate(review.createdAt) }}
            </span>
            <span v-if="review.studyYear" class="study-year">
              Año {{ review.studyYear }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="review-rating">
        <div class="stars">
          <span v-for="star in 5" :key="star" class="star">
            {{ star <= review.rating ? '★' : '☆' }}
          </span>
        </div>
        <span class="rating-value">{{ review.rating }}/5</span>
      </div>
    </div>
    
    <!-- Content -->
    <div class="review-content">
      <h3 class="review-title">{{ review.title }}</h3>
      <p class="review-text">{{ review.content }}</p>
      
      <!-- Pros y Cons -->
      <div v-if="review.pros.length > 0 || review.cons.length > 0" class="pros-cons">
        <div v-if="review.pros.length > 0" class="pros">
          <h5>👍 Ventajas</h5>
          <ul>
            <li v-for="pro in review.pros" :key="pro">{{ pro }}</li>
          </ul>
        </div>
        <div v-if="review.cons.length > 0" class="cons">
          <h5>👎 Desventajas</h5>
          <ul>
            <li v-for="con in review.cons" :key="con">{{ con }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Would Recommend -->
      <div class="recommendation">
        <span :class="{ 'recommended': review.wouldRecommend, 'not-recommended': !review.wouldRecommend }">
          {{ review.wouldRecommend ? '✅ Recomendaría' : '❌ No recomendaría' }}
        </span>
      </div>
    </div>
    
    <!-- University Reply -->
    <div v-if="review.universityReply" class="university-reply">
      <div class="reply-header">
        <span class="reply-icon">🏛️</span>
        <strong>Respuesta de la universidad</strong>
        <span class="reply-date">{{ formatDate(review.replyDate!) }}</span>
      </div>
      <p class="reply-content">{{ review.universityReply }}</p>
    </div>
    
    <!-- Footer -->
    <div class="review-footer">
      <button 
        @click="voteHelpful(true)" 
        class="vote-btn helpful"
        :class="{ 'active': userVote === 'helpful' }"
        :disabled="hasVoted"
      >
        <span>👍</span>
        <span>Útil ({{ review.helpfulCount }})</span>
      </button>
      
      <button 
        @click="voteHelpful(false)" 
        class="vote-btn not-helpful"
        :class="{ 'active': userVote === 'not-helpful' }"
        :disabled="hasVoted"
      >
        <span>👎</span>
        <span>No útil ({{ review.notHelpfulCount }})</span>
      </button>
      
      <button v-if="isOwner" @click="editReview" class="action-btn edit">
        ✏️ Editar
      </button>
      
      <button v-if="isOwner" @click="deleteReview" class="action-btn delete">
        🗑️ Eliminar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import type { Review } from '@/types/reviews';

interface Props {
  review: Review;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
});

const reviewsStore = useReviewsStore();
const userVote = ref<'helpful' | 'not-helpful' | null>(null);
const hasVoted = ref(false);

// En una implementación real, esto vendría de un store de autenticación
const currentUserId = ref('current-user'); // Temporal

const isOwner = computed(() => {
  return props.review.userId === currentUserId.value;
});

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const voteHelpful = (isHelpful: boolean) => {
  if (hasVoted.value) return;
  
  reviewsStore.voteHelpful(props.review.id, isHelpful);
  userVote.value = isHelpful ? 'helpful' : 'not-helpful';
  hasVoted.value = true;
  
  // En producción, guardar en localStorage que el usuario ya votó
  localStorage.setItem(`vote_${props.review.id}`, userVote.value);
};

const editReview = () => {
  emit('edit', props.review);
};

const deleteReview = () => {
  if (confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
    reviewsStore.deleteReview(props.review.id);
    emit('deleted');
  }
};

const emit = defineEmits<{
  edit: [review: Review];
  deleted: [];
}>();

// Verificar si el usuario ya votó
onMounted(() => {
  const savedVote = localStorage.getItem(`vote_${props.review.id}`);
  if (savedVote) {
    userVote.value = savedVote as 'helpful' | 'not-helpful';
    hasVoted.value = true;
  }
});
</script>

<style scoped>
.review-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.review-card.has-reply {
  border-left: 4px solid #4CAF50;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.reviewer-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.reviewer-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reviewer-name {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.reviewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.verified-badge {
  background: #4CAF50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.review-date,
.study-year {
  color: #666;
  font-size: 0.9rem;
}

.review-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.25rem;
  font-size: 1.2rem;
  color: #FFD700;
}

.rating-value {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.review-content {
  margin-bottom: 1.5rem;
}

.review-title {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #333;
}

.review-text {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.pros-cons h5 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
}

.pros h5 {
  color: #4CAF50;
}

.cons h5 {
  color: #f44336;
}

.pros-cons ul {
  margin: 0;
  padding-left: 1.5rem;
}

.pros-cons li {
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 0.9rem;
}

.recommendation {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8f9fa;
  display: inline-block;
}

.recommended {
  color: #4CAF50;
  font-weight: 500;
}

.not-recommended {
  color: #f44336;
  font-weight: 500;
}

.university-reply {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  border-left: 4px solid #4CAF50;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.reply-icon {
  font-size: 1.2rem;
}

.reply-date {
  margin-left: auto;
  color: #666;
  font-size: 0.9rem;
}

.reply-content {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.review-footer {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.vote-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.vote-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-btn.helpful:hover:not(:disabled),
.vote-btn.helpful.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.vote-btn.not-helpful:hover:not(:disabled),
.vote-btn.not-helpful.active {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: auto;
}

.action-btn.edit {
  background: #2196F3;
  color: white;
}

.action-btn.delete {
  background: #f44336;
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
}

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
  }
  
  .review-footer {
    flex-direction: column;
  }
  
  .action-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>