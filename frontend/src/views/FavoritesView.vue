<template>
  <div class="favorites-view">
    <div class="container">
      <div class="header">
        <h1>⭐ Mis Favoritos</h1>
        <p>Universidades y programas que has guardado</p>
      </div>

      <!-- Si no hay favoritos -->
      <div v-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No tienes favoritos guardados</h3>
        <p>Explora las universidades y añade tus favoritos</p>
        <button @click="$router.push('/')" class="explore-btn">
          Explorar Universidades
        </button>
      </div>

      <!-- Lista de favoritos - VERSIÓN SIMPLIFICADA -->
      <div v-else class="favorites-list">
        <div class="filters">
          <button 
            @click="activeTab = 'universities'"
            :class="{ active: activeTab === 'universities' }"
            class="tab-btn"
          >
            Universidades ({{ universityFavorites.length }})
          </button>
        </div>

        <!-- Universidades favoritas -->
        <div class="tab-content">
          <div class="universities-grid">
            <div 
              v-for="university in universityFavorites" 
              :key="university.id"
              class="favorite-card"
              @click="viewUniversityDetails(university.id)"
            >
              <div class="card-header">
                <h3>{{ university.name || 'Sin nombre' }}</h3>
                <button 
                  @click.stop="removeFromFavorites(university.id)"
                  class="remove-btn"
                  title="Quitar de favoritos"
                >
                  ✕
                </button>
              </div>
              
              <div class="card-body">
                <!-- Mostrar calificación si existe -->
                <div v-if="getUniversityRating(university)" class="rating-display">
                  <span class="stars">⭐⭐⭐⭐⭐</span>
                  <span class="rating-value">{{ getUniversityRating(university) }}/5</span>
                </div>
                
                <p class="location">
                  📍 {{ university.city || 'Ciudad no especificada' }}, {{ university.country || 'Colombia' }}
                </p>
                
                <p class="description">
                  {{ truncateDescription(university.description || 'Sin descripción disponible') }}
                </p>
                
                <!-- Mostrar programas si existen -->
                <div v-if="hasPrograms(university)" class="programs-preview">
                  <p class="programs-title">📚 Programas:</p>
                  <div class="programs-tags">
                    <span 
                      v-for="program in getTopPrograms(university, 3)" 
                      :key="program.id || program.name"
                      class="program-tag"
                    >
                      {{ program.name || 'Programa' }}
                    </span>
                    <span v-if="getProgramsCount(university) > 3" class="more-programs">
                      +{{ getProgramsCount(university) - 3 }} más
                    </span>
                  </div>
                </div>
                
                <div class="university-type-badge" :class="university.type || 'private'">
                  {{ (university.type || 'private') === 'public' ? '🏛️ Pública' : '🏢 Privada' }}
                </div>
              </div>
              
              <div class="card-footer">
                <button 
                  @click.stop="viewUniversityDetails(university.id)"
                  class="view-btn"
                >
                  Ver detalles
                </button>
                <button 
                  @click.stop="addToComparison(university)"
                  class="compare-btn"
                  :class="{ active: isInComparison(university.id) }"
                >
                  {{ isInComparison(university.id) ? '✓ En comparación' : '⚖️ Comparar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';

const router = useRouter();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();
const activeTab = ref<'universities' | 'programs'>('universities');

// Computed properties - SIMPLIFICADO
const favorites = computed(() => {
  console.log('Favoritos en store:', favoritesStore.favorites);
  return favoritesStore.favorites || [];
});

const universityFavorites = computed(() => {
  // Todos los favoritos son universidades en la estructura actual
  return favorites.value;
});

// Helper functions (las mismas que en HomeView)
const getUniversityRating = (university: any): number | null => {
  const rating = university.rating || null;
  return rating ? parseFloat(rating.toFixed(1)) : null;
};

const hasPrograms = (university: any): boolean => {
  return Array.isArray(university.programs) && university.programs.length > 0;
};

const getTopPrograms = (university: any, limit: number = 3): any[] => {
  if (!hasPrograms(university)) return [];
  
  return university.programs.slice(0, limit);
};

const getProgramsCount = (university: any): number => {
  return hasPrograms(university) ? university.programs.length : 0;
};

const truncateDescription = (text: string, length: number = 120): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const isInComparison = (id: string): boolean => {
  if (!comparisonStore?.comparisonItems || !id) return false;
  
  return comparisonStore.comparisonItems.some((item: any) => {
    const itemId = item.id || item._id || '';
    return itemId === id;
  });
};

// Métodos
const removeFromFavorites = (id: string) => {
  console.log('Removiendo favorito:', id);
  favoritesStore.removeFavorite(id);
};

const viewUniversityDetails = (id: string) => {
  if (id) {
    router.push(`/university/${id}`);
  }
};

const addToComparison = (university: any, event?: Event) => {
  if (event) event.stopPropagation();
  
  if (!comparisonStore) {
    console.error('Comparison store no disponible');
    return;
  }
  
  const universityId = university.id || university._id;
  if (!universityId) {
    console.error('Universidad no tiene ID válido:', university);
    return;
  }
  
  if (isInComparison(universityId)) {
    console.log('Ya está en comparación');
    return;
  }
  
  if (comparisonStore.comparisonItems.length >= 3) {
    alert('Máximo 3 programas en comparación');
    return;
  }
  
  console.log('Agregando a comparación:', university.name);
  comparisonStore.addToComparison(university);
};

onMounted(() => {
  console.log('FavoritesView mounted');
  console.log('Favoritos cargados:', favorites.value);
});
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.explore-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.explore-btn:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Filtros */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
  border-radius: 8px;
}

.tab-btn.active {
  color: #667eea;
  font-weight: 500;
  background: #e3f2fd;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
}

/* Tarjetas de favoritos */
.favorite-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.favorite-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  flex: 1;
  line-height: 1.3;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fee2e2;
  transform: scale(1.1);
}

.card-body {
  margin-bottom: 1.5rem;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stars {
  color: #FFD700;
  font-size: 1rem;
}

.rating-value {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.location {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.description {
  color: #4b5563;
  line-height: 1.6;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.programs-preview {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.programs-title {
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.programs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.program-tag {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.more-programs {
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}

.university-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.university-type-badge.public {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.university-type-badge.private {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.view-btn, .compare-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-align: center;
}

.view-btn {
  background: #667eea;
  color: white;
}

.view-btn:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.compare-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.compare-btn:hover {
  background: #bbdefb;
  transform: translateY(-2px);
}

.compare-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

/* Grids */
.universities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .header p {
    font-size: 1rem;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .tab-btn {
    text-align: center;
    width: 100%;
  }
  
  .universities-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
  }
  
  .empty-state {
    padding: 3rem 1.5rem;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.75rem;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
  }
  
  .favorite-card {
    padding: 1.25rem;
  }
}
</style>