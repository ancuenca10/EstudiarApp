<!-- src/components/reviews/ReviewForm.vue -->
<template>
  <div class="review-form">
    <form @submit.prevent="handleSubmit">
      <!-- Rating -->
      <div class="form-group">
        <label class="form-label">Calificación general *</label>
        <div class="rating-input">
          <button 
            v-for="star in 5" 
            :key="star"
            type="button"
            @click="form.rating = star"
            class="star-btn"
            :class="{ active: star <= form.rating }"
          >
            {{ star <= form.rating ? '★' : '☆' }}
          </button>
        </div>
        <span class="rating-value">{{ form.rating }}/5</span>
      </div>
      
      <!-- Title -->
      <div class="form-group">
        <label for="reviewTitle" class="form-label">Título de la reseña *</label>
        <input
          id="reviewTitle"
          v-model="form.title"
          type="text"
          placeholder="Ej: Excelente universidad, profesores muy preparados"
          class="form-input"
          required
          maxlength="100"
        />
        <small class="char-count">{{ form.title.length }}/100</small>
      </div>
      
      <!-- Content -->
      <div class="form-group">
        <label for="reviewContent" class="form-label">Tu experiencia *</label>
        <textarea
          id="reviewContent"
          v-model="form.content"
          placeholder="Describe tu experiencia en detalle..."
          class="form-textarea"
          rows="5"
          required
          maxlength="2000"
        ></textarea>
        <small class="char-count">{{ form.content.length }}/2000</small>
      </div>
      
      <!-- Pros -->
      <div class="form-group">
        <label class="form-label">Ventajas</label>
        <div class="tags-input">
          <div class="tags-list">
            <span v-for="(pro, index) in form.pros" :key="index" class="tag">
              {{ pro }}
              <button type="button" @click="removePro(index)" class="tag-remove">
                ✕
              </button>
            </span>
          </div>
          <div class="tag-input-wrapper">
            <input
              v-model="newPro"
              type="text"
              placeholder="Agregar ventaja..."
              class="tag-input"
              @keydown.enter.prevent="addPro"
            />
            <button type="button" @click="addPro" class="tag-add-btn">
              +
            </button>
          </div>
        </div>
        <small class="hint">Ej: Buen ambiente, instalaciones modernas, profesores expertos</small>
      </div>
      
      <!-- Cons -->
      <div class="form-group">
        <label class="form-label">Desventajas</label>
        <div class="tags-input">
          <div class="tags-list">
            <span v-for="(con, index) in form.cons" :key="index" class="tag">
              {{ con }}
              <button type="button" @click="removeCon(index)" class="tag-remove">
                ✕
              </button>
            </span>
          </div>
          <div class="tag-input-wrapper">
            <input
              v-model="newCon"
              type="text"
              placeholder="Agregar desventaja..."
              class="tag-input"
              @keydown.enter.prevent="addCon"
            />
            <button type="button" @click="addCon" class="tag-add-btn">
              +
            </button>
          </div>
        </div>
        <small class="hint">Ej: Costo elevado, pocas opciones de estacionamiento</small>
      </div>
      
      <!-- Would Recommend -->
      <div class="form-group">
        <label class="form-label">¿Recomendarías esta {{ props.entityType === 'university' ? 'universidad' : 'programa' }}?</label>
        <div class="recommend-options">
          <label class="radio-option">
            <input
              type="radio"
              v-model="form.wouldRecommend"
              :value="true"
              class="radio-input"
            />
            <span class="radio-label">
              <span class="radio-icon">✅</span>
              Sí, la recomendaría
            </span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="form.wouldRecommend"
              :value="false"
              class="radio-input"
            />
            <span class="radio-label">
              <span class="radio-icon">❌</span>
              No la recomendaría
            </span>
          </label>
        </div>
      </div>
      
      <!-- Study Year -->
      <div class="form-group">
        <label for="studyYear" class="form-label">Año de estudio</label>
        <select
          id="studyYear"
          v-model="form.studyYear"
          class="form-select"
        >
          <option value="">Seleccionar</option>
          <option value="1">Primer año</option>
          <option value="2">Segundo año</option>
          <option value="3">Tercer año</option>
          <option value="4">Cuarto año</option>
          <option value="5">Quinto año o más</option>
          <option value="0">Graduado</option>
        </select>
      </div>
      
      <!-- Submit -->
      <div class="form-actions">
        <button 
          type="button" 
          @click="cancel"
          class="btn-cancel"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="btn-submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Enviando...' : 'Publicar reseña' }}
        </button>
      </div>
      
      <!-- Error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useReviewsStore } from '@/stores/reviews';
