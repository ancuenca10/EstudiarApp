<template>
  <article class="university-card">
    <div class="cover">
      <div class="avatar">{{ initials }}</div>
      <span class="ea-badge">{{ university.city || 'Ciudad por definir' }}</span>
    </div>

    <h3>{{ university.name || university.nombre }}</h3>
    <p>{{ university.description || university.descripcion || 'Institucion de educacion superior.' }}</p>

    <div class="metrics">
      <span>
        <strong>{{ programsCount }}</strong>
        <small>Programas</small>
      </span>
      <span>
        <strong>{{ rating }}</strong>
        <small>Rating</small>
      </span>
    </div>

    <div class="card-actions">
      <button class="ea-btn ea-btn-primary" type="button" @click="$emit('view', university)">Ver</button>
      <button class="ea-btn ea-btn-secondary" type="button" @click="$emit('compare', university)">
        {{ isCompared ? 'Comparando' : 'Comparar' }}
      </button>
      <button
        class="heart-btn"
        type="button"
        :aria-label="isFavorite ? 'Quitar favorito' : 'Agregar favorito'"
        @click="$emit('favorite', university)"
      >
        {{ isFavorite ? 'Favorita' : 'Guardar' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UniversityLike = {
  id?: string;
  _id?: string;
  name?: string;
  nombre?: string;
  city?: string;
  ciudad?: string;
  description?: string;
  descripcion?: string;
  programs?: unknown[];
  programas?: unknown[];
  rating?: number | null;
};

const props = withDefaults(defineProps<{
  university: UniversityLike;
  isCompared?: boolean;
  isFavorite?: boolean;
}>(), {
  isCompared: false,
  isFavorite: false,
});

defineEmits<{
  view: [university: UniversityLike];
  compare: [university: UniversityLike];
  favorite: [university: UniversityLike];
}>();

const displayName = computed(() => props.university.name || props.university.nombre || 'Universidad');
const initials = computed(() =>
  displayName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
);
const programsCount = computed(() => (props.university.programs || props.university.programas || []).length);
const rating = computed(() => props.university.rating?.toFixed?.(1) || 'N/D');
</script>

<style scoped>
.university-card {
  overflow: hidden;
  background: var(--ea-surface);
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.university-card:hover {
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.cover {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 112px;
  padding: 18px;
  background: #e8f1ff;
  border-bottom: 1px solid var(--ea-border);
}

.avatar {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border: 1px solid #c7d7ef;
  border-radius: var(--ea-radius-lg);
  background: #fff;
  color: var(--ea-primary);
  font-weight: 900;
}

h3,
p,
.metrics,
.card-actions {
  margin-left: 18px;
  margin-right: 18px;
}

h3 {
  margin-top: 18px;
  margin-bottom: 8px;
  color: var(--ea-text);
}

p {
  display: -webkit-box;
  min-height: 48px;
  margin-top: 0;
  overflow: hidden;
  color: var(--ea-muted);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.metrics span {
  border-radius: var(--ea-radius-md);
  background: var(--ea-surface-muted);
  padding: 12px;
}

.metrics strong,
.metrics small {
  display: block;
}

.metrics small {
  color: var(--ea-muted);
  font-weight: 800;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
  margin-bottom: 18px;
}

.heart-btn {
  grid-column: 1 / -1;
  min-height: 40px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  color: var(--ea-danger);
  cursor: pointer;
  font-weight: 800;
}
</style>
