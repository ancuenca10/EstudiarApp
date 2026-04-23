<!-- src/components/comparison/ComparisonSelector.vue -->
<template>
  <div class="comparison-selector">
    <div class="selector-header">
      <h4>➕ Añadir más programas para comparar</h4>
      <p>Selecciona programas de diferentes universidades</p>
    </div>

    <div class="selector-content">
      <!-- Buscador de universidades -->
      <div class="search-section">
        <div class="search-input-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar universidades o programas..."
            class="search-input"
            @input="searchUniversities"
          />
          <button @click="clearSearch" class="clear-search-btn" title="Limpiar búsqueda">
            ✕
          </button>
        </div>
        
        <div class="search-filters">
          <select v-model="selectedLevel" class="filter-select" @change="searchUniversities">
            <option value="">Todos los niveles</option>
            <option value="Técnico">Técnico</option>
            <option value="Tecnológico">Tecnológico</option>
            <option value="Pregrado">Pregrado</option>
            <option value="Posgrado">Posgrado</option>
          </select>
          
          <select v-model="selectedModality" class="filter-select" @change="searchUniversities">
            <option value="">Todas las modalidades</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>
      </div>

      <!-- Resultados de búsqueda -->
      <div v-if="searchResults.length > 0" class="search-results">
        <h5>Resultados de búsqueda ({{ searchResults.length }})</h5>
        
        <div class="universities-list">
          <div 
            v-for="university in searchResults" 
            :key="university._id"
            class="university-item"
          >
            <div class="university-info">
              <h6>{{ university.name }}</h6>
              <div class="university-meta">
                <span class="badge" :class="university.type.toLowerCase()">
                  {{ university.type }}
                </span>
                <span class="location">📍 {{ university.city }}, {{ university.state }}</span>
              </div>
            </div>
            
            <!-- Programas de la universidad -->
            <div class="programs-list">
              <div 
                v-for="program in university.filteredPrograms" 
                :key="program._id"
                class="program-item"
                :class="{ 'in-comparison': isInComparison(program._id, university._id) }"
              >
                <div class="program-info">
                  <strong>{{ program.name }}</strong>
                  <div class="program-details">
                    <span class="level">{{ program.level }}</span>
                    <span class="modality">{{ program.modality }}</span>
                    <span class="duration">{{ program.duration }}</span>
                    <span class="price">{{ formatCurrency(program.price) }}</span>
                  </div>
                </div>
                
                <button 
                  @click="toggleProgram(program, university)"
                  class="add-program-btn"
                  :disabled="!canAddMore && !isInComparison(program._id, university._id)"
                  :title="isInComparison(program._id, university._id) ? 'Quitar de comparación' : 'Añadir a comparación'"
                >
                  {{ isInComparison(program._id, university._id) ? '−' : '+' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else-if="searchQuery || selectedLevel || selectedModality" class="no-results">
        <p>No se encontraron programas que coincidan con tu búsqueda.</p>
        <button @click="clearFilters" class="clear-filters-btn">
          Limpiar filtros
        </button>
      </div>

      <!-- Sugerencias -->
      <div v-else class="suggestions-section">
        <h5>💡 Sugerencias para comparar</h5>
        <div class="suggestions-grid">
          <button 
            v-for="suggestion in programSuggestions" 
            :key="suggestion.id"
            @click="addSuggestion(suggestion)"
            class="suggestion-card"
            :disabled="!canAddMore && !isInComparison(suggestion.programId, suggestion.universityId)"
          >
            <div class="suggestion-content">
              <h6>{{ suggestion.programName }}</h6>
              <p class="suggestion-university">{{ suggestion.universityName }}</p>
              <div class="suggestion-details">
                <span>{{ suggestion.level }}</span>
                <span>{{ suggestion.modality }}</span>
                <span>{{ suggestion.price ? formatCurrency(suggestion.price) : 'N/A' }}</span>
              </div>
            </div>
            <div class="suggestion-action">
              {{ isInComparison(suggestion.programId, suggestion.universityId) ? '✓' : '+' }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUniversityStore } from '@/stores/counter';
import { useComparisonStore } from '@/stores/comparison';
import type { University, Program } from '@/types';

const universityStore = useUniversityStore();
const comparisonStore = useComparisonStore();

const searchQuery = ref('');
const selectedLevel = ref('');
const selectedModality = ref('');

// Computed properties
const canAddMore = computed(() => comparisonStore.canAddMore);
const comparisonCount = computed(() => comparisonStore.getItemCount);

const isInComparison = (programId: string, universityId: string) => {
  return comparisonStore.isInComparison(programId, universityId);
};

// ... resto del código se mantiene igual
</script>

<style scoped>
.comparison-selector {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.selector-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.selector-header h4 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.selector-header p {
  color: #666;
  font-size: 0.95rem;
}

/* Sección de búsqueda */
.search-section {
  margin-bottom: 1.5rem;
}

.search-input-group {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #ff6b6b;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  background: #ff5252;
}

.search-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #555;
  cursor: pointer;
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Resultados de búsqueda */
.search-results h5 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.universities-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.university-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.25rem;
  border-left: 4px solid #667eea;
}

.university-info h6 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.university-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge.pública {
  background: #d4edda;
  color: #155724;
}

.badge.privada {
  background: #e0e7ff;
  color: #3730a3;
}

.location {
  color: #666;
  font-size: 0.9rem;
}

/* Lista de programas */
.programs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.program-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.program-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.program-item.in-comparison {
  background: #f0f7ff;
  border-color: #667eea;
}

.program-info {
  flex: 1;
}

.program-info strong {
  color: #333;
  font-size: 0.95rem;
  display: block;
  margin-bottom: 0.25rem;
}

.program-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.program-details span {
  font-size: 0.85rem;
  color: #666;
  padding: 2px 8px;
  background: #f8f9fa;
  border-radius: 12px;
}

.add-program-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #667eea;
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.add-program-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: scale(1.1);
}

.add-program-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.program-item.in-comparison .add-program-btn {
  background: #ff6b6b;
}

.program-item.in-comparison .add-program-btn:hover:not(:disabled) {
  background: #ff5252;
}

/* Sin resultados */
.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.no-results p {
  margin-bottom: 1rem;
}

.clear-filters-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.clear-filters-btn:hover {
  background: #5a67d8;
}

/* Sugerencias */
.suggestions-section h5 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.suggestion-card:hover:not(:disabled) {
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.suggestion-content h6 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.suggestion-university {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.suggestion-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.suggestion-details span {
  font-size: 0.75rem;
  color: #888;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 10px;
}

.suggestion-action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.suggestion-card:disabled .suggestion-action {
  background: #ccc;
}

/* Responsive */
@media (max-width: 768px) {
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filters {
    flex-direction: column;
  }
  
  .filter-select {
    min-width: 100%;
  }
  
  .program-details {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .university-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>