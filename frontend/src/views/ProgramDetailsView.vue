<!-- src/views/ProgramDetailsView.vue -->
<template>
  <div class="program-details">
    <!-- Header (igual que UniversityDetailsView) -->
    <header class="header">
      <!-- ... mismo header ... -->
    </header>

    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <div class="container">
        <router-link to="/">🏠 Inicio</router-link>
        <span>›</span>
        <router-link to="/universities">📚 Universidades</router-link>
        <span>›</span>
        <router-link :to="`/university/${university?._id}`">
          {{ university?.name || 'Universidad' }}
        </router-link>
        <span>›</span>
        <span class="current">{{ program?.name || 'Programa' }}</span>
      </div>
    </nav>

    <!-- Contenido principal -->
    <main class="main-content">
      <div class="container">
        <!-- Información principal del programa -->
        <div class="program-header-section">
          <div class="program-title-section">
            <div class="program-badge" :class="program?.level?.toLowerCase()">
              {{ program?.level }}
            </div>
            <h1>{{ program?.name }}</h1>
            <div class="program-subtitle">
              <span class="university-link" @click="goToUniversity">
                🏛️ {{ university?.name }}
              </span>
              <span class="location">📍 {{ university?.city }}, {{ university?.country }}</span>
            </div>
          </div>
          
          <div class="program-header-actions">
            <!-- Botones de acción -->
            <div class="action-buttons">
              <button 
                @click="toggleProgramFavorite"
                class="btn-action btn-favorite"
                :class="{ active: isProgramFavorite }"
              >
                <span>{{ isProgramFavorite ? '★' : '☆' }}</span>
                <span>{{ isProgramFavorite ? 'En favoritos' : 'Agregar a favoritos' }}</span>
              </button>
              
              <button 
                @click="toggleProgramComparison"
                class="btn-action btn-compare"
                :class="{ active: isInComparison }"
              >
                <span>⚖️</span>
                <span>{{ isInComparison ? 'En comparación' : 'Comparar' }}</span>
              </button>
              
              <button @click="writeReview" class="btn-action btn-review">
                <span>📝</span>
                <span>Escribir reseña</span>
              </button>
            </div>
            
            <!-- Estadísticas rápidas -->
            <div class="quick-stats">
              <div class="stat">
                <span class="stat-icon">💰</span>
                <span class="stat-value">{{ formatPrice(program?.price || 0) }}</span>
                <span class="stat-label">Costo anual</span>
              </div>
              <div class="stat">
                <span class="stat-icon">⏰</span>
                <span class="stat-value">{{ program?.duration }}</span>
                <span class="stat-label">Duración</span>
              </div>
              <div class="stat">
                <span class="stat-icon">🎓</span>
                <span class="stat-value">{{ program?.modality }}</span>
                <span class="stat-label">Modalidad</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid de información detallada -->
        <div class="program-details-grid">
          <!-- Columna izquierda: Información principal -->
          <div class="details-column">
            <!-- Descripción -->
            <section class="description-section">
              <h2>📖 Descripción del programa</h2>
              <div class="description-content" v-html="formatDescription(program?.description || '')"></div>
            </section>

            <!-- Plan de estudios -->
            <section v-if="program?.curriculum" class="curriculum-section">
              <h2>📚 Plan de estudios</h2>
              <div class="curriculum-content">
                <div v-for="(semester, index) in program.curriculum" :key="index" class="semester">
                  <h4>Semestre {{ index + 1 }}</h4>
                  <ul>
                    <li v-for="course in semester.courses" :key="course.code">
                      <strong>{{ course.code }}</strong> - {{ course.name }} 
                      <span class="course-credits">({{ course.credits }} créditos)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- Requisitos de admisión -->
            <section v-if="program?.requirements && program.requirements.length > 0" class="requirements-section">
              <h2>📋 Requisitos de admisión</h2>
              <div class="requirements-list">
                <div v-for="(requirement, index) in program.requirements" :key="index" class="requirement">
                  <span class="requirement-icon">✅</span>
                  <span class="requirement-text">{{ requirement }}</span>
                </div>
              </div>
              <div v-if="program.requires_exam" class="exam-notice">
                ⚠️ <strong>Nota:</strong> Este programa requiere examen de admisión
              </div>
              <div v-if="program.requires_interview" class="interview-notice">
                👥 <strong>Nota:</strong> Este programa requiere entrevista personal
              </div>
            </section>
          </div>

          <!-- Columna derecha: Información adicional -->
          <div class="sidebar-column">
            <!-- Información de la universidad -->
            <div class="university-card">
              <h3>🏛️ Universidad</h3>
              <div class="university-info">
                <h4>{{ university?.name }}</h4>
                <p class="university-type" :class="university?.type?.toLowerCase()">
                  {{ university?.type }}
                </p>
                <div class="contact-info">
                  <p><strong>📍</strong> {{ university?.contact?.address }}</p>
                  <p><strong>📧</strong> {{ university?.contact?.email }}</p>
                  <p><strong>📱</strong> {{ university?.contact?.phone }}</p>
                  <p><strong>🌐</strong> 
                    <a :href="university?.contact?.website" target="_blank">
                      {{ university?.contact?.website }}
                    </a>
                  </p>
                </div>
                <button @click="goToUniversity" class="btn-university-details">
                  Ver detalles de la universidad →
                </button>
              </div>
            </div>

            <!-- Datos del programa -->
            <div class="program-data-card">
              <h3>📊 Datos del programa</h3>
              <div class="data-grid">
                <div class="data-item">
                  <span class="data-label">Nivel:</span>
                  <span class="data-value">{{ program?.level }}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Modalidad:</span>
                  <span class="data-value">{{ program?.modality }}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">Horario:</span>
                  <span class="data-value">{{ program?.schedule }}</span>
                </div>
                <div v-if="program?.weekly_hours" class="data-item">
                  <span class="data-label">Horas/semana:</span>
                  <span class="data-value">{{ program.weekly_hours }}h</span>
                </div>
                <div v-if="program?.quality_rating" class="data-item">
                  <span class="data-label">Calificación:</span>
                  <span class="data-value">
                    <span class="rating-stars">
                      <span v-for="star in 5" :key="star" class="star">
                        {{ star <= Math.round(program.quality_rating) ? '★' : '☆' }}
                      </span>
                    </span>
                    {{ program.quality_rating.toFixed(1) }}/5
                  </span>
                </div>
                <div v-if="program?.graduation_rate" class="data-item">
                  <span class="data-label">Tasa de graduación:</span>
                  <span class="data-value">{{ program.graduation_rate }}%</span>
                </div>
              </div>
            </div>

            <!-- Costos detallados -->
            <div v-if="program?.cost_breakdown" class="costs-card">
              <h3>💰 Costos detallados</h3>
              <div class="costs-list">
                <div class="cost-item">
                  <span class="cost-label">Matrícula anual:</span>
                  <span class="cost-value">{{ formatPrice(program.price) }}</span>
                </div>
                <div v-for="(cost, key) in program.cost_breakdown" :key="key" class="cost-item">
                  <span class="cost-label">{{ formatCostLabel(key) }}:</span>
                  <span class="cost-value">{{ formatPrice(cost) }}</span>
                </div>
                <div class="cost-total">
                  <span class="total-label">Costo total estimado:</span>
                  <span class="total-value">{{ calculateTotalCost() }}</span>
                </div>
              </div>
            </div>

            <!-- Compartir programa -->
            <div class="share-section">
              <h3>📤 Compartir</h3>
              <div class="share-buttons">
                <button @click="shareProgram" class="share-btn">
                  <span>🔗</span> Copiar enlace
                </button>
                <button @click="exportProgram" class="share-btn">
                  <span>💾</span> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Programas similares -->
        <section v-if="similarPrograms.length > 0" class="similar-programs">
          <h2>🎓 Programas similares</h2>
          <div class="programs-grid">
            <ProgramCard
              v-for="similar in similarPrograms"
              :key="similar._id"
              :program="similar.program"
              :university="similar.university"
            />
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <!-- ... mismo footer ... -->
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUniversitiesStore } from '@/stores/universities';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';
import ProgramCard from '@/components/programs/ProgramCard.vue';
import type { University, Program } from '@/types';

