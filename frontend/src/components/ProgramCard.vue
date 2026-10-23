<template>
  <article class="program-card" @click="goToDetails">
    <div class="card-top">
      <span class="badge">{{ program.modalidad || program.modality || 'Modalidad no definida' }}</span>
      <span v-if="showCompatibility" class="compatibility">{{ compatibilityScore }}% contigo</span>
      <span class="price">{{ formattedPrice }}</span>
    </div>

    <div class="card-body">
      <h3>{{ programName }}</h3>
      <p>{{ shortDescription }}</p>

      <dl class="meta">
        <div>
          <dt>Universidad</dt>
          <dd>{{ universityName }}</dd>
        </div>
        <div>
          <dt>Ciudad</dt>
          <dd>{{ universityCity }}</dd>
        </div>
        <div>
          <dt>Duracion</dt>
          <dd>{{ program.duracion || program.duration || 'No definida' }}</dd>
        </div>
      </dl>

      <div v-if="visibleDynamicFields.length" class="dynamic-fields">
        <span v-for="field in visibleDynamicFields" :key="field.fieldId" class="field-pill">
          {{ field.etiqueta }}: {{ formatDynamicValue(field.value) }}
        </span>
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
        {{ isFavorite ? 'Favorito' : 'Guardar' }}
      </button>
      <FeatureLock
        v-else
        :locked="favoriteLocked"
        :label="isFavorite ? 'Favorito' : 'Guardar'"
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
            {{ isFavorite ? 'Favorito' : 'Guardar' }}
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
      <FeatureLock
        v-if="authStore.isStudent"
        :locked="applicationLocked"
        label="Iniciar inscripcion"
        tooltip="Disponible en plan PLUS"
        @locked-click="showLockedFeature('applications')"
      >
        <template #default="{ locked }">
          <button
            type="button"
            class="action-btn premium"
            :disabled="locked"
            @click.stop="startApplication"
          >
            <span v-if="locked" aria-hidden="true">Bloqueado</span>
            {{ locked ? 'PLUS' : 'Iniciar inscripcion' }}
          </button>
        </template>
      </FeatureLock>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';
import { useStudentStore, type StudentFeature } from '@/stores/student';
import FeatureLock from '@/components/student/FeatureLock.vue';
import type { DynamicFieldValue } from '@/types';
import type { SearchProgram } from '@/stores/search';

type ProgramCardModel = Partial<SearchProgram> & {
  name?: string;
  description?: string;
  price?: number;
  modality?: string;
  duration?: string;
  universityId?: string;
  universityName?: string;
  universityCity?: string;
  dynamicFields?: DynamicFieldValue[];
  compatibilityScore?: number;
  recommendedForYou?: boolean;
};

const props = withDefaults(
  defineProps<{
    program: ProgramCardModel;
    showActions?: boolean;
  }>(),
  {
    showActions: true,
  }
);

const router = useRouter();
const comparisonStore = useComparisonStore();
const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();
const studentStore = useStudentStore();

const programId = computed(() => props.program.id || '');
const universityId = computed(() => props.program.universidadId || props.program.universityId || '');
const programName = computed(() => props.program.nombre || props.program.name || 'Sin nombre');
const universityName = computed(
  () => props.program.universidadNombre || props.program.universityName || 'Universidad'
);
const universityCity = computed(
  () => props.program.universidadCiudad || props.program.universityCity || '-'
);
const description = computed(() => props.program.descripcion || props.program.description || '');
const numericPrice = computed(() =>
  Number(props.program.precio ?? props.program.price ?? 0)
);
const formattedPrice = computed(() =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericPrice.value)
);
const compatibilityScore = computed(() => Number(props.program.compatibilityScore || 0));
const showCompatibility = computed(() =>
  authStore.isStudent && authStore.user?.plan === 'plus' && compatibilityScore.value > 0
);
const visibleDynamicFields = computed(() =>
  (props.program.dynamicFields || [])
    .filter((field) => field?.visibleInCard === true && field?.value !== null && field?.value !== '')
    .slice(0, 3)
);
const shortDescription = computed(() => {
  const text = description.value;
  if (!text) return 'Explora este programa y sus condiciones de estudio.';
  return text.length > 150 ? `${text.slice(0, 150)}...` : text;
});
const isFavorite = computed(() =>
  programId.value
    ? authStore.isStudent
      ? studentStore.isFavorite('programa', programId.value)
      : favoritesStore.isProgramFavorite(programId.value, universityId.value)
    : false
);
const isInComparison = computed(() =>
  programId.value && universityId.value
    ? authStore.isStudent
      ? studentStore.isInComparison('programa', programId.value)
      : comparisonStore.isProgramInComparison(programId.value, universityId.value)
    : false
);
const favoriteLocked = computed(() =>
  authStore.isStudent && !isFavorite.value && studentStore.isLimitReached('favorites')
);
const comparisonLocked = computed(() =>
  authStore.isStudent && !isInComparison.value && studentStore.isLimitReached('comparisons')
);
const applicationLocked = computed(() =>
  authStore.isStudent && !studentStore.canUseFeature('applications')
);

