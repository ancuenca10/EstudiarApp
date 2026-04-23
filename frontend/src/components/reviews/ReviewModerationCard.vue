<!-- src/components/reviews/ReviewModerationCard.vue -->
<template>
  <div class="moderation-card" :class="`status-${review.status}`">
    <!-- Encabezado de moderación -->
    <div class="moderation-header">
      <div class="review-meta">
        <div class="status-badge" :class="`status-${review.status}`">
          {{ getStatusText(review.status) }}
        </div>
        <div class="review-id">ID: {{ review.id.substring(0, 8) }}</div>
      </div>
      
      <div class="moderation-meta">
        <span class="date">{{ formatDate(review.createdAt) }}</span>
        <span v-if="review.reports && review.reports.length > 0" class="reports-count">
          🚨 {{ review.reports.length }} reporte{{ review.reports.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Información del usuario -->
    <div class="user-section">
      <div class="user-info">
        <img 
          :src="review.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.userName" 
          :alt="review.userName"
          class="user-avatar"
        />
        <div class="user-details">
          <h4>{{ review.userName }}</h4>
          <div class="user-stats">
            <span v-if="review.isVerifiedStudent" class="verified-badge">
              ✅ Estudiante verificado
            </span>
            <span class="program-link" @click="$emit('view-program', review.programId)">
              📚 Ver programa
            </span>
          </div>
        </div>
      </div>
      
      <div class="review-rating">
        <div class="rating-stars">
          <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">
            ★
          </span>
        </div>
        <div class="helpful-stats">
          <span class="helpful-count">👍 {{ review.helpfulCount }}</span>
          <span class="not-helpful-count">👎 {{ review.notHelpfulCount }}</span>
        </div>
      </div>
    </div>

    <!-- Contenido de la reseña -->
    <div class="review-content">
      <h5 class="review-title">{{ review.title }}</h5>
      <p class="review-text">{{ review.content }}</p>
      
      <!-- Pros y Cons -->
      <div v-if="review.pros.length > 0 || review.cons.length > 0" class="pros-cons">
        <div v-if="review.pros.length > 0" class="pros">
          <strong>✅ Puntos positivos:</strong>
          <ul>
            <li v-for="(pro, index) in review.pros" :key="`pro-${index}`">{{ pro }}</li>
          </ul>
        </div>
        <div v-if="review.cons.length > 0" class="cons">
          <strong>❌ Puntos a mejorar:</strong>
          <ul>
            <li v-for="(con, index) in review.cons" :key="`con-${index}`">{{ con }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Recomendación -->
      <div class="recommendation">
        <span class="recommendation-icon">{{ review.wouldRecommend ? '👍' : '👎' }}</span>
        <span>{{ review.wouldRecommend ? 'Recomienda el programa' : 'No recomienda el programa' }}</span>
      </div>
    </div>

    <!-- Reportes -->
    <div v-if="review.reports && review.reports.length > 0" class="reports-section">
      <h6>🚨 Reportes:</h6>
      <div v-for="(report, index) in review.reports.slice(0, 3)" :key="index" class="report-item">
        <div class="report-reason">{{ report.reason }}</div>
        <div class="report-date">{{ formatDate(report.date) }}</div>
      </div>
      <div v-if="review.reports.length > 3" class="more-reports">
        +{{ review.reports.length - 3 }} reportes más...
      </div>
    </div>

    <!-- Acciones de moderación -->
    <div class="moderation-actions">
      <div class="action-buttons">
        <button 
          v-if="review.status === 'pending' || review.status === 'reported'"
          @click="$emit('approve', review.id)"
          class="action-btn approve-btn"
        >
          ✅ Aprobar
        </button>
        
        <button 
          v-if="review.status === 'pending' || review.status === 'reported'"
          @click="handleReject"
          class="action-btn reject-btn"
        >
          ❌ Rechazar
        </button>
        
        <button 
          v-if="review.status === 'approved'"
          @click="$emit('reject', review.id)"
          class="action-btn disable-btn"
        >
          🚫 Desactivar
        </button>
        
        <button 
          v-if="review.status === 'rejected'"
          @click="$emit('approve', review.id)"
          class="action-btn enable-btn"
        >
          🔄 Re-activar
        </button>
        
        <button 
          @click="$emit('view-context', review.id)"
          class="action-btn view-btn"
        >
          👁️ Ver contexto
        </button>
      </div>
      
      <div class="action-info">
        <span v-if="review.updatedAt" class="last-updated">
          Última modificación: {{ formatDate(review.updatedAt) }}
        </span>
        <span v-if="review.universityReply" class="has-reply">
          💬 Tiene respuesta
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import type { Review } from '@/types/reviews';

const props = defineProps<{
  review: Review;
}>();

const emit = defineEmits(['approve', 'reject', 'view-program', 'view-context']);

const authStore = useAuthStore();

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pending': 'Pendiente',
    'approved': 'Aprobada',
    'rejected': 'Rechazada',
    'reported': 'Reportada',
  };
  return texts[status] || status;
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleReject = () => {
  const reason = prompt('Motivo del rechazo:');
  if (reason && reason.trim()) {
    emit('reject', props.review.id, reason);
  }
};
</script>

<style scoped>
.moderation-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.moderation-card.status-pending {
  border-color: #fbbf24;
  background: #fffbeb;
}

.moderation-card.status-reported {
  border-color: #ef4444;
  background: #fef2f2;
}

.moderation-card.status-approved {
  border-color: #10b981;
  background: #f0fdf4;
}

.moderation-card.status-rejected {
  border-color: #6b7280;
  background: #f9fafb;
  opacity: 0.8;
}

.moderation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-pending {
  background: #fbbf24;
  color: #92400e;
}

.status-badge.status-reported {
  background: #ef4444;
  color: white;
}

.status-badge.status-approved {
  background: #10b981;
  color: white;
}

.status-badge.status-rejected {
  background: #6b7280;
  color: white;
}

.review-id {
  font-family: monospace;
  color: #6b7280;
  font-size: 0.875rem;
}

.moderation-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.date {
  color: #6b7280;
}

.reports-count {
  color: #dc2626;
  font-weight: 600;
}

/* Información del usuario */
.user-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.user-details h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.verified-badge {
  color: #059669;
  font-weight: 500;
}

.program-link {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: underline;
}

.program-link:hover {
  color: #1d4ed8;
}

/* Rating */
.review-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.rating-stars {
  font-size: 1.25rem;
}

.rating-stars .star {
  color: #d1d5db;
}

.rating-stars .star.filled {
  color: #fbbf24;
}

.helpful-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Contenido de la reseña */
.review-content {
  margin-bottom: 1.5rem;
}

.review-title {
  margin: 0 0 0.75rem 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
}

.review-text {
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.5;
  white-space: pre-line;
}

.pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.pros ul,
.cons ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
}

.pros li,
.cons li {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4b5563;
}

.recommendation-icon {
  font-size: 1rem;
}

/* Reportes */
.reports-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.reports-section h6 {
  margin: 0 0 0.75rem 0;
  color: #dc2626;
  font-size: 0.875rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.report-reason {
  flex: 1;
  font-size: 0.875rem;
  color: #7f1d1d;
}

.report-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.more-reports {
  text-align: center;
  font-size: 0.875rem;
  color: #dc2626;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Acciones de moderación */
.moderation-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #d1fae5;
  border-color: #10b981;
  color: #065f46;
}

.approve-btn:hover {
  background: #a7f3d0;
}

.reject-btn {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.reject-btn:hover {
  background: #fecaca;
}

.disable-btn {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.enable-btn {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.view-btn {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #4b5563;
}

.view-btn:hover {
  background: #e5e7eb;
}

.action-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.last-updated {
  font-style: italic;
}

.has-reply {
  color: #3b82f6;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .moderation-header,
  .user-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .moderation-meta {
    align-items: flex-start;
  }
  
  .review-rating {
    align-items: flex-start;
  }
  
  .pros-cons {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    text-align: center;
  }
}
</style>