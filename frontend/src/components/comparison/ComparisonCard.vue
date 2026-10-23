<template>
  <article class="comparison-card" :class="cardClasses">
    <header class="card-header">
      <div>
        <p v-if="isBestValue" class="badge">Mejor valor</p>
        <h3>{{ program.name }}</h3>
        <p>{{ program.universityName }}</p>
      </div>
      <button type="button" class="remove-btn" @click="$emit('remove')">×</button>
    </header>

    <dl class="info-grid">
      <div>
        <dt>Nivel</dt>
        <dd>{{ program.level || '-' }}</dd>
      </div>
      <div>
        <dt>Modalidad</dt>
        <dd>{{ program.modality || '-' }}</dd>
      </div>
      <div>
        <dt>Duración</dt>
        <dd>{{ program.duration || '-' }}</dd>
      </div>
      <div>
        <dt>Precio</dt>
        <dd>{{ formatCurrency(program.price) }}</dd>
      </div>
    </dl>

    <div class="tags">
      <span v-if="program.schedule">{{ program.schedule }}</span>
      <span v-if="program.requires_exam">Examen</span>
      <span v-if="program.requires_interview">Entrevista</span>
      <span v-if="program.quality_rating">Calidad {{ program.quality_rating }}/5</span>
    </div>

    <footer class="actions">
      <button type="button" @click="viewDetails">Ver detalles</button>
      <button type="button" @click="toggleFavorite">
        {{ favoriteLabel }}
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import type { ProgramComparisonData } from '@/types';

const props = withDefaults(defineProps<{
  program: ProgramComparisonData;
  isBestValue?: boolean;
}>(), {
  isBestValue: false,
});

defineEmits<{
  (e: 'remove'): void;
}>();

const router = useRouter();
const favoritesStore = useFavoritesStore();

const cardClasses = computed(() => ({
  'is-best': props.isBestValue,
}));

const isFavorite = computed(() =>
  favoritesStore.isProgramFavorite(props.program.id, props.program.universityId)
);

const favoriteLabel = computed(() => (isFavorite.value ? 'Quitar favorito' : 'Favorito'));

const formatCurrency = (amount?: number) => {
  if (!amount) return 'No definido';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const toggleFavorite = () => {
  favoritesStore.toggleProgramFavorite({
    id: props.program.id,
    name: props.program.name,
    universityId: props.program.universityId,
    universityName: props.program.universityName,
    price: props.program.price,
    duration: props.program.duration,
    modality: props.program.modality,
  });
};

const viewDetails = () => {
  router.push('/comparison');
};
</script>

<style scoped>
.comparison-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.comparison-card.is-best {
  border-color: #f59e0b;
  box-shadow: 0 10px 24px rgba(245, 158, 11, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.card-header h3,
.card-header p {
  margin: 0;
}

.badge {
  margin: 0 0 0.25rem;
  color: #b45309;
  font-weight: 700;
  font-size: 0.8rem;
}

.remove-btn {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.info-grid dt {
  font-size: 0.8rem;
  color: #6b7280;
}

.info-grid dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tags span {
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 0.8rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.actions button {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}
</style>
