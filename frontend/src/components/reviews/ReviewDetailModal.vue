<template>
  <section class="review-detail">
    <header class="modal-header">
      <div>
        <p class="eyebrow">{{ review.entityType === 'university' ? 'Universidad' : 'Programa' }}</p>
        <h2>{{ entityName }}</h2>
      </div>
      <button type="button" class="icon-btn" aria-label="Cerrar" @click="emit('close')">
        x
      </button>
    </header>

    <div class="review-body">
      <div class="review-title-row">
        <h3>{{ review.title }}</h3>
        <span class="status" :class="review.status">{{ statusLabel }}</span>
      </div>

      <div class="rating" aria-label="Calificacion">
        <span v-for="star in 5" :key="star">
          {{ star <= review.rating ? '★' : '☆' }}
        </span>
        <strong>{{ review.rating }}/5</strong>
      </div>

      <p class="content">{{ review.content }}</p>

      <div class="meta-grid">
        <div>
          <dt>Autor</dt>
          <dd>{{ review.userName }}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{{ formattedDate }}</dd>
        </div>
        <div>
          <dt>Utilidad</dt>
          <dd>{{ review.helpfulCount }} utiles / {{ review.notHelpfulCount }} no utiles</dd>
        </div>
        <div>
          <dt>Recomendacion</dt>
          <dd>{{ review.wouldRecommend ? 'Si recomendaria' : 'No recomendaria' }}</dd>
        </div>
      </div>

      <div v-if="review.pros.length || review.cons.length" class="pros-cons">
        <div v-if="review.pros.length">
          <h4>Ventajas</h4>
          <ul>
            <li v-for="pro in review.pros" :key="pro">{{ pro }}</li>
          </ul>
        </div>
        <div v-if="review.cons.length">
          <h4>Desventajas</h4>
          <ul>
            <li v-for="con in review.cons" :key="con">{{ con }}</li>
          </ul>
        </div>
      </div>

      <div v-if="review.universityReply" class="reply">
        <h4>Respuesta de la universidad</h4>
        <p>{{ review.universityReply }}</p>
      </div>
    </div>

    <footer class="actions">
      <button type="button" class="btn-secondary" @click="emit('close')">
        Cerrar
      </button>
      <button type="button" class="btn-secondary" @click="emit('edit', review)">
        Editar
      </button>
      <button type="button" class="btn-danger" @click="emit('delete', review)">
        Eliminar
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Review } from '@/types/reviews';

const props = defineProps<{
  review: Review;
  entityName?: string;
}>();

const emit = defineEmits<{
  close: [];
  edit: [review: Review];
  delete: [review: Review];
}>();

const entityName = computed(() => props.entityName || 'Entidad sin nombre');

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(props.review.createdAt));
});

const statusLabel = computed(() => {
  const labels: Record<Review['status'], string> = {
    approved: 'Aprobada',
    pending: 'Pendiente',
    rejected: 'Rechazada',
  };

  return labels[props.review.status];
});
</script>

<style scoped>
.review-detail {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}

.modal-header {
  border-bottom: 1px solid #e5e7eb;
}

.eyebrow {
  margin: 0 0 4px;
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

h2,
h3,
h4 {
  margin: 0;
  color: #111827;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
}

.review-body {
  padding: 24px;
}

.review-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.status {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 14px 0;
  color: #f59e0b;
}

.rating strong {
  margin-left: 8px;
  color: #374151;
}

.content {
  color: #4b5563;
  line-height: 1.6;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

dt {
  color: #6b7280;
  font-size: 0.78rem;
}

dd {
  margin: 4px 0 0;
  color: #111827;
  font-weight: 700;
}

.pros-cons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.pros-cons > div,
.reply {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

ul {
  margin: 12px 0 0;
  padding-left: 18px;
}

.reply {
  margin-top: 20px;
}

.reply p {
  margin-bottom: 0;
}

.actions {
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-danger {
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-secondary {
  background: #eef2ff;
  color: #3949ab;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 640px) {
  .modal-header,
  .review-title-row,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .meta-grid,
  .pros-cons {
    grid-template-columns: 1fr;
  }
}
</style>
