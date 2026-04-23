<template>
  <div class="university-detail-view">
    <div class="container">
      <!-- Botón de volver -->
      <button @click="goBack" class="back-btn">
        ← Volver a la lista
      </button>
      
      <!-- Loading - SOLO al inicio -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando información de la universidad...</p>
        <p v-if="debugInfo" class="debug-text">{{ debugInfo }}</p>
      </div>
      
      <!-- Universidad no encontrada -->
      <div v-else-if="!university && !loading" class="not-found">
        <h2>⚠️ Universidad no encontrada</h2>
        <p>La universidad que buscas no existe o ha sido eliminada.</p>
        <p class="debug-info" v-if="debugInfo">Debug: {{ debugInfo }}</p>
        <button @click="$router.push('/')" class="home-btn">
          Volver al inicio
        </button>
      </div>
      
      <!-- Detalles de la universidad -->
      <div v-else class="university-content">
        <!-- Header -->
        <div class="university-header">
          <div class="header-top">
            <h1>{{ university.name }}</h1>
            <div class="header-actions">
              <button 
                @click="toggleFavorite" 
                class="action-btn header-fav-btn"
                :class="{ active: isFavorite }"
                :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
              >
                <span class="btn-icon">{{ isFavorite ? '★' : '☆' }}</span>
              </button>
              <button 
                @click="toggleComparison" 
                class="action-btn header-compare-btn"
                :class="{ active: isInComparison }"
                :disabled="isInComparison || comparisonFull"
                :title="isInComparison ? 'En comparación' : 'Comparar universidad'"
              >
                <span class="btn-icon">{{ isInComparison ? '✓' : '⚖️' }}</span>
              </button>
            </div>
          </div>
          
          <div class="header-badges">
            <span class="type-badge" :class="universityType">
              {{ universityType === 'public' ? '🏛️ Pública' : '🏢 Privada' }}
            </span>
            <span v-if="universityRating" class="rating-badge">
              ⭐ {{ universityRating }}/5
              <span class="rating-count" v-if="reviewsCount > 0">({{ reviewsCount }})</span>
            </span>
            <span class="cost-badge" :class="universityCost">
              {{ costText }}
            </span>
            <span v-if="university.accreditation" class="accreditation-badge">
              🏆 {{ university.accreditation }}
            </span>
          </div>
        </div>
        
        <!-- Información principal -->
        <div class="main-info">
          <div class="location-card">
            <div class="location-icon">📍</div>
            <div class="location-info">
              <h3>Ubicación</h3>
              <p>{{ university.city || 'Ciudad no especificada' }}, {{ university.country || 'Colombia' }}</p>
              <p v-if="university.state">{{ university.state }}</p>
              <p v-if="university.address" class="address">{{ university.address }}</p>
            </div>
          </div>
          
          <div v-if="university.website" class="website-card">
            <div class="website-icon">🌐</div>
            <div class="website-info">
              <h3>Sitio web oficial</h3>
              <a :href="formatWebsite(university.website)" target="_blank" class="website-link">
                {{ university.website }}
              </a>
              <p v-if="university.phone" class="contact-info">📞 {{ university.phone }}</p>
              <p v-if="university.email" class="contact-info">✉️ {{ university.email }}</p>
            </div>
          </div>
          
          <div v-if="university.ranking || university.founded" class="stats-card">
            <div class="stats-icon">📊</div>
            <div class="stats-info">
              <h3>Datos destacados</h3>
              <div class="stats-grid">
                <div v-if="university.founded" class="stat-item">
                  <span class="stat-label">Fundada:</span>
                  <span class="stat-value">{{ university.founded }}</span>
                </div>
                <div v-if="university.students" class="stat-item">
                  <span class="stat-label">Estudiantes:</span>
                  <span class="stat-value">{{ formatNumber(university.students) }}</span>
                </div>
                <div v-if="university.ranking" class="stat-item">
                  <span class="stat-label">Ranking nacional:</span>
                  <span class="stat-value">#{{ university.ranking }}</span>
                </div>
                <div v-if="university.employmentRate" class="stat-item">
                  <span class="stat-label">Empleabilidad:</span>
                  <span class="stat-value">{{ university.employmentRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Descripción -->
        <div v-if="university.description" class="description-section">
          <h2>📝 Descripción</h2>
          <p class="description-text">{{ university.description }}</p>
        </div>
        
        <!-- Programas académicos -->
        <div class="programs-section">
          <div class="section-header">
            <h2>📚 Programas Académicos</h2>
            <div class="section-header-right">
              <span class="programs-count">{{ filteredPrograms.length }} de {{ programsCount }} programa{{ programsCount !== 1 ? 's' : '' }}</span>
              <div class="program-filters" v-if="hasPrograms">
                <select v-model="selectedLevel" class="filter-select">
                  <option value="">Todos los niveles</option>
                  <option value="Pregrado">Pregrado</option>
                  <option value="Posgrado">Posgrado</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                  <option value="Diplomado">Diplomado</option>
                </select>
                <select v-model="selectedArea" class="filter-select">
                  <option value="">Todas las áreas</option>
                  <option v-for="area in uniqueAreas" :key="area" :value="area">{{ area }}</option>
                </select>
              </div>
            </div>
          </div>
          
          <div v-if="!hasPrograms" class="no-programs">
            <p>No hay información de programas disponibles</p>
          </div>
          
          <div v-else class="programs-container">
            <!-- Vista de cards -->
            <div class="programs-grid">
              <div 
                v-for="program in filteredPrograms" 
                :key="getProgramId(program)"
                class="program-card"
                @click="goToProgramDetail(program)"
              >
                <div class="program-card-header">
                  <h3>{{ program.name || 'Programa sin nombre' }}</h3>
                  <div class="program-card-actions">
                    <button 
                      @click.stop="toggleProgramFavorite(program)"
                      class="program-action-btn favorite-btn"
                      :class="{ active: isProgramFavorite(program) }"
                      :title="isProgramFavorite(program) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                    >
                      {{ isProgramFavorite(program) ? '★' : '☆' }}
                    </button>
                    <button 
                      @click.stop="toggleProgramComparison(program)"
                      class="program-action-btn compare-btn"
                      :class="{ active: isProgramInComparison(program) }"
                      :disabled="isProgramInComparison(program) || programComparisonFull"
                      :title="isProgramInComparison(program) ? 'En comparación' : 'Comparar programa'"
                    >
                      {{ isProgramInComparison(program) ? '✓' : '⚖️' }}
                    </button>
                  </div>
                </div>
                
                <div class="program-details">
                  <span v-if="program.level" class="detail-item">
                    📚 {{ program.level }}
                  </span>
                  <span v-if="program.area" class="detail-item">
                    🏷️ {{ program.area }}
                  </span>
                  <span v-if="program.duration" class="detail-item">
                    ⏱️ {{ program.duration }}
                  </span>
                  <span v-if="program.modality" class="detail-item">
                    💼 {{ program.modality }}
                  </span>
                  <span v-if="program.cost" class="detail-item">
                    💰 {{ program.cost }}
                  </span>
                </div>
                
                <p v-if="program.description" class="program-description">
                  {{ program.description }}
                </p>
                
                <div v-if="program.sniesCode" class="program-footer">
                  <span class="snies-code">Código SNIES: {{ program.sniesCode }}</span>
                  <button class="view-details-btn" @click.stop="goToProgramDetail(program)">
                    Ver detalles →
                  </button>
                </div>
              </div>
            </div>
            
            <!-- No hay resultados en filtros -->
            <div v-if="filteredPrograms.length === 0 && hasPrograms" class="no-filter-results">
              <p>No se encontraron programas con los filtros seleccionados</p>
              <button @click="clearFilters" class="clear-filters-btn">
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
        
        <!-- Acciones principales -->
        <div class="actions-section">
          <button 
            @click="toggleFavorite" 
            class="action-btn main-favorite-btn"
            :class="{ active: isFavorite }"
          >
            <span class="btn-icon">{{ isFavorite ? '★' : '☆' }}</span>
            <span class="btn-text">
              {{ isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos' }}
            </span>
          </button>
          
          <button 
            @click="toggleComparison" 
            class="action-btn main-compare-btn"
            :class="{ active: isInComparison }"
            :disabled="isInComparison || comparisonFull"
          >
            <span class="btn-icon">{{ isInComparison ? '✓' : '⚖️' }}</span>
            <span class="btn-text">
              {{ isInComparison ? 'En comparación' : comparisonFull ? 'Máximo alcanzado' : 'Comparar universidad' }}
            </span>
          </button>
          
          <button 
            @click="goToReviews" 
            class="action-btn reviews-btn"
            :disabled="reviewsCount === 0"
          >
            <span class="btn-icon">📝</span>
            <span class="btn-text">
              {{ reviewsCount === 0 ? 'Sin reseñas' : `Ver reseñas (${reviewsCount})` }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUniversitiesStore } from '@/stores/universities';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';

const route = useRoute();
const router = useRouter();
const universitiesStore = useUniversitiesStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

const university = ref<any>(null);
const loading = ref(true);
const debugInfo = ref<string>('');
const error = ref<string | null>(null);
const selectedLevel = ref<string>('');
const selectedArea = ref<string>('');

// Función para obtener ID de la universidad (compatible con id o _id)
const getUniversityId = (univ: any): string => {
  if (!univ) return '';
  return univ.id || univ._id || '';
};

// Función para obtener ID del programa (compatible con id o _id)
const getProgramId = (program: any): string => {
  if (!program) return '';
  return program.id || program._id || program.sniesCode || program.name || Math.random().toString();
};

// Computed properties - PROTEGIDAS CONTRA UNDEFINED
const universityType = computed(() => {
  if (!university.value) return 'private';
  const type = (university.value.type || '').toLowerCase();
  if (type.includes('public') || type.includes('pública')) return 'public';
  return 'private';
});

const universityRating = computed(() => {
  if (!university.value) return null;
  const rating = university.value.rating || null;
  return rating ? parseFloat(rating.toFixed(1)) : null;
});

const universityCost = computed(() => {
  if (universityType.value === 'public') return 'low';
  return 'medium';
});

const costText = computed(() => {
  const costMap: Record<string, string> = {
    'low': 'Bajo costo',
    'medium': 'Costo medio', 
    'high': 'Alto costo'
  };
  return costMap[universityCost.value] || 'Costo no especificado';
});

const hasPrograms = computed(() => {
  if (!university.value) return false;
  return Array.isArray(university.value.programs) && university.value.programs.length > 0;
});

const programsCount = computed(() => {
  if (!hasPrograms.value) return 0;
  return university.value.programs.length;
});

// FIXED: Asegurar que los stores estén inicializados correctamente
const isFavorite = computed(() => {
  if (!university.value) return false;
  
  const universityId = getUniversityId(university.value);
  if (!universityId) return false;
  
  try {
    // Verificar si el store tiene favorites
    if (!favoritesStore || !favoritesStore.favorites) return false;
    
    return favoritesStore.favorites.some((fav: any) => {
      const favId = getUniversityId(fav);
      return favId === universityId;
    });
  } catch (error) {
    console.error('Error en isFavorite:', error);
    return false;
  }
});

const isInComparison = computed(() => {
  if (!university.value) return false;
  
  const universityId = getUniversityId(university.value);
  if (!universityId) return false;
  
  try {
    if (!comparisonStore || !comparisonStore.comparisonItems) return false;
    
    return comparisonStore.comparisonItems.some((item: any) => {
      const itemId = getUniversityId(item);
      return itemId === universityId;
    });
  } catch (error) {
    console.error('Error en isInComparison:', error);
    return false;
  }
});

const comparisonFull = computed(() => {
  try {
    if (!comparisonStore || !comparisonStore.comparisonItems) return false;
    return comparisonStore.comparisonItems.length >= 3;
  } catch (error) {
    console.error('Error en comparisonFull:', error);
    return false;
  }
});

const programComparisonFull = computed(() => {
  try {
    if (!comparisonStore || !comparisonStore.programComparisonItems) return false;
    return comparisonStore.programComparisonItems.length >= 3;
  } catch (error) {
    console.error('Error en programComparisonFull:', error);
    return false;
  }
});

// Reviews count temporal (sin store de reviews)
const reviewsCount = computed(() => {
  return 0; // Temporal, puedes integrar el store de reviews después
});

const uniqueAreas = computed(() => {
  if (!hasPrograms.value) return [];
  const areas = new Set<string>();
  university.value.programs.forEach((program: any) => {
    if (program.area) areas.add(program.area);
  });
  return Array.from(areas).sort();
});

const filteredPrograms = computed(() => {
  if (!hasPrograms.value) return [];
  
  return university.value.programs.filter((program: any) => {
    const matchesLevel = !selectedLevel.value || program.level === selectedLevel.value;
    const matchesArea = !selectedArea.value || program.area === selectedArea.value;
    return matchesLevel && matchesArea;
  });
});

// Helper para formatear URL del website
const formatWebsite = (url: string): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Helper para formatear números
const formatNumber = (num: number): string => {
  if (!num) return 'N/A';
  return num.toLocaleString();
};

// Verificar si un programa está en favoritos
const isProgramFavorite = (program: any): boolean => {
  if (!program) return false;
  
  const programId = getProgramId(program);
  if (!programId) return false;
  
  try {
    if (!favoritesStore || !favoritesStore.programFavorites) return false;
    
    return favoritesStore.programFavorites.some((fav: any) => {
      const favId = getProgramId(fav);
      return favId === programId;
    });
  } catch (error) {
    console.error('Error en isProgramFavorite:', error);
    return false;
  }
};

// Verificar si un programa está en comparación
const isProgramInComparison = (program: any): boolean => {
  if (!program) return false;
  
  const programId = getProgramId(program);
  if (!programId) return false;
  
  try {
    if (!comparisonStore || !comparisonStore.programComparisonItems) return false;
    
    return comparisonStore.programComparisonItems.some((item: any) => {
      const itemId = getProgramId(item);
      return itemId === programId;
    });
  } catch (error) {
    console.error('Error en isProgramInComparison:', error);
    return false;
  }
};

// Cargar universidad
const loadUniversity = async () => {
  const id = route.params.id as string;
  console.log('🔍 CARGANDO UNIVERSIDAD CON ID:', id);
  
  loading.value = true;
  debugInfo.value = `Buscando universidad ID: ${id}`;
  university.value = null;
  error.value = null;
  
  try {
    // Cargar todas las universidades si el store está vacío
    if (universitiesStore.universities.length === 0) {
      console.log('🔄 Store vacío, cargando universidades...');
      await universitiesStore.loadUniversities();
    }
    
    console.log('📊 Universidades en store:', universitiesStore.universities.length);
    
    // Buscar la universidad por ID
    const found = universitiesStore.universities.find((u: any) => {
      // Probar todos los campos posibles de ID
      return (
        u.id === id ||
        u._id === id ||
        (u.id && String(u.id) === String(id)) ||
        (u._id && String(u._id) === String(id))
      );
    });
    
    if (found) {
      university.value = { ...found };
      console.log('✅ Universidad encontrada:', university.value.name);
      debugInfo.value = `Encontrada: ${university.value.name}`;
      
      // Asegurar que los programas existan
      if (!university.value.programs) {
        university.value.programs = [];
      }
    } else {
      console.error('❌ Universidad no encontrada');
      error.value = 'Universidad no encontrada';
      debugInfo.value = `No encontrada. Total universidades: ${universitiesStore.universities.length}`;
    }
  } catch (err: any) {
    console.error('❌ Error cargando universidad:', err);
    error.value = `Error: ${err.message}`;
    debugInfo.value = `Error: ${err.message}`;
  } finally {
    loading.value = false;
    console.log('🏁 Carga completada');
  }
};

const goBack = () => {
  router.back();
};

const goToProgramDetail = (program: any) => {
  if (!university.value || !program) {
    console.error('No hay universidad o programa para navegar');
    return;
  }
  
  const universityId = getUniversityId(university.value);
  const programId = getProgramId(program);
  
  console.log('📤 Navegando a programa:', program.name, 'ID:', programId);
  
  // Primero intentar con la ruta de programas
  if (programId && programId !== '') {
    router.push({
      path: `/programs/${programId}`,
      query: { 
        universityId: universityId,
        universityName: university.value.name 
      }
    });
  } 
  // Si no hay ID válido, mostrar modal o alerta
  else {
    console.warn('⚠️ No se pudo obtener ID válido del programa');
    // Mostrar modal con información del programa
    alert(`Programa: ${program.name}\nUniversidad: ${university.value.name}\n\nDetalles del programa:\n${program.description || 'Sin descripción'}`);
  }
};

const goToReviews = () => {
  if (!university.value) return;
  
  const universityId = getUniversityId(university.value);
  
  // Redirigir a escribir la primera reseña
  router.push(`/reviews/write?universityId=${universityId}`);
};

// FIXED: Función para toggle favorite con mejor manejo de errores
const toggleFavorite = () => {
  if (!university.value) {
    console.error('No hay universidad para agregar a favoritos');
    return;
  }
  
  const universityId = getUniversityId(university.value);
  if (!universityId) {
    console.error('No se pudo obtener ID de la universidad');
    return;
  }
  
  console.log('⭐ Toggle favorite para universidad:', university.value.name, 'ID:', universityId);
  
  try {
    if (isFavorite.value) {
      console.log('Removiendo de favoritos...');
      favoritesStore.removeFavorite(universityId);
      console.log('✅ Removido de favoritos');
    } else {
      console.log('Agregando a favoritos...');
      const universityToAdd = {
        id: universityId,
        _id: university.value._id || universityId,
        name: university.value.name || 'Sin nombre',
        city: university.value.city || 'Sin ciudad',
        country: university.value.country || 'Colombia',
        state: university.value.state || '',
        type: universityType.value,
        description: university.value.description || '',
        programs: university.value.programs || [],
        rating: universityRating.value || null,
        website: university.value.website || '',
        logo: university.value.logo || '',
        accreditation: university.value.accreditation || '',
        founded: university.value.founded || ''
      };
      favoritesStore.addFavorite(universityToAdd);
      console.log('✅ Agregado a favoritos');
    }
  } catch (error) {
    console.error('❌ Error en toggleFavorite:', error);
    alert('Error al manejar favoritos. Por favor, intenta de nuevo.');
  }
};

// FIXED: Función para toggle comparison con mejor manejo de errores
const toggleComparison = () => {
  if (!university.value) {
    console.error('No hay universidad para comparar');
    return;
  }
  
  if (isInComparison.value) {
    console.log('Ya está en comparación');
    return;
  }
  
  console.log('⚖️ Toggle comparison para universidad:', university.value.name);
  
  try {
    if (comparisonFull.value) {
      alert('Máximo 3 universidades en comparación. Elimina una para agregar otra.');
      return;
    }
    
    const universityId = getUniversityId(university.value);
    if (!universityId) {
      console.error('No se pudo obtener ID de la universidad');
      return;
    }
    
    const universityToAdd = {
      id: universityId,
      _id: university.value._id || universityId,
      name: university.value.name || 'Sin nombre',
      city: university.value.city || 'Sin ciudad',
      country: university.value.country || 'Colombia',
      state: university.value.state || '',
      type: universityType.value,
      description: university.value.description || '',
      programs: university.value.programs || [],
      rating: universityRating.value || null,
      website: university.value.website || '',
      logo: university.value.logo || '',
      accreditation: university.value.accreditation || '',
      founded: university.value.founded || ''
    };
    
    console.log('Agregando a comparación:', universityToAdd.name);
    comparisonStore.addToComparison(universityToAdd);
    console.log('✅ Agregado a comparación');
    
    // Feedback visual
    alert(`"${university.value.name}" ha sido agregada a la comparación. Puedes comparar hasta 3 universidades.`);
    
  } catch (error) {
    console.error('❌ Error en toggleComparison:', error);
    alert('Error al agregar a comparación. Por favor, intenta de nuevo.');
  }
};

// FIXED: Función para toggle program favorite
const toggleProgramFavorite = (program: any) => {
  if (!program) {
    console.error('No hay programa para favoritos');
    return;
  }
  
  const programId = getProgramId(program);
  if (!programId) {
    console.error('No se pudo obtener ID del programa');
    return;
  }
  
  console.log('⭐ Toggle program favorite:', program.name, 'ID:', programId);
  
  try {
    if (isProgramFavorite(program)) {
      console.log('Removiendo programa de favoritos...');
      favoritesStore.removeProgramFavorite(programId);
      console.log('✅ Programa removido de favoritos');
    } else {
      console.log('Agregando programa a favoritos...');
      const programToAdd = {
        id: programId,
        _id: program._id || programId,
        name: program.name || 'Programa sin nombre',
        universityId: getUniversityId(university.value),
        universityName: university.value.name || '',
        universityType: universityType.value,
        level: program.level || '',
        area: program.area || '',
        duration: program.duration || '',
        modality: program.modality || '',
        cost: program.cost || '',
        description: program.description || '',
        sniesCode: program.sniesCode || ''
      };
      favoritesStore.addProgramFavorite(programToAdd);
      console.log('✅ Programa agregado a favoritos');
    }
  } catch (error) {
    console.error('❌ Error en toggleProgramFavorite:', error);
    alert('Error al manejar favoritos del programa. Por favor, intenta de nuevo.');
  }
};

// FIXED: Función para toggle program comparison
const toggleProgramComparison = (program: any) => {
  if (!program) {
    console.error('No hay programa para comparar');
    return;
  }
  
  console.log('⚖️ Toggle program comparison:', program.name);
  
  try {
    if (isProgramInComparison(program)) {
      console.log('Programa ya está en comparación');
      return;
    }
    
    if (programComparisonFull.value) {
      alert('Máximo 3 programas en comparación. Elimina uno para agregar otro.');
      return;
    }
    
    const programId = getProgramId(program);
    if (!programId) {
      console.error('No se pudo obtener ID del programa');
      return;
    }
    
    const programToAdd = {
      id: programId,
      _id: program._id || programId,
      name: program.name || 'Programa sin nombre',
      universityId: getUniversityId(university.value),
      universityName: university.value.name || '',
      universityType: universityType.value,
      level: program.level || '',
      area: program.area || '',
      duration: program.duration || '',
      modality: program.modality || '',
      cost: program.cost || '',
      description: program.description || '',
      sniesCode: program.sniesCode || '',
      accreditation: program.accreditation || ''
    };
    
    console.log('Agregando programa a comparación:', programToAdd.name);
    comparisonStore.addProgramToComparison(programToAdd);
    console.log('✅ Programa agregado a comparación');
    
    // Feedback visual
    alert(`"${program.name}" ha sido agregado a la comparación. Puedes comparar hasta 3 programas.`);
    
  } catch (error) {
    console.error('❌ Error en toggleProgramComparison:', error);
    alert('Error al agregar programa a comparación. Por favor, intenta de nuevo.');
  }
};

const clearFilters = () => {
  selectedLevel.value = '';
  selectedArea.value = '';
};

// Watchers
watch(() => route.params.id, (newId) => {
  console.log('🔄 ID de ruta cambiado:', newId);
  if (newId) {
    loadUniversity();
    clearFilters();
  }
}, { immediate: true });

// Lifecycle
onMounted(() => {
  console.log('🚀 UniversityDetailsView mounted');
  console.log('🆔 ID de la URL:', route.params.id);
  
  // Verificar stores
  console.log('🏪 Stores disponibles:');
  console.log('- Universities store:', universitiesStore ? 'OK' : 'NO');
  console.log('- Favorites store:', favoritesStore ? 'OK' : 'NO');
  console.log('- Comparison store:', comparisonStore ? 'OK' : 'NO');
  
  // Verificar métodos disponibles en stores
  if (favoritesStore) {
    console.log('⭐ Favorites store methods:', Object.keys(favoritesStore));
  }
  if (comparisonStore) {
    console.log('⚖️ Comparison store methods:', Object.keys(comparisonStore));
  }
});
</script>


<style scoped>
.university-detail-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Botón volver */
.back-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #5a6fd8;
  transform: translateX(-4px);
}

/* Loading */
.loading {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.not-found h2 {
  color: #333;
  margin-bottom: 1rem;
}

.not-found p {
  color: #666;
  margin-bottom: 2rem;
}

.home-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.home-btn:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

/* Header de la universidad */
.university-header {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.university-header h1 {
  font-size: 2.5rem;
  color: #333;
  line-height: 1.2;
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.header-fav-btn, .header-compare-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.header-fav-btn {
  background: #fff3e0;
  color: #f57c00;
  border: 2px solid #ffe0b2;
}

.header-fav-btn:hover, .header-fav-btn.active {
  background: #FFD700;
  color: #333;
  border-color: #FFA500;
}

.header-compare-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: 2px solid #bbdefb;
}

.header-compare-btn:hover:not(:disabled) {
  background: #bbdefb;
}

.header-compare-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

.header-compare-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.type-badge, .rating-badge, .cost-badge, .accreditation-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.type-badge.public {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.type-badge.private {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.rating-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  border: 1px solid #FFA500;
}

.rating-count {
  opacity: 0.9;
  font-size: 0.85rem;
}

.cost-badge.low {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.cost-badge.medium {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffe0b2;
}

.cost-badge.high {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.accreditation-badge {
  background: #fff8e1;
  color: #ff8f00;
  border: 1px solid #ffe082;
}

/* Información principal */
.main-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.location-card, .website-card, .stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s ease;
}

.location-card:hover, .website-card:hover, .stats-card:hover {
  transform: translateY(-2px);
}

.location-icon, .website-icon, .stats-icon {
  font-size: 2rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.location-info h3, .website-info h3, .stats-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.location-info p, .website-link, .contact-info {
  color: #666;
  margin: 0.25rem 0;
}

.address {
  font-size: 0.9rem;
  color: #888;
}

.website-link {
  color: #667eea;
  text-decoration: none;
  word-break: break-all;
  display: block;
}

.website-link:hover {
  text-decoration: underline;
}

.contact-info {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

/* Descripción */
.description-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.description-section h2 {
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.description-text {
  color: #555;
  line-height: 1.6;
  font-size: 1.05rem;
  white-space: pre-line;
}

/* Programas */
.programs-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.section-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.programs-count {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.program-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 0.9rem;
  min-width: 150px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.no-programs {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.programs-container {
  margin-top: 1.5rem;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.program-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid #e1e5e9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.program-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.program-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.program-card-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  line-height: 1.3;
  flex: 1;
  padding-right: 1rem;
}

.program-card-actions {
  display: flex;
  gap: 0.5rem;
}

.program-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f5f7fa;
  color: #666;
}

.program-action-btn:hover {
  transform: scale(1.1);
}

.program-action-btn.favorite-btn.active {
  background: #FFD700;
  color: #333;
}

.program-action-btn.compare-btn.active {
  background: #1976d2;
  color: white;
}

.program-action-btn.compare-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.program-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-item {
  background: #f0f4ff;
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #667eea;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid #dce5ff;
}

.program-description {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.program-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.snies-code {
  font-size: 0.85rem;
  color: #888;
}

.view-details-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.view-details-btn:hover {
  background: #f0f4ff;
  color: #5a6fd8;
}

.no-filter-results {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 1rem;
}

.no-filter-results p {
  color: #666;
  margin-bottom: 1rem;
}

.clear-filters-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: #5a6fd8;
}

/* Acciones principales */
.actions-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.action-btn {
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.main-favorite-btn {
  background: #fff3e0;
  color: #f57c00;
  border: 2px solid #ffe0b2;
}

.main-favorite-btn:hover {
  background: #ffe0b2;
  transform: translateY(-2px);
}

.main-favorite-btn.active {
  background: #FFD700;
  color: #333;
  border-color: #FFA500;
}

.main-compare-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: 2px solid #bbdefb;
}

.main-compare-btn:hover:not(:disabled) {
  background: #bbdefb;
  transform: translateY(-2px);
}

.main-compare-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

.main-compare-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.reviews-btn {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 2px solid #e1bee7;
}

.reviews-btn:hover {
  background: #e1bee7;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-text {
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .university-header h1 {
    font-size: 2rem;
  }
  
  .header-top {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .main-info {
    grid-template-columns: 1fr;
  }
  
  .programs-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header-right {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .program-filters {
    flex-direction: column;
  }
  
  .filter-select {
    min-width: auto;
    width: 100%;
  }
  
  .program-card-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .program-card-actions {
    align-self: flex-end;
  }
  
  .program-footer {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  
  .view-details-btn {
    align-self: flex-end;
  }
  
  .actions-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .university-header, .description-section,
  .programs-section {
    padding: 1.5rem;
  }
  
  .university-header h1 {
    font-size: 1.75rem;
  }
  
  .header-badges {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .program-card {
    padding: 1.25rem;
  }
}
</style>