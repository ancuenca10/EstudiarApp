<template>
  <article class="university-card" @click="goToDetails">
    <div class="card-top">
      <span class="badge city">{{ university.ciudad || university.city || 'Sin ciudad' }}</span>
      <span class="program-count">{{ programsCount }} programas</span>
    </div>

    <div class="card-body">
      <h3>{{ universityName }}</h3>
      <p>{{ shortDescription }}</p>

      <div v-if="visibleDynamicFields.length" class="dynamic-fields">
        <span v-for="field in visibleDynamicFields" :key="field.fieldId" class="field-pill">
          {{ field.etiqueta }}: {{ formatDynamicValue(field.value) }}
        </span>
      </div>

      <div v-if="featuredPrograms.length" class="tags">
        <span v-for="program in featuredPrograms" :key="program.id">{{ program.nombre }}</span>
      </div>
    </div>

    <div v-if="showActions" class="card-actions">
      <button
        v-if="!authStore.isStudent"
        type="button"
        class="action-btn"
        :class="{ active: isFavorite }"
        @click.stop="toggleFavorite"
      >
        {{ isFavorite ? 'Favorita' : 'Favorito' }}
      </button>
      <FeatureLock
        v-else
        :locked="favoriteLocked"
        :label="isFavorite ? 'Favorita' : 'Favorito'"
        :tooltip="`Disponible en plan ${studentStore.getUpgradeTarget('favorites').toUpperCase()}`"
        @locked-click="showLockedFeature('favorites')"
      >
        <template #default="{ locked }">
          <button
            type="button"
            class="action-btn"
            :class="{ active: isFavorite }"
            :disabled="locked"
            @click.stop="toggleFavorite"
          >
            <span v-if="locked" aria-hidden="true">🔒</span>
            {{ isFavorite ? 'Favorita' : 'Favorito' }}
          </button>
        </template>
      </FeatureLock>
      <button
        v-if="!authStore.isStudent"
        type="button"
        class="action-btn secondary"
        :class="{ active: isInComparison }"
        @click.stop="toggleComparison"
      >
        {{ isInComparison ? 'En comparacion' : 'Comparar' }}
      </button>
      <FeatureLock
        v-else
        :locked="comparisonLocked"
        :label="isInComparison ? 'En comparacion' : 'Comparar'"
        :tooltip="`Disponible en plan ${studentStore.getUpgradeTarget('comparisons').toUpperCase()}`"
        @locked-click="showLockedFeature('comparisons')"
      >
        <template #default="{ locked }">
          <button
            type="button"
            class="action-btn secondary"
            :class="{ active: isInComparison }"
            :disabled="locked"
            @click.stop="toggleComparison"
          >
            <span v-if="locked" aria-hidden="true">🔒</span>
            {{ isInComparison ? 'En comparacion' : 'Comparar' }}
          </button>
        </template>
      </FeatureLock>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';
import { useComparisonStore } from '@/stores/comparison';
import { useAuthStore } from '@/stores/auth';
import { useStudentStore, type StudentFeature } from '@/stores/student';
import FeatureLock from '@/components/student/FeatureLock.vue';
import type { DynamicFieldValue } from '@/types';
import type { SearchProgram, SearchUniversity } from '@/stores/search';

type UniversityCardModel = Partial<SearchUniversity> & {
  city?: string;
  name?: string;
  description?: string;
  dynamicFields?: DynamicFieldValue[];
  programs?: Array<Partial<SearchProgram> & { name?: string; nombre?: string }>;
};

const props = withDefaults(
  defineProps<{
    university: UniversityCardModel;
    showActions?: boolean;
  }>(),
  {
    showActions: true,
  }
);

const router = useRouter();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();
const authStore = useAuthStore();
const studentStore = useStudentStore();