const goToDetails = () => {
  if (!programId.value || !universityId.value) return;
  router.push(`/program/${universityId.value}/${programId.value}`);
};

const toggleFavorite = () => {
  if (!programId.value) return;
  if (authStore.isStudent) {
    const existing = studentStore.favorites.find((item) => item.tipo === 'programa' && item.refId === programId.value);
    if (existing) {
      void studentStore.deleteFavorite(existing.id);
      return;
    }
    void studentStore.addFavorite('programa', programId.value);
    return;
  }
  favoritesStore.toggleProgramFavorite({
    id: programId.value,
    name: programName.value,
    description: description.value,
  });
};

const toggleComparison = () => {
  if (!programId.value || !universityId.value) return;

  if (authStore.isStudent) {
    const existing = studentStore.comparisons.find((item) => item.tipo === 'programa' && item.refId === programId.value);
    if (existing) {
      void studentStore.deleteComparison(existing.id);
      return;
    }
    void studentStore.addComparison('programa', programId.value);
    return;
  }

  if (isInComparison.value) {
    comparisonStore.removeProgramFromComparison(programId.value, universityId.value);
    return;
  }

  comparisonStore.addProgramToComparison(
    programId.value,
    universityId.value,
    programName.value,
    universityName.value,
    {
      duration: props.program.duracion || props.program.duration || '',
      price: numericPrice.value,
      modality: props.program.modalidad || props.program.modality || '',
      level: '',
      schedule: '',
    }
  );
};

const startApplication = async () => {
  if (!programId.value) return;
  try {
    const application = await studentStore.createApplication(programId.value);
    await router.push(`/student/applications/${application.id}`);
  } catch {
    if (!studentStore.canUseFeature('applications')) {
      showLockedFeature('applications');
    }
  }
};

const formatDynamicValue = (value: DynamicFieldValue['value']) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return value || '-';
};

const showLockedFeature = (feature: StudentFeature) => {
  const target = studentStore.getUpgradeTarget(feature);
  if (feature === 'applications') {
    studentStore.openUpgradeModal(
      'Gestiona tu inscripcion con acompanamiento personalizado en plan PLUS.',
      'plus'
    );
    return;
  }
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
.program-card {
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

.program-card:hover {
  border-color: var(--ea-accent);
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.card-top,
.card-actions,
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
.compatibility,
.price,
.field-pill {
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 10px;
}

.badge {
  background: #ccfbf1;
  color: #115e59;
}

.price {
  background: #fef3c7;
  color: #92400e;
}

.compatibility {
  background: #dcfce7;
  color: #166534;
}

.field-pill {
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

.meta {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 14px 0 0;
}

.meta dt {
  color: #64748b;
  font-size: 0.78rem;
}

.meta dd {
  color: #0f172a;
  font-weight: 700;
  margin: 4px 0 0;
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
  background: #0f766e;
  color: #fff;
}

.action-btn.premium {
  background: #b45309;
  color: #fff;
}

@media (max-width: 720px) {
  .meta {
    grid-template-columns: 1fr;
  }
}
</style>