const route = useRoute();
const router = useRouter();
const universitiesStore = useUniversitiesStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

const university = ref<University | null>(null);
const program = ref<Program | null>(null);
const loading = ref(true);

// Computed
const isProgramFavorite = computed(() => {
  if (!program.value || !university.value) return false;
  return favoritesStore.isProgramFavorite(program.value._id, university.value._id);
});

const isInComparison = computed(() => {
  if (!program.value || !university.value) return false;
  return comparisonStore.isProgramInComparison(program.value._id, university.value._id);
});

const similarPrograms = computed(() => {
  if (!program.value || !university.value) return [];
  
  // Buscar programas del mismo nivel en la misma universidad
  const sameUniversity = universitiesStore.universities
    .find(u => u._id === university.value?._id);
  
  if (!sameUniversity) return [];
  
  return sameUniversity.programs
    .filter(p => 
      p._id !== program.value?._id && 
      p.level === program.value?.level &&
      p.modality === program.value?.modality
    )
    .slice(0, 3)
    .map(p => ({
      program: p,
      university: sameUniversity
    }));
});

// Métodos
const loadProgram = async () => {
  try {
    loading.value = true;
    const universityId = route.params.universityId as string;
    const programId = route.params.programId as string;
    
    // Buscar universidad
    const foundUniversity = universitiesStore.universities.find(
      u => u._id === universityId || u.id === universityId
    );
    
    if (!foundUniversity) {
      await universitiesStore.fetchUniversityById(universityId);
      university.value = universitiesStore.currentUniversity;
    } else {
      university.value = foundUniversity;
    }
    
    // Buscar programa
    if (university.value) {
      const foundProgram = university.value.programs.find(
        p => p._id === programId || p.id === programId
      );
      
      if (foundProgram) {
        program.value = foundProgram;
      } else {
        // Redirigir si no se encuentra el programa
        router.push(`/university/${universityId}`);
      }
    }
  } catch (error) {
    console.error('Error cargando programa:', error);
    router.push('/');
  } finally {
    loading.value = false;
  }
};