const universityId = computed(() => props.university.id || '');
const universityName = computed(() => props.university.nombre || props.university.name || 'Sin nombre');
const universityDescription = computed(
  () => props.university.descripcion || props.university.description || ''
);
const programs = computed(() => props.university.programas || props.university.programs || []);
const programsCount = computed(() => props.university.programasCount ?? programs.value.length);
const featuredPrograms = computed(() =>
  programs.value
    .map((program) => {
      const item = program as { id?: string; nombre?: string; name?: string };
      return {
        id: String(item.id ?? ''),
        nombre: String(item.nombre ?? item.name ?? 'Programa'),
      };
    })
    .filter((program) => program.id && program.nombre)
    .slice(0, 3)
);
const visibleDynamicFields = computed(() =>
  (props.university.dynamicFields || [])
    .filter((field) => field?.visibleInCard === true && field?.value !== null && field?.value !== '')
    .slice(0, 3)
);
const shortDescription = computed(() => {
  const text = universityDescription.value;
  if (!text) return 'Explora esta universidad y su oferta academica.';
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
});
const isFavorite = computed(() =>
  universityId.value
    ? authStore.isStudent
      ? studentStore.isFavorite('universidad', universityId.value)
      : favoritesStore.isUniversityFavorite(universityId.value)
    : false
);
const isInComparison = computed(() =>
  universityId.value
    ? authStore.isStudent
      ? studentStore.isInComparison('universidad', universityId.value)
      : comparisonStore.isUniversityInComparison(universityId.value)
    : false
);
const favoriteLocked = computed(() =>
  authStore.isStudent && !isFavorite.value && studentStore.isLimitReached('favorites')
);
const comparisonLocked = computed(() =>
  authStore.isStudent && !isInComparison.value && studentStore.isLimitReached('comparisons')
);

const goToDetails = () => {
  if (!universityId.value) return;
  router.push(`/university/${universityId.value}`);
};

const toggleFavorite = () => {
  if (!universityId.value) return;
  if (authStore.isStudent) {
    const existing = studentStore.favorites.find((item) => item.tipo === 'universidad' && item.refId === universityId.value);
    if (existing) {
      void studentStore.deleteFavorite(existing.id);
      return;
    }
    void studentStore.addFavorite('universidad', universityId.value);
    return;
  }
  favoritesStore.toggleUniversityFavorite({
    id: universityId.value,
    name: universityName.value,
    description: universityDescription.value,
  });
};

const toggleComparison = () => {
  if (!universityId.value) return;

  if (authStore.isStudent) {
    const existing = studentStore.comparisons.find((item) => item.tipo === 'universidad' && item.refId === universityId.value);
    if (existing) {
      void studentStore.deleteComparison(existing.id);
      return;
    }
    void studentStore.addComparison('universidad', universityId.value);
    return;
  }

  if (isInComparison.value) {
    comparisonStore.removeUniversityFromComparison(universityId.value);
    return;
  }

  comparisonStore.addUniversityToComparison({
    id: universityId.value,
    name: universityName.value,
    city: props.university.ciudad || props.university.city || '',
    country: 'Colombia',
    type: null,
    description: universityDescription.value,
    programs: programs.value,
    rating: null,
  });
};

const formatDynamicValue = (value: DynamicFieldValue['value']) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return value || '-';
};

const showLockedFeature = (feature: StudentFeature) => {
  const target = studentStore.getUpgradeTarget(feature);
  const noun = feature === 'favorites' ? 'favoritos' : 'comparaciones';
  studentStore.openUpgradeModal(
    `Has alcanzado el limite de ${noun}. Desbloquea mas funciones con ${target.toUpperCase()}.`,
    target
  );
};

onMounted(() => {
  authStore.checkAuth();
  if (authStore.isStudent) {
    void Promise.all([studentStore.fetchFavorites(), studentStore.fetchComparisons(), studentStore.fetchPlan()]);
  }
});
</script>

<style scoped>
.university-card {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.university-card:hover {
  border-color: var(--ea-primary);
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.card-top,
.card-actions,
.tags,
.dynamic-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-top {
  align-items: center;
  justify-content: space-between;
}

.badge,
.field-pill,
.tags span,
.program-count {
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 10px;
}

.badge,
.tags span {
  background: #e0f2fe;
  color: #075985;
}

.field-pill {
  background: #ecfccb;
  color: #3f6212;
}

.program-count {
  background: #eef2ff;
  color: #3730a3;
}

.card-body h3 {
  color: #0f172a;
  margin: 0 0 8px;
}

.card-body p {
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.card-actions {
  margin-top: auto;
}

.action-btn {
  background: var(--ea-primary);
  border: 0;
  border-radius: var(--ea-radius-sm);
  color: #fff;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.action-btn.secondary {
  background: #f8fafc;
  color: #0f172a;
}

.action-btn.active {
  background: var(--ea-accent);
  color: #fff;
}
</style>
