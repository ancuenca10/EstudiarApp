<!-- src/components/programs/ProgramCard.vue -->
<template>
  <div class="program-card" @click="goToProgramDetails">
    <div class="program-header">
      <div class="program-title-container">
        <h3 class="program-title">{{ program.name || 'Programa sin nombre' }}</h3>
        <div class="program-actions" @click.stop>
          <button 
            @click="toggleProgramFavorite" 
            class="icon-btn favorite-btn"
            :class="{ active: isProgramFavorite }"
            :title="isProgramFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          >
            <span class="btn-icon">{{ isProgramFavorite ? '★' : '☆' }}</span>
          </button>
          
          <button 
            @click="toggleProgramComparison" 
            class="icon-btn compare-btn"
            :class="{ active: isProgramInComparison }"
            :disabled="isProgramInComparison || isComparisonFull"
            :title="isProgramInComparison ? 'En comparación' : comparisonFull ? 'Máximo alcanzado' : 'Comparar programa'"
          >
            <span class="btn-icon">{{ isProgramInComparison ? '✓' : '⚖️' }}</span>
          </button>
        </div>
      </div>
      
      <div class="program-badges">
        <span v-if="program.level" class="level-badge">
          📚 {{ program.level }}
        </span>
        <span v-if="program.modality" class="modality-badge">
          💼 {{ program.modality }}
        </span>
      </div>
    </div>
    
    <div class="program-details">
      <div class="detail-row">
        <span v-if="program.duration" class="detail-item">
          ⏱️ {{ program.duration }}
        </span>
        <span v-if="program.cost" class="detail-item">
          💰 {{ program.cost }}
        </span>
      </div>
      
      <p v-if="program.description" class="program-description">
        {{ truncatedDescription }}
      </p>
      
      <div class="program-footer">
        <span class="university-name">
          <span class="university-icon">🏛️</span>
          {{ universityName || 'Universidad' }}
        </span>
        <button class="details-btn" @click.stop="goToProgramDetails">
          Ver detalles →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';

interface Program {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  duration?: string;
  level?: string;
  modality?: string;
  cost?: string;
  universityId?: string;
  universityName?: string;
}

const props = defineProps<{
  program: Program;
  universityName?: string;
  universityId?: string;
}>();

const router = useRouter();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

// Obtener ID del programa
const getProgramId = (): string => {
  return props.program?.id || props.program?._id || 
         `${props.universityId}-${props.program.name}`.toLowerCase().replace(/\s+/g, '-');
};

// Computed properties
const truncatedDescription = computed(() => {
  const desc = props.program.description || '';
  return desc.length > 120 ? desc.substring(0, 120) + '...' : desc;
});

const isProgramFavorite = computed(() => {
  const programId = getProgramId();
  return favoritesStore.programFavorites.some((fav: any) => {
    const favId = fav.id || fav._id;
    return favId === programId;
  });
});

const isProgramInComparison = computed(() => {
  const programId = getProgramId();
  return comparisonStore.programComparisonItems.some((item: any) => {
    const itemId = item.id || item._id;
    return itemId === programId;
  });
});

const isComparisonFull = computed(() => {
  return comparisonStore.programComparisonItems.length >= 3;
});

// Métodos
const goToProgramDetails = () => {
  const programId = getProgramId();
  router.push({
    name: 'ProgramDetails',
    params: { 
      id: programId,
      universityId: props.universityId || ''
    },
    query: {
      universityName: props.universityName || ''
    }
  });
};

const toggleProgramFavorite = () => {
  const programId = getProgramId();
  
  if (isProgramFavorite.value) {
    favoritesStore.removeProgramFavorite(programId);
  } else {
    const programToAdd = {
      id: programId,
      _id: programId,
      name: props.program.name || 'Programa sin nombre',
      description: props.program.description || '',
      duration: props.program.duration || '',
      level: props.program.level || '',
      modality: props.program.modality || '',
      cost: props.program.cost || '',
      universityId: props.universityId || '',
      universityName: props.universityName || 'Universidad'
    };
    favoritesStore.addProgramFavorite(programToAdd);
  }
};

const toggleProgramComparison = () => {
  if (isProgramInComparison.value) return;
  
  if (isComparisonFull.value) {
    alert('Máximo 3 programas en comparación. Elimina uno para agregar otro.');
    return;
  }
  
  const programId = getProgramId();
  const programToAdd = {
    id: programId,
    _id: programId,
    name: props.program.name || 'Programa sin nombre',
    description: props.program.description || '',
    duration: props.program.duration || '',
    level: props.program.level || '',
    modality: props.program.modality || '',
    cost: props.program.cost || '',
    universityId: props.universityId || '',
    universityName: props.universityName || 'Universidad'
  };
  
  comparisonStore.addProgramToComparison(programToAdd);
};
</script>

<style scoped>
.program-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.program-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  border-left-color: #5a6fd8;
}

.program-header {
  margin-bottom: 1rem;
}

.program-title-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.program-title {
  margin: 0;
  color: #333;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
}

.program-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: transparent;
}

.favorite-btn {
  color: #999;
}

.favorite-btn:hover {
  color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
}

.favorite-btn.active {
  color: #FFA500;
  background: rgba(255, 215, 0, 0.2);
}

.compare-btn {
  color: #999;
}

.compare-btn:hover:not(:disabled) {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.compare-btn.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.compare-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.program-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.level-badge, .modality-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.level-badge {
  background: #e8f5e9;
  color: #2e7d32;
}

.modality-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.program-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.9rem;
}

.program-description {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  flex: 1;
}

.program-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.university-name {
  color: #666;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.university-icon {
  font-size: 0.9rem;
}

.details-btn {
  padding: 0.4rem 0.8rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.details-btn:hover {
  background: #5a6fd8;
}

/* Responsive */
@media (max-width: 768px) {
  .program-title-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .program-actions {
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
  
  .program-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .details-btn {
    width: 100%;
  }
}
</style>