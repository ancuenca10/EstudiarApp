<!-- src/components/reviews/ReviewForm.vue -->
<template>
  <div class="review-form">
    <div class="form-header">
      <h3>✍️ Escribir reseña</h3>
      <p v-if="entityName">Sobre: {{ entityName }}</p>
      <p v-if="entityType === 'university'">🏛️ Universidad</p>
      <p v-else>📚 Programa académico</p>
    </div>

    <!-- Calificación -->
    <div class="form-section">
      <label class="form-label">Calificación general *</label>
      <RatingStars 
        v-model="formData.rating" 
        :readonly="false"
        class="rating-input"
      />
      <div class="rating-labels">
        <span>Malo</span>
        <span>Excelente</span>
      </div>
    </div>

    <!-- Título -->
    <div class="form-section">
      <label for="review-title" class="form-label">Título de la reseña *</label>
      <input
        id="review-title"
        v-model="formData.title"
        type="text"
        placeholder="Ej: Excelente universidad con buenas instalaciones"
        required
        maxlength="100"
        class="form-input"
      />
      <div class="char-count">{{ formData.title.length }}/100</div>
    </div>

    <!-- Experiencia detallada -->
    <div class="form-section">
      <label for="review-content" class="form-label">Tu experiencia detallada *</label>
      <textarea
        id="review-content"
        v-model="formData.content"
        placeholder="Comparte tu experiencia personal..."
        rows="4"
        required
        maxlength="1000"
        class="form-textarea"
      ></textarea>
      <div class="char-count">{{ formData.content.length }}/1000</div>
    </div>

    <!-- Pros y Cons -->
    <div class="form-grid">
      <div class="form-section">
        <label class="form-label">Puntos positivos</label>
        <p class="form-help">¿Qué te gustó más?</p>
        <div v-for="(pro, index) in formData.pros" :key="`pro-${index}`" class="pro-con-item">
          <input
            v-model="formData.pros[index]"
            type="text"
            :placeholder="`Punto positivo ${index + 1}`"
            maxlength="100"
            class="form-input"
          />
          <button
            type="button"
            @click="removeItem('pros', index)"
            class="remove-btn"
            :aria-label="`Eliminar punto positivo ${index + 1}`"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          @click="addItem('pros')"
          class="add-btn"
          v-if="formData.pros.length < 5"
        >
          + Añadir punto positivo
        </button>
      </div>

      <div class="form-section">
        <label class="form-label">Puntos a mejorar</label>
        <p class="form-help">¿Qué podría mejorar?</p>
        <div v-for="(con, index) in formData.cons" :key="`con-${index}`" class="pro-con-item">
          <input
            v-model="formData.cons[index]"
            type="text"
            :placeholder="`Punto a mejorar ${index + 1}`"
            maxlength="100"
            class="form-input"
          />
          <button
            type="button"
            @click="removeItem('cons', index)"
            class="remove-btn"
            :aria-label="`Eliminar punto a mejorar ${index + 1}`"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          @click="addItem('cons')"
          class="add-btn"
          v-if="formData.cons.length < 5"
        >
          + Añadir punto a mejorar
        </button>
      </div>
    </div>

    <!-- Opciones -->
    <div class="form-section">
      <div class="form-options">
        <label class="form-checkbox">
          <input type="checkbox" v-model="formData.wouldRecommend" />
          <span class="checkbox-label">
            <span class="checkbox-icon">👍</span>
            <span>Recomendaría este {{ entityType === 'university' ? 'universidad' : 'programa' }}</span>
          </span>
        </label>
        
        <label class="form-checkbox">
          <input type="checkbox" v-model="formData.isVerifiedStudent" />
          <span class="checkbox-label">
            <span class="checkbox-icon">✅</span>
            <span>Soy {{ entityType === 'university' ? 'estudiante o egresado de esta universidad' : 'estudiante actual o egresado de este programa' }}</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Validación -->
    <div v-if="errors.length > 0" class="error-messages">
      <div v-for="(error, index) in errors" :key="index" class="error-message">
        ⚠️ {{ error }}
      </div>
    </div>

    <!-- Acciones -->
    <div class="form-actions">
      <button
        type="button"
        @click="$emit('cancel')"
        class="cancel-btn"
      >
        Cancelar
      </button>
      <button
        type="button"
        @click="handleSubmit"
        :disabled="isSubmitting || errors.length > 0"
        class="submit-btn"
      >
        <span v-if="isSubmitting" class="spinner"></span>
        {{ isSubmitting ? 'Enviando...' : 'Publicar reseña' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { ReviewFormData } from '@/types/reviews';
import RatingStars from '../RatingStars.vue';

const props = defineProps<{
  entityId: string;
  entityType: 'university' | 'program';
  entityName?: string;
}>();

const emit = defineEmits(['submit', 'cancel']);

const authStore = useAuthStore();

// Estado del formulario
const formData = ref<ReviewFormData>({
  rating: 5,
  title: '',
  content: '',
  pros: ['', ''],
  cons: [''],
  wouldRecommend: true,
  isVerifiedStudent: false,
});

const isSubmitting = ref(false);
const errors = ref<string[]>([]);

// Validación en tiempo real
watch(formData, () => {
  validateForm();
}, { deep: true });

// Métodos
const addItem = (type: 'pros' | 'cons') => {
  if (formData.value[type].length < 5) {
    formData.value[type].push('');
  }
};

const removeItem = (type: 'pros' | 'cons', index: number) => {
  if (formData.value[type].length > 1) {
    formData.value[type].splice(index, 1);
  } else {
    formData.value[type][0] = '';
  }
};

const validateForm = () => {
  errors.value = [];

  if (!authStore.isAuthenticated) {
    errors.value.push('Debes iniciar sesión para escribir una reseña');
  }

  if (formData.value.title.trim().length < 5) {
    errors.value.push('El título debe tener al menos 5 caracteres');
  }

  if (formData.value.content.trim().length < 20) {
    errors.value.push('La descripción debe tener al menos 20 caracteres');
  }

  if (formData.value.rating === 0) {
    errors.value.push('Por favor selecciona una calificación');
  }

  // Filtrar pros y cons vacíos
  const validPros = formData.value.pros.filter(pro => pro.trim().length > 0);
  const validCons = formData.value.cons.filter(con => con.trim().length > 0);

  if (validPros.length === 0 && validCons.length === 0) {
    errors.value.push('Por favor ingresa al menos un punto positivo o a mejorar');
  }
};

const handleSubmit = async () => {
  validateForm();

  if (errors.value.length > 0) {
    return;
  }

  isSubmitting.value = true;

  try {
    const user = authStore.user;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Preparar datos
    const reviewData = {
      entityId: props.entityId,
      entityType: props.entityType,
      userId: user.id,
      userName: user.username || 'Usuario',
      rating: formData.value.rating,
      title: formData.value.title.trim(),
      content: formData.value.content.trim(),
      pros: formData.value.pros.filter(p => p.trim().length > 0),
      cons: formData.value.cons.filter(c => c.trim().length > 0),
      wouldRecommend: formData.value.wouldRecommend,
      isVerifiedStudent: formData.value.isVerifiedStudent,
    };

    // Emitir evento con los datos
    emit('submit', reviewData);

    // Resetear formulario
    formData.value = {
      rating: 5,
      title: '',
      content: '',
      pros: ['', ''],
      cons: [''],
      wouldRecommend: true,
      isVerifiedStudent: false,
    };

  } catch (error) {
    console.error('Error al enviar reseña:', error);
    errors.value.push('Error al enviar la reseña. Inténtalo nuevamente.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.review-form {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.form-header p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-help {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.rating-input {
  margin-bottom: 0.25rem;
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.pro-con-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.pro-con-item .form-input {
  flex: 1;
}

.remove-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.add-btn {
  width: 100%;
  padding: 0.5rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.add-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #4b5563;
}

.form-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  color: #4b5563;
  font-size: 0.9rem;
}

.form-checkbox input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  border: 2px solid #d1d5db;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.checkbox-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.error-messages {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-message {
  color: #dc2626;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.error-message:last-child {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.submit-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>