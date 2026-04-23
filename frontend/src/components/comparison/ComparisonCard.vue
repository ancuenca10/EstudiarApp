<!-- src/components/comparison/ComparisonCard.vue -->
<template>
  <div class="comparison-card" :class="cardClasses">
    <div class="card-badge" v-if="isBestValue">🏆 Mejor</div>
    
    <div class="card-header">
      <h4 class="program-name">{{ program.name }}</h4>
      <p class="university-name">{{ program.universityName }}</p>
      <button 
        @click="$emit('remove')"
        class="remove-btn"
        title="Quitar de comparación"
      >
        ×
      </button>
    </div>
    
    <div class="card-content">
      <!-- Información básica -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">🎓 Nivel</span>
          <span class="info-value">{{ program.level }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">🏫 Modalidad</span>
          <span class="info-value">{{ program.modality }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">⏳ Duración</span>
          <span class="info-value">{{ program.duration }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">💰 Costo</span>
          <span class="info-value price">{{ formatCurrency(program.price) }}</span>
        </div>
      </div>
      
      <!-- Calificación -->
      <div v-if="program.quality_rating" class="rating-section">
        <div class="rating-label">Calificación:</div>
        <div class="rating-stars">
          <span v-for="star in 5" :key="star" class="star" :class="{ active: star <= program.quality_rating }">
            ★
          </span>
        </div>
        <div class="rating-value">{{ program.quality_rating }}/5</div>
      </div>
      
      <!-- Requisitos -->
      <div class="requirements-section">
        <div class="requirements-label">📝 Requisitos:</div>
        <div class="requirements-tags">
          <span v-if="program.requires_exam" class="requirement-tag exam">Examen</span>
          <span v-if="program.requires_interview" class="requirement-tag interview">Entrevista</span>
          <span v-if="!program.requires_exam && !program.requires_interview" class="requirement-tag easy">
            Básicos
          </span>
        </div>
      </div>
      
      <!-- Horario -->
      <div v-if="program.schedule" class="schedule-section">
        <div class="schedule-label">🕐 Horario:</div>
        <div class="schedule-value">{{ program.schedule }}</div>
      </div>
    </div>
    
    <!-- Acciones -->
    <div class="card-actions">
      <button @click="viewDetails" class="action-btn details-btn">
        👁️ Ver Detalles
      </button>
      <button @click="toggleFavorite" class="action-btn favorite-btn">
        {{ isFavorite ? '❤️ Quitar' : '⭐ Favorito' }}
      </button>
    </div>
    
    <!-- Puntos fuertes -->
    <div v-if="strengths.length > 0" class="strengths-section">
      <div class="strengths-label">✨ Puntos fuertes:</div>
      <div class="strengths-list">
        <span v-for="strength in strengths" :key="strength" class="strength-tag">
          {{ strength }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import type { ProgramComparisonData } from '@/types';

interface Props {
  program: ProgramComparisonData;
  index: number;
  isBestValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isBestValue: false,
});

interface Emits {
  (e: 'remove'): void;
}

const emit = defineEmits<Emits>();
const router = useRouter();
const favoritesStore = useFavoritesStore();

// ... resto del código se mantiene igual
</script>

<style scoped>
.comparison-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comparison-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.best-card {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fff9c4 0%, #fffde7 100%);
}

.card-color-1 {
  border-left: 4px solid #4ecdc4;
}

.card-color-2 {
  border-left: 4px solid #ff6b6b;
}

.card-color-3 {
  border-left: 4px solid #45b7d1;
}

.card-color-4 {
  border-left: 4px solid #96ceb4;
}

/* Badge */
.card-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ff9800 100%);
  color: #333;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.3);
  z-index: 1;
}

/* Header */
.card-header {
  position: relative;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.program-name {
  color: #333;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  padding-right: 30px;
}

.university-name {
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff6b6b;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff5252;
  transform: scale(1.1);
}

/* Contenido */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #333;
  font-weight: 600;
}

.info-value.price {
  color: #28a745;
  font-size: 1rem;
}

/* Calificación */
.rating-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.rating-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 1.2rem;
  transition: color 0.3s;
}

.star.active {
  color: #ffd700;
}

.rating-value {
  font-weight: bold;
  color: #333;
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.9rem;
}

/* Requisitos */
.requirements-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.requirements-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.requirements-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.requirement-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.requirement-tag.exam {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.requirement-tag.interview {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.requirement-tag.easy {
  background: #e8f5e9;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

/* Horario */
.schedule-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.schedule-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.schedule-value {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 8px;
  flex: 1;
}

/* Acciones */
.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.9rem;
  min-width: 120px;
}

.details-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.details-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.favorite-btn {
  background: #ffd700;
  color: #333;
  border: 2px solid #ffd700;
}

.favorite-btn:hover {
  background: #ffc107;
  border-color: #ffc107;
  transform: translateY(-2px);
}

/* Puntos fuertes */
.strengths-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed #e0e0e0;
}

.strengths-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.strengths-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.strength-tag {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #bbdefb;
}

/* Responsive */
@media (max-width: 768px) {
  .comparison-card {
    padding: 1.25rem;
  }
  
  .program-name {
    font-size: 1.2rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .rating-section,
  .requirements-section,
  .schedule-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .card-badge {
    font-size: 0.75rem;
    padding: 4px 12px;
  }
  
  .strength-tag {
    font-size: 0.75rem;
  }
}
</style>