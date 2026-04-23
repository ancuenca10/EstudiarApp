<!-- src/components/comparison/ComparisonTable.vue -->
<template>
  <div class="comparison-table-component">
    <div class="table-header">
      <h3>📋 Tabla Comparativa Detallada</h3>
      <div class="table-actions">
        <button @click="toggleExpandAll" class="action-btn">
          {{ allExpanded ? 'Contraer todo' : 'Expandir todo' }}
        </button>
        <button @click="copyToClipboard" class="action-btn copy-btn">
          📋 Copiar tabla
        </button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-scroll">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="category-header sticky-column">Categoría</th>
              <th 
                v-for="(program, index) in programs" 
                :key="program.id"
                :class="['program-header', `program-${index + 1}`]"
              >
                <div class="header-content">
                  <div class="program-name">{{ program.name }}</div>
                  <div class="university-name">{{ program.universityName }}</div>
                  <button 
                    @click="$emit('remove', program.id, program.universityId)"
                    class="remove-btn"
                    title="Quitar de comparación"
                  >
                    ×
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            <!-- Información General -->
            <tr class="category-row" @click="toggleCategory('general')">
              <td class="category-title">
                <span class="category-icon">🏫</span>
                Información General
                <span class="toggle-icon">{{ expandedCategories.general ? '−' : '+' }}</span>
              </td>
              <td v-for="program in programs" :key="`general-${program.id}`">
                <!-- Placeholder para alineación -->
              </td>
            </tr>
            
            <transition-group name="expand">
              <tr 
                v-if="expandedCategories.general" 
                v-for="row in generalRows" 
                :key="row.key"
                class="data-row"
              >
                <td class="row-label">
                  <span class="row-icon">{{ row.icon }}</span>
                  {{ row.label }}
                </td>
                <td 
                  v-for="program in programs" 
                  :key="`${row.key}-${program.id}`"
                  :class="getCellClass(row.key, program)"
                >
                  {{ formatValue(row.key, program[row.key as keyof typeof program]) }}
                  <span v-if="row.key === 'price'" class="best-badge" :class="{ 'best': isBestValue(row.key, program) }">
                    💰 Mejor precio
                  </span>
                </td>
              </tr>
            </transition-group>

            <!-- Costos y Finanzas -->
            <tr class="category-row" @click="toggleCategory('costs')">
              <td class="category-title">
                <span class="category-icon">💰</span>
                Costos y Finanzas
                <span class="toggle-icon">{{ expandedCategories.costs ? '−' : '+' }}</span>
              </td>
              <td v-for="program in programs" :key="`costs-${program.id}`"></td>
            </tr>
            
            <transition-group name="expand">
              <tr 
                v-if="expandedCategories.costs" 
                v-for="row in costRows" 
                :key="row.key"
                class="data-row"
              >
                <td class="row-label">
                  <span class="row-icon">{{ row.icon }}</span>
                  {{ row.label }}
                </td>
                <td 
                  v-for="program in programs" 
                  :key="`${row.key}-${program.id}`"
                  :class="getCellClass(row.key, program)"
                >
                  {{ formatValue(row.key, program[row.key as keyof typeof program]) }}
                  <span v-if="row.key === 'price' && isBestValue(row.key, program)" class="best-badge">
                    💰 Mejor precio
                  </span>
                  <span v-if="row.key === 'duration_months' && isBestValue(row.key, program)" class="best-badge">
                    ⏳ Más corto
                  </span>
                </td>
              </tr>
            </transition-group>

            <!-- Calidad Académica -->
            <tr class="category-row" @click="toggleCategory('quality')">
              <td class="category-title">
                <span class="category-icon">⭐</span>
                Calidad Académica
                <span class="toggle-icon">{{ expandedCategories.quality ? '−' : '+' }}</span>
              </td>
              <td v-for="program in programs" :key="`quality-${program.id}`"></td>
            </tr>
            
            <transition-group name="expand">
              <tr 
                v-if="expandedCategories.quality" 
                v-for="row in qualityRows" 
                :key="row.key"
                class="data-row"
              >
                <td class="row-label">
                  <span class="row-icon">{{ row.icon }}</span>
                  {{ row.label }}
                </td>
                <td 
                  v-for="program in programs" 
                  :key="`${row.key}-${program.id}`"
                  :class="getCellClass(row.key, program)"
                >
                  {{ formatValue(row.key, program[row.key as keyof typeof program]) }}
                  <span v-if="row.key === 'quality_rating' && isBestValue(row.key, program)" class="best-badge">
                    🏆 Mejor calificación
                  </span>
                </td>
              </tr>
            </transition-group>

            <!-- Requisitos -->
            <tr class="category-row" @click="toggleCategory('requirements')">
              <td class="category-title">
                <span class="category-icon">📝</span>
                Requisitos
                <span class="toggle-icon">{{ expandedCategories.requirements ? '−' : '+' }}</span>
              </td>
              <td v-for="program in programs" :key="`requirements-${program.id}`"></td>
            </tr>
            
            <transition-group name="expand">
              <tr 
                v-if="expandedCategories.requirements" 
                v-for="row in requirementRows" 
                :key="row.key"
                class="data-row"
              >
                <td class="row-label">
                  <span class="row-icon">{{ row.icon }}</span>
                  {{ row.label }}
                </td>
                <td 
                  v-for="program in programs" 
                  :key="`${row.key}-${program.id}`"
                  :class="getCellClass(row.key, program)"
                >
                  {{ formatValue(row.key, program[row.key as keyof typeof program]) }}
                  <span v-if="row.key === 'requires_exam' && !program.requires_exam" class="best-badge">
                    ✅ Sin examen
                  </span>
                  <span v-if="row.key === 'requires_interview' && !program.requires_interview" class="best-badge">
                    ✅ Sin entrevista
                  </span>
                </td>
              </tr>
            </transition-group>

            <!-- Acciones -->
            <tr class="actions-row">
              <td class="actions-label">
                <span class="category-icon">🔗</span>
                Acciones
              </td>
              <td v-for="program in programs" :key="`actions-${program.id}`">
                <div class="action-buttons">
                  <button 
                    @click="viewDetails(program)"
                    class="action-btn details-btn"
                  >
                    👁️ Ver Detalles
                  </button>
                  <button 
                    @click="addToFavorites(program)"
                    class="action-btn favorite-btn"
                  >
                    ⭐ Favorito
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resumen -->
    <div class="table-summary">
      <div class="summary-header">
        <h4>📊 Resumen Comparativo</h4>
      </div>
      <div class="summary-content">
        <div class="summary-item" v-for="summary in summaries" :key="summary.type">
          <div class="summary-type">{{ summary.type }}</div>
          <div class="summary-winner">
            <strong>{{ summary.winner }}</strong>
            <small>{{ summary.reason }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import type { ProgramComparisonData } from '@/types';

interface Props {
  programs: ProgramComparisonData[];
}

interface Emits {
  (e: 'remove', programId: string, universityId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();
const favoritesStore = useFavoritesStore();

const expandedCategories = ref({
  general: true,
  costs: true,
  quality: true,
  requirements: true,
});

// ... resto del código se mantiene igual
</script>

<style scoped>
.comparison-table-component {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-header h3 {
  color: #333;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.action-btn.copy-btn {
  background: #4ecdc4;
  border-color: #4ecdc4;
  color: white;
}

.action-btn.copy-btn:hover {
  background: #26a69a;
  border-color: #26a69a;
}

/* Contenedor de tabla */
.table-container {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
}

/* Encabezados */
.category-header {
  background: #667eea;
  color: white;
  font-weight: bold;
  padding: 1rem;
  text-align: left;
  width: 200px;
}

.program-header {
  text-align: center;
  padding: 0.75rem;
  min-width: 220px;
}

.program-1 .header-content {
  border-left: 4px solid #4ecdc4;
}

.program-2 .header-content {
  border-left: 4px solid #ff6b6b;
}

.program-3 .header-content {
  border-left: 4px solid #45b7d1;
}

.program-4 .header-content {
  border-left: 4px solid #96ceb4;
}

.header-content {
  position: relative;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.program-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #333;
}

.university-name {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff5252;
  transform: scale(1.1);
}

/* Filas de categoría */
.category-row {
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.3s;
}

.category-row:hover {
  background: #e9ecef;
}

.category-title {
  padding: 1rem;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  font-size: 1.2rem;
}

.toggle-icon {
  margin-left: auto;
  font-weight: bold;
  font-size: 1.2rem;
  color: #667eea;
}

/* Filas de datos */
.data-row {
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.data-row:hover {
  background: #f5f7ff;
}

.row-label {
  padding: 1rem;
  color: #555;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.comparison-table td:not(:first-child) {
  text-align: center;
  padding: 1rem;
  border-left: 1px solid #e0e0e0;
}

/* Clases especiales para celdas */
.best-value {
  background: #e8f5e9 !important;
  font-weight: bold;
  color: #2e7d32;
}

.very-cheap {
  color: #4caf50;
  font-weight: bold;
}

.cheap {
  color: #8bc34a;
}

.expensive {
  color: #f44336;
  font-weight: bold;
}

.best-badge {
  display: inline-block;
  background: #4caf50;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Animaciones */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
}

/* Fila de acciones */
.actions-row {
  background: #f0f7ff;
}

.actions-label {
  padding: 1rem;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.actions-row .action-btn {
  width: 140px;
  padding: 8px 12px;
  font-size: 0.85rem;
}

.details-btn {
  background: #667eea;
  color: white;
  border: none;
}

.details-btn:hover {
  background: #5a67d8;
}

.favorite-btn {
  background: #ffd700;
  color: #333;
  border: none;
}

.favorite-btn:hover {
  background: #ffc107;
}

/* Resumen */
.table-summary {
  margin-top: 2rem;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #667eea30;
}

.summary-header h4 {
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-type {
  font-weight: 600;
  color: #333;
}

.summary-winner {
  text-align: right;
}

.summary-winner strong {
  display: block;
  color: #667eea;
  margin-bottom: 2px;
}

.summary-winner small {
  color: #666;
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
    justify-content: center;
  }
  
  .summary-content {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .actions-row .action-btn {
    width: auto;
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .category-title, .row-label {
    font-size: 0.9rem;
    padding: 0.75rem;
  }
  
  .program-name {
    font-size: 0.9rem;
  }
  
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .summary-winner {
    text-align: left;
  }
}
</style>