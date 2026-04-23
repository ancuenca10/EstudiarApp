<template>
  <form @submit.prevent="handleSubmit" class="review-form" novalidate>
    <div class="form-header">
      <h3>Deja tu reseña</h3>
      <p>Comparte tu experiencia para ayudar a otros estudiantes</p>
    </div>

    <div class="form-section">
      <label class="form-label required">Tu calificación</label>
      <StarRating 
        v-model="formData.rating" 
        :disabled="submitting"
        class="star-rating-large"
      />
      <div v-if="errors.rating" class="error-message">
        {{ errors.rating }}
      </div>
    </div>

    <div class="form-section">
      <label for="review-title" class="form-label required">Título de la reseña</label>
      <input
        id="review-title"
        v-model="formData.title"
        type="text"
        placeholder="Ej: Excelente universidad con profesores capacitados"
        class="form-input"
        :disabled="submitting"
        maxlength="100"
        @blur="validateField('title')"
      >
      <div class="input-footer">
        <div v-if="errors.title" class="error-message">
          {{ errors.title }}
        </div>
        <div class="char-counter">
          {{ formData.title.length }}/100
        </div>
      </div>
    </div>

    <div class="form-section">
      <label for="review-content" class="form-label required">Tu experiencia</label>
      <textarea
        id="review-content"
        v-model="formData.content"
        placeholder="Describe tu experiencia en detalle. ¿Qué te gustó? ¿Qué mejorarías?"
        class="form-textarea"
        :disabled="submitting"
        rows="5"
        maxlength="1000"
        @blur="validateField('content')"
      ></textarea>
      <div class="input-footer">
        <div v-if="errors.content" class="error-message">
          {{ errors.content }}
        </div>
        <div class="char-counter">
          {{ formData.content.length }}/1000
        </div>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">Puntos positivos</label>
      <div class="dynamic-list">
        <div 
          v-for="(item, index) in formData.pros" 
          :key="`pro-${index}`"
          class="list-item"
        >
          <input
            v-model="formData.pros[index]"
            type="text"
            :placeholder="`Punto positivo ${index + 1}`"
            class="form-input"
            :disabled="submitting"
          >
          <button
            v-if="formData.pros.length > 1"
            type="button"
            @click="removeListItem('pros', index)"
            class="remove-btn"
            :disabled="submitting"
            aria-label="Eliminar punto positivo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <button
          type="button"
          @click="addListItem('pros')"
          class="add-btn"
          :disabled="submitting || formData.pros.length >= 5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Añadir punto positivo
        </button>
      </div>
    </div>

    <div class="form-section">
      <label class="form-label">Puntos a mejorar</label>
      <div class="dynamic-list">
        <div 
          v-for="(item, index) in formData.cons" 
          :key="`con-${index}`"
          class="list-item"
        >
          <input
            v-model="formData.cons[index]"
            type="text"
            :placeholder="`Punto a mejorar ${index + 1}`"
            class="form-input"
            :disabled="submitting"
          >
          <button
            v-if="formData.cons.length > 1"
            type="button"
            @click="removeListItem('cons', index)"
            class="remove-btn"
            :disabled="submitting"
            aria-label="Eliminar punto a mejorar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <button
          type="button"
          @click="addListItem('cons')"
          class="add-btn"
          :disabled="submitting || formData.cons.length >= 5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Añadir punto a mejorar
        </button>
      </div>
    </div>

    <div class="form-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="formData.wouldRecommend"
          class="checkbox"
          :disabled="submitting"
        >
        <span>
          Recomendaría esta {{ entityType === 'university' ? 'universidad' : 'programa' }}
        </span>
      </label>
    </div>

    <div class="form-footer">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn btn-secondary"
        :disabled="submitting"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!isValid || submitting"
      >
        <span v-if="submitting" class="btn-loading">
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
            <circle class="spinner-path" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
          </svg>
          Enviando...
        </span>
        <span v-else>
          Publicar reseña
        </span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import StarRating from './StarRating.vue';
import type { ReviewFormData } from '@/types/reviews';

interface Props {
  entityId: string;
  entityType: 'university' | 'program';
  submitting?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['submit', 'cancel']);

const formData = reactive<ReviewFormData>({
  entityId: props.entityId,
  entityType: props.entityType,
  rating: 0,
  title: '',
  content: '',
  pros: [''],
  cons: [''],
  wouldRecommend: true
});

const errors = reactive({
  rating: '',
  title: '',
  content: ''
});

const submitting = ref(false);

const isValid = computed(() => {
  return formData.rating > 0 && 
         formData.title.trim().length >= 5 && 
         formData.content.trim().length >= 20;
});

const validateField = (field: keyof typeof errors) => {
  switch (field) {
    case 'rating':
      errors.rating = formData.rating === 0 ? 'Por favor selecciona una calificación' : '';
      break;
    case 'title':
      if (formData.title.trim().length === 0) {
        errors.title = 'El título es requerido';
      } else if (formData.title.trim().length < 5) {
        errors.title = 'El título debe tener al menos 5 caracteres';
      } else {
        errors.title = '';
      }
      break;
    case 'content':
      if (formData.content.trim().length === 0) {
        errors.content = 'La descripción es requerida';
      } else if (formData.content.trim().length < 20) {
        errors.content = 'La descripción debe tener al menos 20 caracteres';
      } else {
        errors.content = '';
      }
      break;
  }
};

const addListItem = (list: 'pros' | 'cons') => {
  if (formData[list].length < 5) {
    formData[list].push('');
  }
};

const removeListItem = (list: 'pros' | 'cons', index: number) => {
  if (formData[list].length > 1) {
    formData[list].splice(index, 1);
  }
};

const handleSubmit = () => {
  // Validar todos los campos
  validateField('rating');
  validateField('title');
  validateField('content');

  // Si hay errores, no enviar
  if (errors.rating || errors.title || errors.content) {
    return;
  }

  // Filtrar campos vacíos de pros y cons
  const cleanFormData = {
    ...formData,
    pros: formData.pros.filter(pro => pro.trim().length > 0),
    cons: formData.cons.filter(con => con.trim().length > 0)
  };

  submitting.value = true;
  emit('submit', cleanFormData);
};

// Resetear cuando cambia la entidad
watch(() => [props.entityId, props.entityType], () => {
  Object.assign(formData, {
    entityId: props.entityId,
    entityType: props.entityType,
    rating: 0,
    title: '',
    content: '',
    pros: [''],
    cons: [''],
    wouldRecommend: true
  });
  
  // Resetear errores
  errors.rating = '';
  errors.title = '';
  errors.content = '';
}, { immediate: true });
</script>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.form-header p {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

.form-label.required::after {
  content: " *";
  color: #ef4444;
}

.star-rating-large {
  margin: 0.5rem 0;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  width: 100%;
  background-color: white;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

.char-counter {
  font-size: 0.875rem;
  color: #9ca3af;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.list-item .form-input {
  flex: 1;
}

.remove-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid #dc2626;
  background-color: white;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.remove-btn:hover:not(:disabled) {
  background-color: #dc2626;
  color: white;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px dashed #d1d5db;
  border-radius: 0.5rem;
  background-color: #f9fafb;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.add-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
  color: #4b5563;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 0;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.375rem;
  border: 2px solid #d1d5db;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 75%;
}

.checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label span {
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

.spinner-path {
  stroke: currentColor;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>