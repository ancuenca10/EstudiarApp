<template>
  <div class="comparison-view">
    <div class="container">
      <div class="header">
        <h1>⚖️ Comparador de Programas</h1>
        <p>Compara hasta 3 programas diferentes</p>
      </div>

      <div v-if="comparisonStore.comparisonItems.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No hay programas para comparar</h3>
        <p>Añade programas desde las universidades para compararlos</p>
        <button @click="$router.push('/')" class="explore-btn">
          Explorar Universidades
        </button>
      </div>

      <div v-else class="comparison-content">
        <!-- Controles -->
        <div class="controls">
          <button @click="clearComparison" class="clear-btn">
            🗑️ Limpiar comparación
          </button>
          <span class="item-count">
            {{ comparisonStore.comparisonItems.length }}/3 programas
          </span>
        </div>

        <!-- Tabla de comparación -->
        <div class="comparison-table">
          <div class="table-header">
            <div class="header-cell program-header">Programa</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="header-cell"
            >
              <div class="program-card">
                <h3>{{ item.name }}</h3>
                <p class="university-name">{{ item.data?.universityName || 'Universidad' }}</p>
                <button 
                  @click="removeFromComparison(item.id, item.type)"
                  class="remove-btn"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Características a comparar -->
          <div class="table-row">
            <div class="row-label">🏛️ Universidad</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="row-cell"
            >
              {{ item.data?.universityName || 'No especificada' }}
            </div>
          </div>

          <div class="table-row">
            <div class="row-label">📚 Nivel</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="row-cell"
            >
              {{ item.data?.level || 'No especificado' }}
            </div>
          </div>

          <div class="table-row">
            <div class="row-label">⏱️ Duración</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="row-cell"
            >
              {{ item.data?.duration || 'No especificada' }}
            </div>
          </div>

          <div class="table-row">
            <div class="row-label">💼 Modalidad</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="row-cell"
            >
              {{ item.data?.modality || 'No especificada' }}
            </div>
          </div>

          <div class="table-row">
            <div class="row-label">💰 Matrícula</div>
            <div 
              v-for="item in comparisonStore.comparisonItems" 
              :key="item.id"
              class="row-cell"
            >
              {{ formatCurrency(item.data?.tuition) }}
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="actions">
          <button @click="exportComparison" class="export-btn">
            📥 Exportar comparación
          </button>
          <button @click="shareComparison" class="share-btn">
            🔗 Compartir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useComparisonStore } from '@/stores/comparison';

const router = useRouter();
const comparisonStore = useComparisonStore();

const removeFromComparison = (id: string, type: string) => {
  comparisonStore.removeFromComparison(id, type);
};

const clearComparison = () => {
  if (confirm('¿Eliminar todos los programas de la comparación?')) {
    comparisonStore.clearComparison();
  }
};

const formatCurrency = (amount: number) => {
  if (!amount) return 'No especificado';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

const exportComparison = () => {
  alert('Exportar comparación (funcionalidad pendiente)');
};

const shareComparison = () => {
  alert('Compartir comparación (funcionalidad pendiente)');
};
</script>

<style scoped>
.comparison-view {
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
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.explore-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.explore-btn:hover {
  background: #2563eb;
}

/* Contenido de comparación */
.comparison-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-btn:hover {
  background: #dc2626;
}

.item-count {
  color: #6b7280;
  font-weight: 500;
}

/* Tabla de comparación */
.comparison-table {
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 200px repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.program-header {
  font-weight: 600;
  color: #374151;
}

.header-cell {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
}

.program-card {
  position: relative;
}

.program-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.university-name {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.remove-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.table-row {
  display: grid;
  grid-template-columns: 200px repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.table-row:last-child {
  border-bottom: none;
}

.row-label {
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
}

.row-cell {
  padding: 0.5rem;
  color: #4b5563;
}

/* Acciones */
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  justify-content: center;
}

.export-btn, .share-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.export-btn {
  background: #10b981;
  color: white;
}

.export-btn:hover {
  background: #059669;
}

.share-btn {
  background: #3b82f6;
  color: white;
}

.share-btn:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 150px repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>