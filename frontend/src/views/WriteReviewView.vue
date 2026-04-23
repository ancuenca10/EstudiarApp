<!-- src/views/WriteReviewView.vue -->
<template>
  <div class="write-review-view">
    <!-- Header -->
    <header class="page-header">
      <div class="container">
        <button @click="goBack" class="back-btn">
          ← Volver
        </button>
        <h1>📝 Escribir Reseña</h1>
        <p class="subtitle">Comparte tu experiencia para ayudar a otros estudiantes</p>
      </div>
    </header>

    <div class="container">
      <div class="write-review-content">
        <!-- Paso 1: Seleccionar entidad -->
        <div v-if="currentStep === 1" class="step-container">
          <div class="step-header">
            <div class="step-indicator">
              <span class="step-number active">1</span>
              <span class="step-label">Seleccionar</span>
            </div>
            <h2>¿Sobre qué quieres escribir?</h2>
            <p>Selecciona una universidad o programa específico</p>
          </div>

          <div class="entity-selection">
            <!-- Tipo de reseña -->
            <div class="review-type-selector">
              <button 
                @click="reviewType = 'university'"
                class="type-btn"
                :class="{ active: reviewType === 'university' }"
              >
                <span class="type-icon">🏛️</span>
                <span class="type-label">Universidad</span>
                <span class="type-desc">Reseña general de la institución</span>
              </button>
              
              <button 
                @click="reviewType = 'program'"
                class="type-btn"
                :class="{ active: reviewType === 'program' }"
              >
                <span class="type-icon">🎓</span>
                <span class="type-label">Programa</span>
                <span class="type-desc">Reseña específica de un programa</span>
              </button>
            </div>

            <!-- Búsqueda de entidad -->
            <div class="entity-search">
              <div class="search-wrapper">
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="reviewType === 'university' ? 'Buscar universidad...' : 'Buscar programa...'"
                  class="search-input"
                  @input="searchEntities"
                />
                <button class="search-btn">
                  🔍
                </button>
              </div>

              <!-- Resultados de búsqueda -->
              <div v-if="searchResults.length > 0" class="search-results">
                <div 
                  v-for="entity in searchResults" 
                  :key="getEntityId(entity)"
                  class="entity-result"
                  :class="{ selected: isEntitySelected(entity) }"
                  @click="selectEntity(entity)"
                >
                  <div class="entity-info">
                    <h4>{{ getEntityName(entity) }}</h4>
                    <div class="entity-meta">
                      <span v-if="reviewType === 'university'" class="entity-location">
                        📍 {{ entity.city || 'Ciudad no especificada' }}
                      </span>
                      <span v-if="reviewType === 'program'" class="entity-type">
                        🎓 {{ entity.type || 'Programa' }}
                      </span>
                      <span v-if="hasEntityReviews(entity)" class="entity-reviews">
                        ⭐ {{ getEntityRating(entity) || 'N/A' }} ({{ getEntityReviewsCount(entity) }})
                      </span>
                    </div>
                  </div>
                  <div class="entity-actions">
                    <span v-if="isEntitySelected(entity)" class="selected-indicator">
                      ✓ Seleccionado
                    </span>
                    <button 
                      v-else
                      @click.stop="selectEntity(entity)"
                      class="select-btn"
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Entidades recientes o populares -->
              <div v-else class="entity-suggestions">
                <h4 v-if="reviewType === 'university'">Universidades populares</h4>
                <h4 v-else>Programas populares</h4>
                
                <div class="suggestions-grid">
                  <div 
                    v-for="entity in popularEntities" 
                    :key="getEntityId(entity)"
                    class="suggestion-card"
                    @click="selectEntity(entity)"
                  >
                    <div class="suggestion-content">
                      <h5>{{ getEntityName(entity) }}</h5>
                      <div class="suggestion-meta">
                        <span v-if="reviewType === 'university'" class="location">
                          📍 {{ entity.city || 'Ciudad' }}
                        </span>
                        <span v-if="reviewType === 'program'" class="duration">
                          ⏱️ {{ entity.duration || 'Duración no especificada' }}
                        </span>
                        <span class="rating" v-if="getEntityRating(entity)">
                          ⭐ {{ getEntityRating(entity) }}
                        </span>
                      </div>
                    </div>
                    <button class="select-suggestion-btn">
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Entidad seleccionada -->
            <div v-if="selectedEntity" class="selected-entity-card">
              <div class="selected-header">
                <h3>Seleccionado:</h3>
                <button @click="deselectEntity" class="deselect-btn">
                  Cambiar
                </button>
              </div>
              <div class="selected-content">
                <div class="entity-details">
                  <h4>{{ getEntityName(selectedEntity) }}</h4>
                  <div class="entity-details-meta">
                    <span v-if="reviewType === 'university'" class="detail">
                      🏛️ {{ getUniversityType(selectedEntity) === 'public' ? 'Pública' : 'Privada' }}
                    </span>
                    <span v-if="reviewType === 'university'" class="detail">
                      📍 {{ selectedEntity.city || 'Ciudad' }}, {{ selectedEntity.country || 'Colombia' }}
                    </span>
                    <span v-if="reviewType === 'program'" class="detail">
                      🎓 {{ selectedEntity.degree || 'Nivel no especificado' }}
                    </span>
                    <span v-if="reviewType === 'program'" class="detail">
                      ⏱️ {{ selectedEntity.duration || 'Duración no especificada' }}
                    </span>
                  </div>
                </div>
                <div class="selected-stats">
                  <div class="stat" v-if="getEntityRating(selectedEntity)">
                    <span class="stat-label">Calificación promedio:</span>
                    <span class="stat-value">⭐ {{ getEntityRating(selectedEntity) }}/5</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Reseñas:</span>
                    <span class="stat-value">{{ getEntityReviewsCount(selectedEntity) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navegación de pasos -->
          <div class="step-navigation">
            <button @click="goBack" class="btn-secondary">
              Cancelar
            </button>
            <button 
              @click="nextStep" 
              class="btn-primary"
              :disabled="!selectedEntity"
            >
              Continuar a reseña →
            </button>
          </div>
        </div>

        <!-- Paso 2: Escribir reseña -->
        <div v-else-if="currentStep === 2" class="step-container">
          <div class="step-header">
            <div class="step-indicator">
              <span class="step-number completed">1</span>
              <span class="step-divider">→</span>
              <span class="step-number active">2</span>
              <span class="step-label">Escribir</span>
            </div>
            <h2>Escribe tu reseña</h2>
            <p>Sé honesto y detallado sobre tu experiencia</p>
          </div>

          <!-- Entidad seleccionada -->
          <div class="selected-entity-review">
            <div class="selected-entity-badge">
              <span class="entity-icon">
                {{ reviewType === 'university' ? '🏛️' : '🎓' }}
              </span>
              <div class="entity-info">
                <strong>{{ getEntityName(selectedEntity) }}</strong>
                <small v-if="reviewType === 'university'">
                  {{ selectedEntity.city || 'Ciudad' }}
                </small>
                <small v-if="reviewType === 'program'">
                  {{ selectedEntity.university || 'Universidad' }}
                </small>
              </div>
              <button @click="currentStep = 1" class="change-btn">
                Cambiar
              </button>
            </div>
          </div>

          <!-- Formulario de reseña -->
          <ReviewForm
            :key="formKey"
            :entity-id="getEntityId(selectedEntity)"
            :entity-type="reviewType"
            :entity-name="getEntityName(selectedEntity)"
            :existing-review="existingUserReview"
            @submitted="handleReviewSubmitted"
            @cancelled="handleFormCancelled"
            class="review-form-container"
          />

          <!-- Información adicional -->
          <div class="review-guidelines">
            <h4>📋 Guía para escribir una buena reseña:</h4>
            <ul>
              <li>✅ Sé específico sobre tu experiencia personal</li>
              <li>✅ Menciona tanto aspectos positivos como áreas de mejora</li>
              <li>✅ Evita lenguaje ofensivo o inapropiado</li>
              <li>✅ No incluyas información personal de otros</li>
              <li>✅ Verifica la ortografía y gramática</li>
              <li>✅ Tu reseña será revisada antes de publicarse</li>
            </ul>
          </div>
        </div>

        <!-- Paso 3: Confirmación -->
        <div v-else-if="currentStep === 3" class="step-container">
          <div class="step-header">
            <div class="step-indicator">
              <span class="step-number completed">1</span>
              <span class="step-divider">→</span>
              <span class="step-number completed">2</span>
              <span class="step-divider">→</span>
              <span class="step-number active">3</span>
              <span class="step-label">Confirmar</span>
            </div>
            <h2>¡Reseña enviada! 🎉</h2>
            <p>Tu reseña ha sido enviada para revisión</p>
          </div>

          <div class="confirmation-content">
            <div class="confirmation-icon">✅</div>
            
            <div class="confirmation-message">
              <h3>Gracias por compartir tu experiencia</h3>
              <p>Tu reseña será revisada por nuestro equipo antes de publicarse. 
              Te notificaremos cuando esté disponible para todos.</p>
              
              <div class="confirmation-details">
                <div class="detail-item">
                  <span class="detail-label">Reseña para:</span>
                  <span class="detail-value">{{ getEntityName(selectedEntity) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Tipo:</span>
                  <span class="detail-value">
                    {{ reviewType === 'university' ? 'Universidad' : 'Programa' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fecha:</span>
                  <span class="detail-value">{{ new Date().toLocaleDateString('es-ES') }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado:</span>
                  <span class="detail-value status-pending">⏳ Pendiente de revisión</span>
                </div>
              </div>
            </div>

            <div class="confirmation-actions">
              <button @click="goToUniversityReviews" class="btn-secondary">
                Ver reseñas de esta {{ reviewType === 'university' ? 'universidad' : 'programa' }}
              </button>
              <button @click="writeAnotherReview" class="btn-primary">
                ✏️ Escribir otra reseña
              </button>
              <button @click="goToHome" class="btn-outline">
                🏠 Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar de ayuda -->
      <aside class="help-sidebar">
        <div class="help-card">
          <h4>💡 ¿Por qué escribir reseñas?</h4>
          <ul class="help-list">
            <li>Ayudas a futuros estudiantes a tomar decisiones informadas</li>
            <li>Compartes experiencias valiosas con la comunidad</li>
            <li>Las universidades pueden mejorar basándose en tu feedback</li>
            <li>Construyes reputación como revisor confiable</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>📊 Estadísticas de reseñas</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-icon">📝</span>
              <div class="stat-info">
                <span class="stat-value">{{ totalReviews }}</span>
                <span class="stat-label">Reseñas totales</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <div class="stat-info">
                <span class="stat-value">{{ activeReviewers }}</span>
                <span class="stat-label">Revisores activos</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">✅</span>
              <div class="stat-info">
                <span class="stat-value">{{ approvalRate }}%</span>
                <span class="stat-label">Tasa de aprobación</span>
              </div>
            </div>
          </div>
        </div>

        <div class="help-card">
          <h4>🛡️ Nuestro compromiso</h4>
          <p>Todas las reseñas son moderadas para garantizar:</p>
          <ul class="commitment-list">
            <li>✅ Autenticidad de los estudiantes</li>
            <li>✅ Contenido relevante y apropiado</li>
            <li>✅ Respuesta a reseñas por parte de universidades</li>
            <li>✅ Respeto y neutralidad</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useReviewsStore } from '@/stores/reviews';
import { useUniversitiesStore } from '@/stores/universities';
import ReviewForm from '@/components/reviews/ReviewForm.vue';
import type { Review } from '@/types/reviews';

const router = useRouter();
const route = useRoute();
const reviewsStore = useReviewsStore();
const universitiesStore = useUniversitiesStore();

// ============ ESTADOS ============
const currentStep = ref(1);
const reviewType = ref<'university' | 'program'>('university');
const selectedEntity = ref<any>(null);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const formKey = ref(0);

// ============ COMPUTED PROPERTIES ============

const existingUserReview = computed(() => {
  if (!selectedEntity.value) return null;
  
  // En producción, usar ID real del usuario
  const userId = 'current-user'; // Temporal
  const entityId = getEntityId(selectedEntity.value);
  
  return reviewsStore.reviews.find(review => 
    review.entityId === entityId && 
    review.entityType === reviewType.value &&
    review.userId === userId
  ) || null;
});

const popularEntities = computed(() => {
  if (reviewType.value === 'university') {
    return universitiesStore.universities
      .slice()
      .sort((a, b) => {
        const aRating = getEntityRating(a) || 0;
        const bRating = getEntityRating(b) || 0;
        return bRating - aRating;
      })
      .slice(0, 6);
  } else {
    // Para programas, obtener de todas las universidades
    const allPrograms: any[] = [];
    universitiesStore.universities.forEach(university => {
      if (university.programs && Array.isArray(university.programs)) {
        university.programs.forEach((program: any) => {
          allPrograms.push({
            ...program,
            universityId: university.id || university._id,
            universityName: university.name,
            universityCity: university.city,
          });
        });
      }
    });
    
    return allPrograms.slice(0, 6);
  }
});

const totalReviews = computed(() => {
  return reviewsStore.reviews.length;
});

const activeReviewers = computed(() => {
  const uniqueUsers = new Set(reviewsStore.reviews.map(r => r.userId));
  return uniqueUsers.size;
});

const approvalRate = computed(() => {
  const total = reviewsStore.reviews.length;
  const approved = reviewsStore.reviews.filter(r => r.status === 'approved').length;
  return total > 0 ? Math.round((approved / total) * 100) : 100;
});

// ============ MÉTODOS HELPER ============

const getEntityId = (entity: any): string => {
  if (reviewType.value === 'university') {
    return entity.id || entity._id || `uni-${entity.name?.toLowerCase().replace(/\s+/g, '-')}`;
  } else {
    return entity.id || `prog-${entity.name?.toLowerCase().replace(/\s+/g, '-')}`;
  }
};

const getEntityName = (entity: any): string => {
  return entity.name || 'Sin nombre';
};

const getEntityRating = (entity: any): number | null => {
  const entityId = getEntityId(entity);
  const stats = reviewsStore.getReviewStats(entityId, reviewType.value);
  return stats.averageRating > 0 ? parseFloat(stats.averageRating.toFixed(1)) : null;
};

const getEntityReviewsCount = (entity: any): number => {
  const entityId = getEntityId(entity);
  const stats = reviewsStore.getReviewStats(entityId, reviewType.value);
  return stats.totalReviews;
};

const hasEntityReviews = (entity: any): boolean => {
  return getEntityReviewsCount(entity) > 0;
};

const getUniversityType = (university: any): string => {
  const type = (university.type || '').toLowerCase();
  return type.includes('public') || type.includes('pública') ? 'public' : 'private';
};

// ============ MÉTODOS PRINCIPALES ============

const searchEntities = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  const query = searchQuery.value.toLowerCase();

  if (reviewType.value === 'university') {
    searchResults.value = universitiesStore.universities.filter(university => {
      const nameMatch = university.name?.toLowerCase().includes(query);
      const cityMatch = university.city?.toLowerCase().includes(query);
      return nameMatch || cityMatch;
    });
  } else {
    // Buscar programas
    const allPrograms: any[] = [];
    universitiesStore.universities.forEach(university => {
      if (university.programs && Array.isArray(university.programs)) {
        university.programs.forEach((program: any) => {
          if (program.name?.toLowerCase().includes(query)) {
            allPrograms.push({
              ...program,
              universityId: university.id || university._id,
              universityName: university.name,
              universityCity: university.city,
            });
          }
        });
      }
    });
    searchResults.value = allPrograms;
  }
};

const selectEntity = (entity: any) => {
  selectedEntity.value = entity;
  searchResults.value = [];
  searchQuery.value = '';
  
  // Si ya existe una reseña del usuario, mostrar mensaje
  if (existingUserReview.value) {
    if (confirm('Ya tienes una reseña para esta entidad. ¿Quieres editarla?')) {
      currentStep.value = 2;
    }
  }
};

const deselectEntity = () => {
  selectedEntity.value = null;
};

const isEntitySelected = (entity: any): boolean => {
  if (!selectedEntity.value) return false;
  return getEntityId(entity) === getEntityId(selectedEntity.value);
};

const nextStep = () => {
  if (currentStep.value === 1 && !selectedEntity.value) {
    alert('Por favor selecciona una universidad o programa primero');
    return;
  }
  
  if (currentStep.value === 2 && existingUserReview.value) {
    // Si ya hay reseña, ir directamente a paso 2
    formKey.value++;
    currentStep.value = 2;
  } else {
    currentStep.value++;
  }
};

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  } else {
    router.back();
  }
};

const handleReviewSubmitted = () => {
  currentStep.value = 3;
};

const handleFormCancelled = () => {
  if (existingUserReview.value) {
    // Si estaba editando, volver al paso 1
    currentStep.value = 1;
  } else {
    goBack();
  }
};

const goToUniversityReviews = () => {
  if (selectedEntity.value && reviewType.value === 'university') {
    router.push(`/university/${getEntityId(selectedEntity.value)}/reviews`);
  }
};

const writeAnotherReview = () => {
  // Resetear para escribir otra reseña
  selectedEntity.value = null;
  searchQuery.value = '';
  searchResults.value = [];
  currentStep.value = 1;
  formKey.value++;
};

const goToHome = () => {
  router.push('/');
};

// ============ WATCHERS ============

watch(reviewType, () => {
  selectedEntity.value = null;
  searchQuery.value = '';
  searchResults.value = [];
});

// ============ LIFECYCLE ============

onMounted(() => {
  // Si viene con parámetros predefinidos
  const entityId = route.query.entityId as string;
  const entityType = route.query.entityType as 'university' | 'program';
  
  if (entityId && entityType) {
    reviewType.value = entityType;
    
    if (entityType === 'university') {
      const university = universitiesStore.universities.find(u => {
        const id = u.id || u._id;
        return id === entityId;
      });
      
      if (university) {
        selectedEntity.value = university;
        currentStep.value = 2;
      }
    }
  }
});
</script>

<style scoped>
.write-review-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
  }
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0.5rem 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Contenido principal */
.write-review-content {
  grid-column: 1;
}

.step-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.step-header {
  margin-bottom: 2rem;
  text-align: center;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background: #e9ecef;
  color: #666;
}

.step-number.active {
  background: #667eea;
  color: white;
}

.step-number.completed {
  background: #4CAF50;
  color: white;
}

.step-divider {
  color: #999;
}

.step-label {
  font-weight: 500;
  color: #667eea;
}

.step-header h2 {
  margin: 0.5rem 0;
  color: #333;
}

.step-header p {
  margin: 0;
  color: #666;
}

/* Selección de tipo */
.review-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-btn {
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.type-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
}

.type-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.type-label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.type-desc {
  color: #666;
  font-size: 0.9rem;
}

/* Búsqueda de entidad */
.entity-search {
  margin-bottom: 2rem;
}

.search-wrapper {
  display: flex;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 1.1rem;
}

/* Resultados de búsqueda */
.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.entity-result {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entity-result:hover {
  background: #f8f9fa;
}

.entity-result.selected {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
}

.entity-info {
  flex: 1;
}

.entity-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.entity-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.selected-indicator {
  color: #4CAF50;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #4CAF5015;
}

.select-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.select-btn:hover {
  opacity: 0.9;
}

/* Sugerencias */
.entity-suggestions {
  margin-top: 1rem;
}

.entity-suggestions h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.suggestion-content h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.suggestion-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.select-suggestion-btn {
  padding: 0.5rem;
  background: #f8f9fa;
  color: #667eea;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.select-suggestion-btn:hover {
  background: #667eea;
  color: white;
}

/* Entidad seleccionada */
.selected-entity-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  border: 2px solid #667eea;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-header h3 {
  margin: 0;
  color: #333;
}

.deselect-btn {
  background: none;
  border: 1px solid #666;
  color: #666;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.deselect-btn:hover {
  background: #666;
  color: white;
}

.selected-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
}

@media (max-width: 768px) {
  .selected-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.entity-details h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.entity-details-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.selected-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

/* Navegación de pasos */
.step-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-primary, .btn-secondary, .btn-outline {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

.btn-outline {
  background: white;
  color: #666;
  border: 2px solid #e9ecef;
}

.btn-outline:hover {
  border-color: #666;
  color: #333;
}

/* Paso 2: Reseña */
.selected-entity-review {
  margin-bottom: 1.5rem;
}

.selected-entity-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.entity-icon {
  font-size: 1.5rem;
}

.entity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.change-btn {
  background: none;
  border: 1px solid #667eea;
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.change-btn:hover {
  background: #667eea;
  color: white;
}

.review-form-container {
  margin-bottom: 2rem;
}

.review-guidelines {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #2196F3;
}

.review-guidelines h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.review-guidelines ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #333;
}

.review-guidelines li {
  margin-bottom: 0.5rem;
}

/* Paso 3: Confirmación */
.confirmation-content {
  text-align: center;
  padding: 2rem;
}

.confirmation-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #4CAF50;
}

.confirmation-message h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.confirmation-message p {
  color: #666;
  max-width: 600px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.confirmation-details {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 500px;
  border: 1px solid #e9ecef;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.status-pending {
  color: #FF9800;
  background: #FFF3E0;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.confirmation-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

/* Sidebar de ayuda */
.help-sidebar {
  grid-column: 2;
  position: sticky;
  top: 20px;
  align-self: start;
}

@media (max-width: 1024px) {
  .help-sidebar {
    grid-column: 1;
    position: static;
  }
}

.help-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.help-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.help-list,
.commitment-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #555;
}

.help-list li,
.commitment-list li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.commitment-list li {
  list-style-type: none;
  padding-left: 0;
}

.commitment-list li:before {
  content: '✅ ';
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .step-container {
    padding: 1rem;
  }
  
  .review-type-selector {
    grid-template-columns: 1fr;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .confirmation-actions {
    width: 100%;
  }
  
  .confirmation-actions button {
    width: 100%;
  }
}
</style>