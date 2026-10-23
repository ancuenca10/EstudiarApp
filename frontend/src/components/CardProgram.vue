<template>
  <article class="program-card">
    <div class="card-top">
      <span class="ea-badge">{{ program.modalidad || program.modality || 'Modalidad por definir' }}</span>
      <button
        v-if="showFavorite"
        class="circle-btn"
        type="button"
        :aria-label="isFavorite ? 'Quitar favorito' : 'Agregar favorito'"
        @click="$emit('favorite', program)"
      >
        {{ isFavorite ? 'OK' : '+' }}
      </button>
    </div>

    <h3>{{ program.nombre || program.name }}</h3>
    <p class="university">{{ universityName }}</p>
    <p class="description">{{ program.descripcion || program.description || 'Sin descripcion disponible.' }}</p>

    <div class="meta-grid">
      <span>
        <small>Duracion</small>
        <strong>{{ program.duracion || program.duration || 'Por confirmar' }}</strong>
      </span>
      <span>
        <small>Precio</small>
        <strong>{{ formattedPrice }}</strong>
      </span>
    </div>

    <div class="card-actions">
      <button class="ea-btn ea-btn-primary" type="button" @click="$emit('view', program)">Ver detalles</button>
      <button
        class="ea-btn ea-btn-secondary"
        type="button"
        :class="{ active: isCompared }"
        @click="$emit('compare', program)"
      >
        {{ isCompared ? 'Comparando' : 'Comparar' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProgramCardData } from '@/stores/programs';

const props = withDefaults(defineProps<{
  program: Partial<ProgramCardData>;
  isCompared?: boolean;
  isFavorite?: boolean;
  showFavorite?: boolean;
}>(), {
  isCompared: false,
  isFavorite: false,
  showFavorite: true,
});

defineEmits<{
  view: [program: Partial<ProgramCardData>];
  compare: [program: Partial<ProgramCardData>];
  favorite: [program: Partial<ProgramCardData>];
}>();

const universityName = computed(() => props.program.universityName || 'Universidad por confirmar');

const formattedPrice = computed(() => {
  const raw = props.program.precio ?? props.program.price ?? props.program.cost;
  const value = Number(raw || 0);
  if (!value) return 'Consultar';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: props.program.currency || 'COP',
    maximumFractionDigits: 0,
  }).format(value);
});
</script>

<style scoped>
.program-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 22px;
  background: var(--ea-surface);
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.program-card:hover {
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.card-top,
.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.circle-btn {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  color: var(--ea-danger);
  cursor: pointer;
  font-size: 1.2rem;
}

h3 {
  margin: 0;
  color: var(--ea-text);
  font-size: 1.18rem;
}

.university {
  margin: -8px 0 0;
  color: var(--ea-primary);
  font-weight: 800;
}

.description {
  display: -webkit-box;
  min-height: 48px;
  margin: 0;
  overflow: hidden;
  color: var(--ea-muted);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.meta-grid span {
  border-radius: var(--ea-radius-md);
  background: var(--ea-surface-muted);
  padding: 12px;
}

.meta-grid small {
  display: block;
  color: var(--ea-muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.meta-grid strong {
  color: var(--ea-text);
}

.card-actions {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.ea-btn {
  flex: 1;
}

.active {
  background: var(--ea-primary-soft);
  color: var(--ea-primary-dark);
}
</style>
