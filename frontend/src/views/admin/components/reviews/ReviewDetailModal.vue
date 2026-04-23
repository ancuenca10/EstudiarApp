<!-- src/components/reviews/ReviewDetailModal.vue -->
<template>
  <div class="review-detail-modal">
    <!-- Header del modal -->
    <div class="modal-header">
      <h2>📝 Detalles de la Reseña</h2>
      <button @click="closeModal" class="modal-close-btn">
        ✕
      </button>
    </div>

    <!-- Contenido principal -->
    <div class="modal-content">
      <!-- Información de la entidad -->
      <div class="entity-info-section">
        <div class="entity-header">
          <div class="entity-icon">
            {{ review.entityType === 'university' ? '🏛️' : '🎓' }}
          </div>
          <div class="entity-details">
            <h3>{{ entityName }}</h3>
            <div class="entity-meta">
              <span v-if="review.entityType === 'university'" class="entity-type">
                {{ getUniversityType(entityId) === 'public' ? 'Universidad Pública' : 'Universidad Privada' }}
              </span>
              <span v-if="review.entityType === 'program'" class="entity-type">
                Programa Académico
              </span>
              <span class="entity-location" v-if="entityLocation">
                📍 {{ entityLocation }}
              </span>
            </div>
          </div>
          <div class="entity-stats">
            <div class="stat-item">
              <span class="stat-label">Calificación promedio:</span>
              <span class="stat-value">
                ⭐ {{ entityAverageRating.toFixed(1) }}/5
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total reseñas:</span>
              <span class="stat-value">{{ entityTotalReviews }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Información de la reseña -->
      <div class="review-details-section">
        <!-- Header de la reseña -->
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">
              <img v-if="review.userAvatar" :src="review.userAvatar" :alt="review.userName">
              <div v-else class="avatar-fallback">
                {{ review.userName.charAt(0) }}
              </div>
            </div>
            <div class="reviewer-details">
              <h4>{{ review.userName }}</h4>
              <div class="reviewer-meta">
                <span v-if="review.isVerifiedStudent" class="verified-badge">
                  ✅ Estudiante verificado
                </span>
                <span class="review-date">
                  📅 {{ formatDate(review.createdAt) }}
                </span>
                <span v-if="review.studyYear" class="study-year">
                  Año {{ review.studyYear }}
                </span>
                <span v-if="review.graduationYear" class="graduation-year">
                  🎓 Graduado {{ review.graduationYear }}
                </span>
              </div>
            </div>
          </div>

          <div class="review-rating-display">
            <div class="rating-badge">
              <div class="stars">
                <span v-for="star in 5" :key="star" class="star">
                  {{ star <= review.rating ? '★' : '☆' }}
                </span>
              </div>
              <span class="rating-value">{{ review.rating }}/5</span>
            </div>
            <div class="review-status" :class="getStatusClass(review.status)">
              {{ getStatusText(review.status) }}
            </div>
          </div>
        </div>

        <!-- Título y contenido -->
        <div class="review-content">
          <h3 class="review-title">{{ review.title }}</h3>
          
          <div class="review-text">
            <p>{{ review.content }}</p>
          </div>

          <!-- Pros y Cons -->
          <div v-if="review.pros.length > 0 || review.cons.length > 0" class="pros-cons-section">
            <div class="pros-cons-header">
              <h4>📊 Aspectos destacados</h4>
            </div>
            <div class="pros-cons-grid">
              <div v-if="review.pros.length > 0" class="pros-column">
                <div class="section-header positive">
                  <span class="section-icon">👍</span>
                  <h5>Ventajas</h5>
                </div>
                <ul class="pros-list">
                  <li v-for="(pro, index) in review.pros" :key="index" class="pro-item">
                    <span class="check-icon">✅</span>
                    <span>{{ pro }}</span>
                  </li>
                </ul>
              </div>
              
              <div v-if="review.cons.length > 0" class="cons-column">
                <div class="section-header negative">
                  <span class="section-icon">👎</span>
                  <h5>Desventajas</h5>
                </div>
                <ul class="cons-list">
                  <li v-for="(con, index) in review.cons" :key="index" class="con-item">
                    <span class="cross-icon">❌</span>
                    <span>{{ con }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Recomendación -->
          <div class="recommendation-section">
            <div class="recommendation-card" :class="{ 'recommended': review.wouldRecommend }">
              <div class="recommendation-icon">
                {{ review.wouldRecommend ? '✅' : '❌' }}
              </div>
              <div class="recommendation-content">
                <h5>
                  {{ review.wouldRecommend ? 'Recomendaría esta ' : 'No recomendaría esta ' }}
                  {{ review.entityType === 'university' ? 'universidad' : 'programa' }}
                </h5>
                <p v-if="review.wouldRecommend">
                  Este estudiante recomienda esta {{ review.entityType === 'university' ? 'universidad' : 'programa' }} a otros estudiantes
                </p>
                <p v-else>
                  Este estudiante no recomienda esta {{ review.entityType === 'university' ? 'universidad' : 'programa' }} a otros estudiantes
                </p>
              </div>
            </div>
          </div>

          <!-- Estadísticas de votos -->
          <div class="votes-section">
            <div class="votes-header">
              <h4>📈 Útil para otros estudiantes</h4>
              <span class="helpful-score">
                {{ helpfulScore }}% encontraron útil esta reseña
              </span>
            </div>
            <div class="votes-display">
              <div class="vote-meter">
                <div class="meter-bar">
                  <div 
                    class="helpful-fill" 
                    :style="{ width: helpfulPercentage + '%' }"
                  ></div>
                  <div 
                    class="not-helpful-fill" 
                    :style="{ width: notHelpfulPercentage + '%' }"
                  ></div>
                </div>
                <div class="meter-labels">
                  <span class="helpful-label">
                    👍 Útil ({{ review.helpfulCount }})
                  </span>
                  <span class="not-helpful-label">
                    👎 No útil ({{ review.notHelpfulCount }})
                  </span>
                </div>
              </div>
              
              <div class="vote-actions" v-if="!hasVoted">
                <p>¿Esta reseña te fue útil?</p>
                <div class="vote-buttons">
                  <button 
                    @click="voteHelpful(true)" 
                    class="vote-btn helpful"
                    :disabled="isVoting"
                  >
                    <span class="vote-icon">👍</span>
                    <span class="vote-text">Sí, es útil</span>
                  </button>
                  <button 
                    @click="voteHelpful(false)" 
                    class="vote-btn not-helpful"
                    :disabled="isVoting"
                  >
                    <span class="vote-icon">👎</span>
                    <span class="vote-text">No es útil</span>
                  </button>
                </div>
              </div>
              <div v-else class="vote-thanks">
                <span class="thanks-icon">🙏</span>
                <span>Gracias por tu votación</span>
              </div>
            </div>
          </div>

          <!-- Respuesta de la universidad -->
          <div v-if="review.universityReply" class="university-reply-section">
            <div class="reply-header">
              <div class="reply-icon">🏛️</div>
              <div class="reply-title">
                <h4>Respuesta de la universidad</h4>
                <span class="reply-date">
                  📅 {{ formatDate(review.replyDate!) }}
                </span>
              </div>
            </div>
            <div class="reply-content">
              <p>{{ review.universityReply }}</p>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="additional-info">
            <div class="info-grid">
              <div class="info-item" v-if="review.updatedAt">
                <span class="info-label">📝 Última actualización:</span>
                <span class="info-value">{{ formatDate(review.updatedAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🆔 ID de la reseña:</span>
                <span class="info-value">{{ review.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🌐 Visibilidad:</span>
                <span class="info-value">
                  {{ review.status === 'approved' ? 'Pública' : 'Solo visible para ti' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer del modal con acciones -->
    <div class="modal-footer">
      <div class="footer-actions">
        <button @click="shareReview" class="action-btn share">
          <span class="action-icon">📤</span>
          <span class="action-text">Compartir</span>
        </button>
        
        <button 
          v-if="isReviewOwner"
          @click="editReview"
          class="action-btn edit"
          :disabled="!canEditReview"
        >
          <span class="action-icon">✏️</span>
          <span class="action-text">Editar</span>
        </button>
        
        <button 
          v-if="isReviewOwner"
          @click="deleteReview"
          class="action-btn delete"
        >
          <span class="action-icon">🗑️</span>
          <span class="action-text">Eliminar</span>
        </button>
        
        <button 
          v-if="!isReviewOwner"
          @click="reportReview"
          class="action-btn report"
        >
          <span class="action-icon">🚩</span>
          <span class="action-text">Reportar</span>
        </button>
        
        <button @click="viewEntityDetails" class="action-btn view-entity">
          <span class="action-icon">
            {{ review.entityType === 'university' ? '🏛️' : '🎓' }}
          </span>
          <span class="action-text">
            Ver {{ review.entityType === 'university' ? 'universidad' : 'programa' }}
          </span>
        </button>
      </div>
      
      <button @click="closeModal" class="close-btn">
        Cerrar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewsStore } from '@/stores/reviews';
import { useUniversitiesStore } from '@/stores/universities';
import type { Review } from '@/types/reviews';

interface Props {
  review: Review;
  entityName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  edit: [review: Review];
  delete: [review: Review];
}>();

const router = useRouter();
const reviewsStore = useReviewsStore();
const universitiesStore = useUniversitiesStore();

// ============ ESTADOS ============
const hasVoted = ref(false);
const userVote = ref<'helpful' | 'not-helpful' | null>(null);
const isVoting = ref(false);

// ============ COMPUTED PROPERTIES ============

const entityId = computed(() => props.review.entityId);
const entityStats = computed(() => {
  return reviewsStore.getReviewStats(props.review.entityId, props.review.entityType);
});

const entityAverageRating = computed(() => entityStats.value.averageRating);
const entityTotalReviews = computed(() => entityStats.value.totalReviews);

const entityLocation = computed(() => {
  if (props.review.entityType === 'university') {
    const university = universitiesStore.universities.find(u => {
      const id = u.id || u._id;
      return id === props.review.entityId;
    });
    return university ? `${university.city || 'Ciudad'}, ${university.country || 'Colombia'}` : '';
  }
  return '';
});

const helpfulScore = computed(() => {
  const total = props.review.helpfulCount + props.review.notHelpfulCount;
  if (total === 0) return 0;
  return Math.round((props.review.helpfulCount / total) * 100);
});

const helpfulPercentage = computed(() => {
  const total = props.review.helpfulCount + props.review.notHelpfulCount;
  if (total === 0) return 0;
  return (props.review.helpfulCount / total) * 100;
});

const notHelpfulPercentage = computed(() => {
  const total = props.review.helpfulCount + props.review.notHelpfulCount;
  if (total === 0) return 0;
  return (props.review.notHelpfulCount / total) * 100;
});

// Verificar si el usuario actual es el dueño de la reseña
const isReviewOwner = computed(() => {
  // En producción, usar store de autenticación
  const currentUserId = 'current-user'; // Temporal
  return props.review.userId === currentUserId;
});

const canEditReview = computed(() => {
  return props.review.status === 'pending' || props.review.status === 'rejected';
});

// ============ MÉTODOS HELPER ============

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'approved': 'Publicada',
    'pending': 'Pendiente de revisión',
    'rejected': 'Rechazada',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    'approved': 'status-approved',
    'pending': 'status-pending',
    'rejected': 'status-rejected',
  };
  return classMap[status] || '';
};

const getUniversityType = (universityId: string) => {
  const university = universitiesStore.universities.find(u => {
    const id = u.id || u._id;
    return id === universityId;
  });
  
  if (!university) return 'private';
  
  const type = (university.type || '').toLowerCase();
  return type.includes('public') || type.includes('pública') ? 'public' : 'private';
};

// ============ MÉTODOS PRINCIPALES ============

const voteHelpful = async (isHelpful: boolean) => {
  if (isVoting.value || hasVoted.value) return;
  
  isVoting.value = true;
  
  try {
    reviewsStore.voteHelpful(props.review.id, isHelpful);
    userVote.value = isHelpful ? 'helpful' : 'not-helpful';
    hasVoted.value = true;
    
    // Guardar en localStorage para persistencia
    localStorage.setItem(`vote_${props.review.id}`, userVote.value);
  } catch (error) {
    console.error('Error al votar:', error);
  } finally {
    isVoting.value = false;
  }
};

const shareReview = () => {
  const shareText = `Reseña de ${props.entityName} en EstudiarApp: "${props.review.title}"`;
  const shareUrl = `${window.location.origin}/review/${props.review.id}`;
  
  if (navigator.share) {
    navigator.share({
      title: `Reseña de ${props.entityName}`,
      text: shareText,
      url: shareUrl,
    });
  } else {
    // Fallback: copiar al portapapeles
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      .then(() => {
        alert('Enlace copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  }
};

const editReview = () => {
  if (!canEditReview.value) {
    alert('Esta reseña no puede ser editada porque ya fue publicada.');
    return;
  }
  emit('edit', props.review);
  closeModal();
};

const deleteReview = () => {
  if (confirm('¿Estás seguro de que quieres eliminar esta reseña? Esta acción no se puede deshacer.')) {
    emit('delete', props.review);
    closeModal();
  }
};

const reportReview = () => {
  const reasons = [
    'Contenido inapropiado',
    'Información falsa',
    'Spam o publicidad',
    'Acoso o discurso de odio',
    'Otro motivo',
  ];
  
  const reason = prompt(
    '¿Por qué quieres reportar esta reseña?\n\n' + 
    reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')
  );
  
  if (reason) {
    // En producción, enviar reporte al backend
    console.log('Reportando reseña:', { reviewId: props.review.id, reason });
    alert('Gracias por tu reporte. Revisaremos esta reseña pronto.');
  }
};

const viewEntityDetails = () => {
  closeModal();
  
  if (props.review.entityType === 'university') {
    router.push(`/university/${props.review.entityId}`);
  } else {
    // Para programas, navegar a la universidad que lo contiene
    // Esto sería más complejo en producción
    router.push('/');
  }
};

const closeModal = () => {
  emit('close');
};

// ============ LIFECYCLE ============

onMounted(() => {
  // Verificar si el usuario ya votó esta reseña
  const savedVote = localStorage.getItem(`vote_${props.review.id}`);
  if (savedVote) {
    userVote.value = savedVote as 'helpful' | 'not-helpful';
    hasVoted.value = true;
  }
});
</script>

<style scoped>
.review-detail-modal {
  background: white;
  border-radius: 12px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Header del modal */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.modal-close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

/* Contenido del modal */
.modal-content {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* Sección de información de la entidad */
.entity-info-section {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.entity-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.entity-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.entity-details {
  flex: 1;
  min-width: 300px;
}

.entity-details h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.entity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.entity-type {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.entity-location {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.entity-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  min-width: 200px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Sección de detalles de la reseña */
.review-details-section {
  padding: 1.5rem;
}

/* Header de la reseña */
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.reviewer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.reviewer-avatar img {
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
  font-size: 1.5rem;
}

.reviewer-details {
  flex: 1;
}

.reviewer-details h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.review-date,
.study-year,
.graduation-year {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.review-rating-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  min-width: 150px;
}

.rating-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.stars {
  display: flex;
  gap: 0.1rem;
  font-size: 1.5rem;
  color: #FFD700;
}

.rating-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.review-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-approved {
  background: #4CAF50;
  color: white;
}

.status-pending {
  background: #FF9800;
  color: white;
}

.status-rejected {
  background: #f44336;
  color: white;
}

/* Contenido de la reseña */
.review-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.review-title {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.4rem;
  line-height: 1.3;
}

.review-text {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.review-text p {
  margin: 0;
  color: #333;
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-line;
}

/* Pros y Cons */
.pros-cons-section {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  overflow: hidden;
}

.pros-cons-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.pros-cons-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pros-cons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

@media (max-width: 768px) {
  .pros-cons-grid {
    grid-template-columns: 1fr;
  }
}

.pros-column,
.cons-column {
  padding: 1.5rem;
}

.pros-column {
  border-right: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .pros-column {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-header.positive .section-icon {
  color: #4CAF50;
}

.section-header.negative .section-icon {
  color: #f44336;
}

.section-header h5 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.section-icon {
  font-size: 1.5rem;
}

.pros-list,
.cons-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pro-item,
.con-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.pro-item:hover,
.con-item:hover {
  transform: translateX(4px);
}

.pro-item {
  border-left: 3px solid #4CAF50;
}

.con-item {
  border-left: 3px solid #f44336;
}

.check-icon {
  color: #4CAF50;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.cross-icon {
  color: #f44336;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.pro-item span:last-child,
.con-item span:last-child {
  color: #333;
  line-height: 1.4;
}

/* Recomendación */
.recommendation-section {
  margin-top: 1rem;
}

.recommendation-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: #f8f9fa;
  border: 2px solid transparent;
}

.recommendation-card.recommended {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #4CAF5015 0%, #2E7D3215 100%);
}

.recommendation-card:not(.recommended) {
  border-color: #f44336;
  background: linear-gradient(135deg, #f4433615 0%, #d32f2f15 100%);
}

.recommendation-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recommendation-card.recommended .recommendation-icon {
  color: #4CAF50;
  border: 2px solid #4CAF50;
}

.recommendation-card:not(.recommended) .recommendation-icon {
  color: #f44336;
  border: 2px solid #f44336;
}

.recommendation-content h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.recommendation-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

/* Sección de votos */
.votes-section {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  padding: 1.5rem;
}

.votes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.votes-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.helpful-score {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
}

.votes-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.vote-meter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meter-bar {
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
}

.helpful-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #2E7D32);
  transition: width 0.5s ease-in-out;
}

.not-helpful-fill {
  height: 100%;
  background: linear-gradient(90deg, #f44336, #d32f2f);
  transition: width 0.5s ease-in-out;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.helpful-label {
  color: #4CAF50;
  font-weight: 500;
}

.not-helpful-label {
  color: #f44336;
  font-weight: 500;
}

.vote-actions {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.vote-actions p {
  margin: 0 0 1rem 0;
  color: #333;
  font-weight: 500;
}

.vote-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.vote-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.vote-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-btn.helpful {
  background: #4CAF50;
  color: white;
}

.vote-btn.not-helpful {
  background: #f44336;
  color: white;
}

.vote-thanks {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #4CAF5015 0%, #2E7D3215 100%);
  border-radius: 12px;
  color: #4CAF50;
  font-weight: 500;
}

.thanks-icon {
  font-size: 1.5rem;
}

/* Respuesta de la universidad */
.university-reply-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border-left: 4px solid #2196F3;
  padding: 1.5rem;
  margin-top: 1rem;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.reply-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reply-title {
  flex: 1;
}

.reply-title h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1.1rem;
}

.reply-date {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reply-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.reply-content p {
  margin: 0;
  color: #333;
  line-height: 1.5;
  white-space: pre-line;
}

/* Información adicional */
.additional-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.info-value {
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
  word-break: break-all;
}

/* Footer del modal */
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background: white;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.action-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140px;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  opacity: 0.9;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.share {
  background: #2196F3;
  color: white;
}

.action-btn.edit {
  background: #FF9800;
  color: white;
}

.action-btn.delete {
  background: #f44336;
  color: white;
}

.action-btn.report {
  background: #9C27B0;
  color: white;
}

.action-btn.view-entity {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.close-btn {
  width: 100%;
  padding: 0.75rem;
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
  border-color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .entity-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .entity-stats {
    width: 100%;
  }
  
  .review-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .review-rating-display {
    align-items: stretch;
  }
  
  .rating-badge {
    align-items: center;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .reviewer-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .reviewer-avatar {
    align-self: center;
  }
  
  .vote-buttons {
    flex-direction: column;
  }
  
  .vote-btn {
    width: 100%;
  }
}
</style>