const toggleProgramFavorite = () => {
  if (!program.value || !university.value) return;
  
  const result = favoritesStore.toggleProgramFavorite(program.value, university.value);
  const message = result 
    ? `⭐ "${program.value.name}" agregado a favoritos`
    : `❌ "${program.value.name}" removido de favoritos`;
  
  showNotification(message, result ? 'success' : 'info');
};

const toggleProgramComparison = () => {
  if (!program.value || !university.value) return;
  
  try {
    if (isInComparison.value) {
      comparisonStore.removeProgramFromComparison(program.value._id, university.value._id);
      showNotification(`⚖️ "${program.value.name}" removido de comparación`, 'info');
    } else {
      if (comparisonStore.isFull) {
        alert('Máximo 4 programas en comparación. Elimina uno para agregar otro.');
        return;
      }
      
      comparisonStore.addProgramToComparison(
        program.value._id,
        university.value._id,
        program.value.name,
        university.value.name,
        program.value
      );
      showNotification(`⚖️ "${program.value.name}" agregado a comparación`, 'success');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al modificar comparación';
    showNotification(errorMessage, 'error');
  }
};

const writeReview = () => {
  if (!program.value || !university.value) return;
  router.push(`/write-review?universityId=${university.value._id}&programId=${program.value._id}`);
};

const goToUniversity = () => {
  if (!university.value) return;
  router.push(`/university/${university.value._id}`);
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const formatDescription = (description: string): string => {
  // Convertir saltos de línea en <br> y añadir párrafos
  return description
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${p}</p>`)
    .join('');
};

const formatCostLabel = (key: string): string => {
  const labels: Record<string, string> = {
    'inscription': 'Inscripción',
    'tuition': 'Matrícula',
    'materials': 'Materiales',
    'technology': 'Tecnología',
    'other': 'Otros'
  };
  return labels[key] || key;
};

const calculateTotalCost = (): string => {
  if (!program.value) return formatPrice(0);
  
  let total = program.value.price;
  
  if (program.value.cost_breakdown) {
    Object.values(program.value.cost_breakdown).forEach(cost => {
      total += cost;
    });
  }
  
  return formatPrice(total);
};

const shareProgram = () => {
  const url = window.location.href;
  const text = `¡Mira el programa ${program.value?.name} de ${university.value?.name} en EstudiarApp!`;
  
  if (navigator.share) {
    navigator.share({
      title: program.value?.name,
      text: text,
      url: url
    });
  } else {
    navigator.clipboard.writeText(`${text}\n${url}`);
    showNotification('Enlace copiado al portapapeles', 'success');
  }
};

const exportProgram = () => {
  if (!program.value || !university.value) return;
  
  const data = {
    program: {
      name: program.value.name,
      level: program.value.level,
      description: program.value.description,
      duration: program.value.duration,
      price: program.value.price,
      modality: program.value.modality,
      schedule: program.value.schedule,
      requirements: program.value.requirements
    },
    university: {
      name: university.value.name,
      contact: university.value.contact
    },
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `programa-${program.value.name.replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Programa exportado correctamente', 'success');
};

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  alert(`${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`);
};

// Lifecycle
onMounted(() => {
  loadProgram();
});
</script>

<style scoped>
/* Estilos específicos para ProgramDetailsView */
/* Similar a UniversityDetailsView pero con ajustes para programas */

.program-header-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.program-title-section {
  text-align: center;
  margin-bottom: 2rem;
}

.program-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.program-badge.pregrado {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: white;
}

.program-badge.posgrado {
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  color: white;
}

.program-badge.técnico,
.program-badge.tecnológico {
  background: linear-gradient(135deg, #388e3c, #4caf50);
  color: white;
}

.program-title-section h1 {
  margin: 0.5rem 0;
  color: #333;
  font-size: 2.5rem;
  line-height: 1.2;
}

.program-subtitle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.university-link {
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
}

.university-link:hover {
  text-decoration: underline;
}

.location {
  color: #666;
  font-size: 1rem;
}

.program-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.btn-favorite {
  background: #fff3e0;
  color: #f57c00;
  border-color: #ffe0b2;
}

.btn-favorite:hover {
  background: #ffe0b2;
}

.btn-favorite.active {
  background: #FFD700;
  color: #333;
  border-color: #FFA500;
}

.btn-compare {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #bbdefb;
}

.btn-compare:hover {
  background: #bbdefb;
}

.btn-compare.active {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

.btn-review {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #e1bee7;
}

.btn-review:hover {
  background: #e1bee7;
}

.quick-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-weight: 700;
  color: #333;
  font-size: 1.2rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* Grid de detalles */
.program-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

@media (min-width: 1024px) {
  .program-details-grid {
    grid-template-columns: 2fr 1fr;
  }
  
  .details-column {
    grid-column: 1;
  }
  
  .sidebar-column {
    grid-column: 2;
  }
}

/* Secciones */
.description-section,
.curriculum-section,
.requirements-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

h2 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.description-content {
  line-height: 1.6;
  color: #444;
}

.description-content p {
  margin-bottom: 1rem;
}

.curriculum-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.semester {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.semester h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.semester ul {
  margin: 0;
  padding-left: 1.2rem;
}

.semester li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #444;
}

.course-credits {
  color: #666;
  font-size: 0.85rem;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.requirement {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.requirement-icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.requirement-text {
  color: #444;
  line-height: 1.4;
}

.exam-notice,
.interview-notice {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.exam-notice {
  background: #fff3e0;
  color: #f57c00;
  border-left: 3px solid #ff9800;
}

.interview-notice {
  background: #e3f2fd;
  color: #1976d2;
  border-left: 3px solid #2196f3;
}

/* Tarjetas del sidebar */
.university-card,
.program-data-card,
.costs-card,
.share-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

h3 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.university-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.university-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.university-type.pública {
  background: #e3f2fd;
  color: #1976d2;
}

.university-type.privada {
  background: #f3e5f5;
  color: #7b1fa2;
}

.contact-info {
  margin: 1rem 0;
}

.contact-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #444;
}

.contact-info a {
  color: #667eea;
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

.btn-university-details {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn-university-details:hover {
  background: #667eea;
  color: white;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.data-item:last-child {
  border-bottom: none;
}

.data-label {
  color: #666;
  font-size: 0.9rem;
}

.data-value {
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.rating-stars {
  color: #FFD700;
  margin-right: 0.5rem;
}

.costs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.cost-label {
  color: #666;
  font-size: 0.9rem;
}

.cost-value {
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  border-top: 2px solid #e9ecef;
}

.total-label {
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

.total-value {
  color: #2ecc71;
  font-weight: 700;
  font-size: 1.1rem;
}

.share-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-btn {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.share-btn:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

/* Programas similares */
.similar-programs {
  margin: 3rem 0;
}

.similar-programs h2 {
  margin-bottom: 1.5rem;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .program-header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .program-title-section h1 {
    font-size: 2rem;
  }
  
  .program-subtitle {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>