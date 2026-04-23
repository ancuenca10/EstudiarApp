<!-- src/components/comparison/ComparisonChart.vue -->
<template>
  <div class="comparison-chart-component">
    <div class="chart-header">
      <h3>📊 Visualización Comparativa</h3>
      <div class="chart-controls">
        <select v-model="chartType" class="chart-select">
          <option value="bar">Gráfico de Barras</option>
          <option value="radar">Gráfico Radar</option>
          <option value="pie">Gráfico Circular</option>
        </select>
      </div>
    </div>
    
    <div class="chart-container">
      <!-- Gráfico de Barras -->
      <div v-if="chartType === 'bar'" class="chart-section">
        <h4>💰 Comparación de Costos</h4>
        <div class="bar-chart">
          <div 
            v-for="program in programs" 
            :key="program.id"
            class="bar-item"
          >
            <div class="bar-label">
              <div class="program-label">{{ program.name }}</div>
              <div class="program-cost">{{ formatCurrency(program.price) }}</div>
            </div>
            <div class="bar-track">
              <div 
                class="bar-fill"
                :style="{ 
                  width: `${getCostPercentage(program.price)}%`,
                  background: getProgramColor(program.id)
                }"
                :title="formatCurrency(program.price)"
              >
                <span class="bar-value">{{ getCostPercentage(program.price).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Gráfico Radar -->
      <div v-if="chartType === 'radar'" class="chart-section">
        <h4>🎯 Análisis Multidimensional</h4>
        <div class="radar-chart">
          <div class="radar-grid"></div>
          <div 
            v-for="program in programs" 
            :key="program.id"
            class="radar-area"
            :style="{ 
              background: getRadarColor(program.id),
              'clip-path': getRadarPath(program)
            }"
          ></div>
          <div class="radar-labels">
            <div class="radar-axis" v-for="axis in radarAxes" :key="axis.label">
              <div class="axis-label">{{ axis.label }}</div>
            </div>
          </div>
        </div>
        <div class="radar-legend">
          <div 
            v-for="program in programs" 
            :key="program.id"
            class="legend-item"
          >
            <span class="legend-color" :style="{ background: getProgramColor(program.id) }"></span>
            {{ program.name }}
          </div>
        </div>
      </div>
      
      <!-- Gráfico Circular -->
      <div v-if="chartType === 'pie'" class="chart-section">
        <h4>📊 Distribución de Costos</h4>
        <div class="pie-chart">
          <svg viewBox="0 0 100 100" class="pie-svg">
            <path 
              v-for="(slice, index) in pieSlices" 
              :key="slice.id"
              :d="slice.path"
              :fill="getProgramColor(slice.id)"
              class="pie-slice"
              @mouseenter="activeSlice = slice.id"
              @mouseleave="activeSlice = null"
              :class="{ active: activeSlice === slice.id }"
            />
          </svg>
          <div class="pie-legend">
            <div 
              v-for="slice in pieSlices" 
              :key="slice.id"
              class="pie-legend-item"
              @mouseenter="activeSlice = slice.id"
              @mouseleave="activeSlice = null"
              :class="{ active: activeSlice === slice.id }"
            >
              <span class="legend-color" :style="{ background: getProgramColor(slice.id) }"></span>
              <div class="legend-info">
                <div class="legend-name">{{ slice.name }}</div>
                <div class="legend-percentage">{{ slice.percentage }}%</div>
                <div class="legend-value">{{ formatCurrency(slice.value) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Resumen del gráfico -->
    <div class="chart-summary">
      <div class="summary-stat" v-for="stat in chartStats" :key="stat.label">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ProgramComparisonData } from '@/types';

interface Props {
  programs: ProgramComparisonData[];
}

const props = defineProps<Props>();
const chartType = ref('bar');
const activeSlice = ref<string | null>(null);

// Colores para los programas
const colors = ['#4ecdc4', '#ff6b6b', '#45b7d1', '#96ceb4'];

const getProgramColor = (programId: string) => {
  const index = props.programs.findIndex(p => p.id === programId);
  return colors[index % colors.length];
};

const getRadarColor = (programId: string) => {
  const baseColor = getProgramColor(programId);
  return `${baseColor}40`; // Agregar transparencia
};

// Formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

// Gráfico de barras
const getCostPercentage = (price: number) => {
  const prices = props.programs.map(p => p.price);
  const maxPrice = Math.max(...prices);
  return (price / maxPrice) * 100;
};

// Gráfico radar
const radarAxes = [
  { label: 'Costo', key: 'price', max: 30000000 },
  { label: 'Calidad', key: 'quality_rating', max: 5 },
  { label: 'Duración', key: 'duration_months', max: 120 },
  { label: 'Flexibilidad', key: 'modality', value: (modality: string) => 
    modality === 'Virtual' ? 5 : modality === 'Híbrido' ? 3 : 1 
  },
  { label: 'Acceso', key: 'requirements', value: (program: ProgramComparisonData) => 
    5 - (program.requires_exam ? 2 : 0) - (program.requires_interview ? 1 : 0)
  },
];

const getRadarValue = (program: ProgramComparisonData, axis: any) => {
  if (axis.value) {
    return typeof axis.value === 'function' 
      ? axis.value(axis.key === 'modality' ? program.modality : program)
      : axis.value;
  }
  
  const value = program[axis.key as keyof ProgramComparisonData];
  if (value === undefined || value === null) return 0;
  
  return Math.min((value as number) / axis.max, 1) * 100;
};

const getRadarPath = (program: ProgramComparisonData) => {
  const points = radarAxes.map((axis, index) => {
    const value = getRadarValue(program, axis);
    const angle = (index / radarAxes.length) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.max(value, 10); // Mínimo 10% para visibilidad
    
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    
    return `${x}% ${y}%`;
  });
  
  return `polygon(${points.join(', ')})`;
};

// Gráfico circular
const pieSlices = computed(() => {
  const total = props.programs.reduce((sum, program) => sum + program.price, 0);
  let currentAngle = 0;
  
  return props.programs.map(program => {
    const percentage = (program.price / total) * 100;
    const angle = (percentage / 100) * 2 * Math.PI;
    
    // Calcular coordenadas del slice
    const x1 = 50 + 40 * Math.cos(currentAngle);
    const y1 = 50 + 40 * Math.sin(currentAngle);
    
    currentAngle += angle;
    
    const x2 = 50 + 40 * Math.cos(currentAngle);
    const y2 = 50 + 40 * Math.sin(currentAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    
    return {
      id: program.id,
      name: program.name,
      value: program.price,
      percentage: Math.round(percentage),
      path,
      angle: currentAngle
    };
  });
});

// Estadísticas del gráfico
const chartStats = computed(() => {
  const prices = props.programs.map(p => p.price);
  const totalCost = prices.reduce((a, b) => a + b, 0);
  const avgCost = totalCost / prices.length;
  const minCost = Math.min(...prices);
  const maxCost = Math.max(...prices);
  
  return [
    { icon: '💰', label: 'Costo Total', value: formatCurrency(totalCost) },
    { icon: '📊', label: 'Costo Promedio', value: formatCurrency(avgCost) },
    { icon: '📉', label: 'Más Económico', value: formatCurrency(minCost) },
    { icon: '📈', label: 'Más Costoso', value: formatCurrency(maxCost) },
  ];
});
</script>

<style scoped>
.comparison-chart-component {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-header h3 {
  color: #333;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-select {
  padding: 8px 16px;
  border: 2px solid #667eea;
  border-radius: 8px;
  background: white;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
}

.chart-select:focus {
  outline: none;
  border-color: #5a67d8;
}

/* Contenedor de gráficos */
.chart-container {
  min-height: 300px;
  margin-bottom: 2rem;
}

.chart-section {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chart-section h4 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.2rem;
}

/* Gráfico de barras */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.bar-label {
  min-width: 200px;
  text-align: right;
}

.program-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.program-cost {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.bar-track {
  flex: 1;
  height: 40px;
  background: #f0f0f0;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 20px;
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  color: white;
  font-weight: bold;
  min-width: 40px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.bar-value {
  font-size: 0.9rem;
}

/* Gráfico radar */
.radar-chart {
  position: relative;
  width: 400px;
  height: 400px;
  margin: 0 auto 2rem;
}

.radar-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: 
    radial-gradient(circle at center, transparent 0%, transparent 20%, #f0f0f0 20%, #f0f0f0 40%, transparent 40%, transparent 60%, #f0f0f0 60%, #f0f0f0 80%, transparent 80%),
    conic-gradient(from 0deg, transparent 0%, #e0e0e0 0%, #e0e0e0 20%, transparent 20%, transparent 40%, #e0e0e0 40%, #e0e0e0 60%, transparent 60%, transparent 80%, #e0e0e0 80%, #e0e0e0 100%);
}

.radar-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.radar-area:hover {
  opacity: 0.8;
}

.radar-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.radar-axis {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  width: 100px;
}

.axis-label {
  position: absolute;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #333;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Gráfico circular */
.pie-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pie-svg {
  width: 300px;
  height: 300px;
}

.pie-slice {
  stroke: white;
  stroke-width: 2;
  transition: all 0.3s ease;
  cursor: pointer;
}

.pie-slice.active {
  stroke-width: 3;
  filter: brightness(1.1);
}

.pie-legend {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pie-legend-item:hover,
.pie-legend-item.active {
  background: #f8f9fa;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-info {
  flex: 1;
}

.legend-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  font-size: 0.95rem;
}

.legend-percentage {
  font-size: 1.1rem;
  font-weight: bold;
  color: #667eea;
}

.legend-value {
  font-size: 0.85rem;
  color: #666;
}

/* Resumen */
.chart-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.summary-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 1.8rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-select {
    width: 100%;
  }
  
  .bar-chart {
    gap: 1rem;
  }
  
  .bar-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .bar-label {
    text-align: left;
    min-width: auto;
  }
  
  .radar-chart {
    width: 300px;
    height: 300px;
  }
  
  .pie-chart {
    flex-direction: column;
  }
  
  .pie-legend {
    width: 100%;
  }
  
  .chart-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .radar-chart {
    width: 250px;
    height: 250px;
  }
  
  .pie-svg {
    width: 250px;
    height: 250px;
  }
}
</style>