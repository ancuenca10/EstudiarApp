<template>
  <Transition name="modal">
    <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <h2>{{ modalTitle }}</h2>
            <div class="modal-subtitle">
              <span v-if="stats.totalReviews > 0">
                {{ stats.averageRating.toFixed(1) }} · {{ stats.totalReviews }} reseñas
              </span>
              <span v-else>
                Aún no hay reseñas
              </span>
            </div>
          </div>
          <button @click="closeModal" class="close-btn" aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="tabs">
            <button 
              @click="activeTab = 'write'"
              :class="{ active: activeTab === 'write' }"
              class="tab-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Escribir reseña
            </button>
            <button 
              @click="activeTab = 'read'"
              :class="{ active: activeTab === 'read' }"
              class="tab-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              Ver reseñas
            </button>
          </div>

          <div class="tab-content">
            <div v-if="activeTab === 'write'" class="write-review">
              <ReviewForm 
                :entityId="entityId"
                :entityType="entityType"
                @submit="handleReviewSubmit"
                @cancel="closeModal"
              />
            </div>

            <div v-else class="read-reviews">
              <ReviewList 
                :entityId="entityId"
                :entityType="entityType"
                @edit="handleEditReview"
                @load-more="handleLoadMore"
              />
            </div>
          </div>
        </div>

        <div v-if="showSuccessMessage" class="success-message">
          <div class="success-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="success-title">¡Reseña enviada con éxito!</p>
              <p class="success-text">Tu reseña será publicada después de la moderación.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import ReviewForm from './ReviewForm.vue';
import ReviewList from './ReviewList.vue';
import type { ReviewFormData, Review } from '@/types/reviews';

interface Props {
  isVisible: boolean;
  entityId: string;
  entityType: 'university' | 'program';
  entityName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const reviewsStore = useReviewsStore();
const activeTab = ref<'write' | 'read'>('write');
const showSuccessMessage = ref(false);
const isSubmitting = ref(false);

// Computed
const stats = computed(() => {
  return reviewsStore.getReviewStats(props.entityId, props.entityType);
});

const modalTitle = computed(() => {
  const type = props.entityType === 'university' ? 'Universidad' : 'Programa';
  return `Reseñas de ${type}${props.entityName ? `: ${props.entityName}` : ''}`;
});

// Métodos
const closeModal = () => {
  emit('close');
  // Resetear después de cerrar
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 300);
};

const handleReviewSubmit = async (reviewData: ReviewFormData) => {
  try {
    isSubmitting.value = true;
    
    // Añadir la reseña al store
    reviewsStore.addReview({
      ...reviewData,
      userId: 'current-user',
      userName: 'Tú',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
      isVerifiedStudent: true,
    });

    // Mostrar mensaje de éxito
    showSuccessMessage.value = true;
    
    // Cambiar a la pestaña de leer reseñas después de 2 segundos
    setTimeout(() => {
      activeTab.value = 'read';
      showSuccessMessage.value = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error al enviar la reseña:', error);
    alert('Hubo un error al enviar tu reseña. Por favor, intenta de nuevo.');
  } finally {
    isSubmitting.value = false;
  }
};

const handleEditReview = (review: Review) => {
  // Implementar lógica de edición
  console.log('Editar reseña:', review);
  activeTab.value = 'write';
};

const handleLoadMore = () => {
  // Implementar carga paginada
  console.log('Cargar más reseñas');
};

// Cambiar a la pestaña de lectura si ya hay reseñas
watch(() => props.isVisible, (visible) => {
  if (visible && stats.value.totalReviews > 0) {
    activeTab.value = 'read';
  } else if (visible) {
    activeTab.value = 'write';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
}

.close-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.close-btn svg {
  width: 1.5rem;
  height: 1.5rem;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: white;
}

.tab-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 2;
}

.tab-content {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.write-review,
.read-reviews {
  animation: fadeIn 0.3s ease-out;
}

.success-message {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin: 1.5rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.success-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.success-content svg {
  color: #10b981;
  flex-shrink: 0;
}

.success-title {
  margin: 0;
  font-weight: 500;
  color: #065f46;
  font-size: 0.95rem;
}

.success-text {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #047857;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
    margin: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-title h2 {
    font-size: 1.25rem;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
    padding: 0.875rem 1rem;
  }
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>