import type { Review, ReviewFormData } from '@/types/reviews';

interface Props {
  entityId: string;
  entityType: 'university' | 'program';
  entityName?: string;
  existingReview?: Review;
}

const props = defineProps<Props>();
const reviewsStore = useReviewsStore();
const emit = defineEmits<{
  submitted: [];
  cancelled: [];
}>();

const newPro = ref('');
const newCon = ref('');
const isSubmitting = ref(false);
const error = ref('');

const form = reactive<ReviewFormData & { studyYear?: number }>({
  entityId: props.entityId,
  entityType: props.entityType,
  rating: 5,
  title: '',
  content: '',
  pros: [],
  cons: [],
  wouldRecommend: true,
  studyYear: undefined,
});

// Si hay una reseña existente, prellenar el formulario
if (props.existingReview) {
  form.rating = props.existingReview.rating;
  form.title = props.existingReview.title;
  form.content = props.existingReview.content;
  form.pros = [...props.existingReview.pros];
  form.cons = [...props.existingReview.cons];
  form.wouldRecommend = props.existingReview.wouldRecommend;
  form.studyYear = props.existingReview.studyYear;
}

const addPro = () => {
  if (newPro.value.trim() && form.pros.length < 10) {
    form.pros.push(newPro.value.trim());
    newPro.value = '';
  }
};

const removePro = (index: number) => {
  form.pros.splice(index, 1);
};

const addCon = () => {
  if (newCon.value.trim() && form.cons.length < 10) {
    form.cons.push(newCon.value.trim());
    newCon.value = '';
  }
};

const removeCon = (index: number) => {
  form.cons.splice(index, 1);
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  error.value = '';
  
  try {
    if (props.existingReview) {
      // Actualizar reseña existente
      reviewsStore.updateReview(props.existingReview.id, {
        ...form,
        updatedAt: new Date(),
      });
    } else {
      // Crear nueva reseña
      reviewsStore.addReview({
        ...form,
        userId: 'current-user', // Reemplazar con ID real
        userName: 'Usuario Actual', // Reemplazar con nombre real
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Usuario',
        isVerifiedStudent: true,
      });
    }
    
    emit('submitted');
  } catch (err: any) {
    error.value = err.message || 'Error al guardar la reseña';
  } finally {
    isSubmitting.value = false;
  }
};

const validateForm = (): boolean => {
  if (form.rating < 1 || form.rating > 5) {
    error.value = 'Por favor selecciona una calificación válida';
    return false;
  }
  
  if (!form.title.trim()) {
    error.value = 'El título es requerido';
    return false;
  }
  
  if (!form.content.trim()) {
    error.value = 'La descripción es requerida';
    return false;
  }
  
  if (form.content.trim().length < 50) {
    error.value = 'Por favor escribe al menos 50 caracteres en la descripción';
    return false;
  }
  
  return true;
};

const cancel = () => {
  emit('cancelled');
};

watch(() => form.content, (newValue) => {
  if (newValue.length > 2000) {
    form.content = newValue.substring(0, 2000);
  }
});

watch(() => form.title, (newValue) => {
  if (newValue.length > 100) {
    form.title = newValue.substring(0, 100);
  }
});
</script>

<style scoped>
.review-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  display: block;
  text-align: right;
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.rating-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.25rem;
  border-radius: 4px;
}

.star-btn:hover {
  color: #FFD700;
  transform: scale(1.2);
}

.star-btn.active {
  color: #FFD700;
}

.rating-value {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.tags-input {
  margin-bottom: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #f44336;
}

.tag-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.tag-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
}

.tag-add-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  width: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
}

.tag-add-btn:hover {
  background: #764ba2;
}

.hint {
  color: #666;
  font-size: 0.85rem;
  display: block;
  margin-top: 0.25rem;
}

.recommend-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-input {
  display: none;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.radio-input:checked + .radio-label {
  border-color: #667eea;
  background: #f8f9fa;
}

.radio-icon {
  font-size: 1.2rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  border-color: #666;
  color: #666;
}

.btn-submit {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1.5rem;
  border-left: 4px solid #f44336;
}

@media (max-width: 768px) {
  .review-form {
    padding: 1rem;
  }
  
  .recommend-options {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>