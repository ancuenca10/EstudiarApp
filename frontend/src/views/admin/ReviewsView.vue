<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Gestion administrativa</p>
        <h1>Gestionar resenas</h1>
        <p>{{ isAsesor ? 'Modera resenas pendientes con aprobacion o rechazo.' : 'Modera, edita y elimina opiniones publicadas por usuarios.' }}</p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="router.push('/admin')">Volver al panel</button>
        <button class="ghost-btn" type="button" @click="reviewsStore.fetchAdminReviews()">Refrescar</button>
        <button v-if="canEditReviews" class="primary-btn" type="button" @click="openCreateModal">Crear resena</button>
      </div>
    </header>

    <section class="toolbar">
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por usuario, titulo, contenido o referencia"
      />
      <select v-model="statusFilter">
        <option value="all">Todas</option>
        <option value="pending">Pendientes</option>
        <option value="approved">Aprobadas</option>
        <option value="rejected">Rechazadas</option>
      </select>
    </section>

    <p v-if="reviewsStore.error" class="feedback error">{{ reviewsStore.error }}</p>
    <p v-if="reviewsStore.loading" class="feedback">Cargando resenas...</p>

    <section class="table-panel">
      <table v-if="filteredReviews.length">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Referencia</th>
            <th>Rating</th>
            <th>Contenido</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in filteredReviews" :key="review.id">
            <td>{{ review.userName }}</td>
            <td>
              <strong>{{ review.referenciaNombre || review.entityId }}</strong>
              <small>{{ review.entityType === 'program' ? 'Programa' : 'Universidad' }}</small>
            </td>
            <td>
              <span class="stars">{{ stars(review.rating) }}</span>
              <small>{{ review.rating }}/5</small>
            </td>
            <td>
              <strong>{{ review.title || 'Sin titulo' }}</strong>
              <small>{{ truncate(review.content, 90) }}</small>
            </td>
            <td>
              <span class="status" :class="review.status">{{ statusLabel(review.status) }}</span>
            </td>
            <td>{{ formatDate(review.createdAt) }}</td>
            <td>
              <div class="row-actions">
                <button type="button" @click="openDetail(review)">Ver</button>
                <button v-if="canEditReviews" type="button" @click="openEditModal(review)">Editar</button>
                <button
                  v-if="review.status !== 'approved'"
                  type="button"
                  @click="changeStatus(review.id, 'approved')"
                >
                  Aprobar
                </button>
                <button
                  v-if="review.status !== 'rejected'"
                  type="button"
                  @click="changeStatus(review.id, 'rejected')"
                >
                  Rechazar
                </button>
                <button v-if="canDeleteContent" class="danger" type="button" @click="deleteReview(review.id)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <h3>No hay resenas para mostrar</h3>
        <p>Cambia los filtros o crea una resena de prueba.</p>
      </div>
    </section>

    <section v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="saveReview">
        <header>
          <h2>{{ modalMode === 'create' ? 'Crear resena' : modalMode === 'edit' ? 'Editar resena' : 'Detalle de resena' }}</h2>
          <button type="button" class="icon-btn" @click="closeModal">x</button>
        </header>

        <label>
          Tipo
          <select v-model="form.entityType" :disabled="modalMode === 'detail'">
            <option value="university">Universidad</option>
            <option value="program">Programa</option>
          </select>
        </label>

        <label>
          ID de referencia
          <input v-model.trim="form.entityId" :disabled="modalMode === 'detail' || modalMode === 'edit'" required />
        </label>

        <label>
          Rating
          <input v-model.number="form.rating" type="number" min="1" max="5" :disabled="modalMode === 'detail'" required />
        </label>

        <label>
          Titulo
          <input v-model.trim="form.title" :disabled="modalMode === 'detail'" />
        </label>

        <label>
          Contenido
          <textarea v-model.trim="form.content" rows="5" :disabled="modalMode === 'detail'" required />
        </label>

        <label>
          Pros
          <input v-model.trim="prosInput" :disabled="modalMode === 'detail'" placeholder="Separados por coma" />
        </label>

        <label>
          Contras
          <input v-model.trim="consInput" :disabled="modalMode === 'detail'" placeholder="Separados por coma" />
        </label>

        <div class="modal-actions">
          <button type="button" class="ghost-btn" @click="closeModal">Cancelar</button>
          <button v-if="modalMode !== 'detail'" type="submit" class="primary-btn">
            {{ modalMode === 'create' ? 'Crear' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { useAuthStore } from '@/stores/auth';
import { useReviewsStore } from '@/stores/reviews';
import type { Review } from '@/types/reviews';

type ModalMode = 'create' | 'edit' | 'detail';

const router = useRouter();
const reviewsStore = useReviewsStore();
const authStore = useAuthStore();

const search = ref('');
const statusFilter = ref<'all' | Review['status']>('all');
const showModal = ref(false);
const modalMode = ref<ModalMode>('create');
const selectedReviewId = ref('');
const prosInput = ref('');
const consInput = ref('');
const isAsesor = computed(() => authStore.user?.role?.toUpperCase() === 'ASESOR');
const canEditReviews = computed(() => ['ADMIN', 'SUPERADMIN'].includes(authStore.user?.role?.toUpperCase() || ''));
const canDeleteContent = canEditReviews;

const form = reactive({
  entityId: '',
  entityType: 'university' as Review['entityType'],
  rating: 5,
  title: '',
  content: '',
});

const filteredReviews = computed(() => {
  const query = search.value.trim().toLowerCase();
  return reviewsStore.allReviews.filter((review) => {
    const matchesStatus = statusFilter.value === 'all' || review.status === statusFilter.value;
    const matchesSearch = !query ||
      review.userName.toLowerCase().includes(query) ||
      review.title.toLowerCase().includes(query) ||
      review.content.toLowerCase().includes(query) ||
      (review.referenciaNombre || '').toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });
});

const resetForm = () => {
  selectedReviewId.value = '';
  form.entityId = '';
  form.entityType = 'university';
  form.rating = 5;
  form.title = '';
  form.content = '';
  prosInput.value = '';
  consInput.value = '';
};

const fillForm = (review: Review) => {
  selectedReviewId.value = review.id;
  form.entityId = review.entityId;
  form.entityType = review.entityType;
  form.rating = review.rating;
  form.title = review.title;
  form.content = review.content;
  prosInput.value = review.pros.join(', ');
  consInput.value = review.cons.join(', ');
};

const openCreateModal = () => {
  resetForm();
  modalMode.value = 'create';
  showModal.value = true;
};

const openEditModal = (review: Review) => {
  fillForm(review);
  modalMode.value = 'edit';
  showModal.value = true;
};

const openDetail = (review: Review) => {
  fillForm(review);
  modalMode.value = 'detail';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const splitList = (value: string) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const saveReview = async () => {
  const payload = {
    entityId: form.entityId,
    entityType: form.entityType,
    rating: form.rating,
    title: form.title,
    content: form.content,
    pros: splitList(prosInput.value),
    cons: splitList(consInput.value),
    wouldRecommend: form.rating >= 4,
  };

  if (modalMode.value === 'create') {
    await reviewsStore.createReview(payload);
  } else if (selectedReviewId.value) {
    await reviewsStore.updateReview(selectedReviewId.value, payload);
  }

  closeModal();
};

const changeStatus = async (reviewId: string, status: Review['status']) => {
  await reviewsStore.changeReviewStatus(reviewId, status);
};

const deleteReview = async (reviewId: string) => {
  if (!confirm('Eliminar esta resena permanentemente?')) return;
  await reviewsStore.deleteReview(reviewId);
};

const stars = (rating: number) => `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;

const truncate = (value: string, max = 80) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const statusLabel = (status: Review['status']) => {
  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    reported: 'Reportada',
  };
  return labels[status];
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(date));

onMounted(() => {
  reviewsStore.fetchAdminReviews();
});
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.page-header,
.header-actions,
.toolbar,
.row-actions,
.modal-actions {
  display: flex;
  gap: 12px;
}

.page-header {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
p {
  margin-top: 0;
}

.toolbar {
  margin-bottom: 16px;
}

.toolbar input,
.toolbar select,
.modal input,
.modal select,
.modal textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 12px;
}

.toolbar input {
  flex: 1;
}

.table-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
  vertical-align: top;
}

small {
  color: #64748b;
  display: block;
}

.stars {
  color: #d97706;
  white-space: nowrap;
}

.status {
  border-radius: 999px;
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 4px 8px;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.ghost-btn,
.primary-btn,
.row-actions button,
.icon-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 12px;
}

.ghost-btn,
.row-actions button,
.icon-btn {
  background: #e2e8f0;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.row-actions {
  flex-wrap: wrap;
}

.row-actions .danger {
  background: #fee2e2;
  color: #991b1b;
}

.feedback,
.empty-state {
  padding: 16px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.modal-backdrop {
  align-items: center;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 20px;
  position: fixed;
  z-index: 50;
}

.modal {
  background: #fff;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  max-width: 560px;
  padding: 20px;
  width: 100%;
}

.modal header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.modal label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

.modal-actions {
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .page-header,
  .header-actions,
  .toolbar {
    flex-direction: column;
  }
}
</style>
