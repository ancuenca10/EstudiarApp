<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Panel estudiante</p>
        <h1>Tu cuenta y oportunidades</h1>
      </div>
      <RouterLink class="primary-link accent" to="/student/plans">{{ dashboardCta }}</RouterLink>
    </section>

    <section class="dashboard-hero">
      <StudentPlanCard :plan-info="planInfo" />
      <article class="student-card value-card">
        <span>Lo que tienes disponible</span>
        <h2>{{ valueHeadline }}</h2>
        <ul class="feature-checklist">
          <li v-for="feature in availableFeatures" :key="feature.label" :class="{ locked: !feature.enabled }">
            <strong>{{ feature.enabled ? '✓' : '×' }}</strong>
            <span>{{ feature.label }}</span>
            <small v-if="!feature.enabled">{{ feature.required }}</small>
          </li>
        </ul>
      </article>
    </section>

    <section class="usage-panel">
      <PlanUsageBar label="Favoritos" :used="usage.favorites" :limit="limits.favorites" hint="Guarda universidades y programas para volver rapido." />
      <PlanUsageBar label="Comparaciones" :used="usage.comparisons" :limit="limits.comparisons" hint="Compara antes de tomar una decision." />
    </section>

    <section v-if="alerts.length" class="student-section">
      <div class="section-title">
        <h2>Alertas</h2>
        <RouterLink to="/student/plans">Activa mas alertas</RouterLink>
      </div>
      <div class="alert-list">
        <article v-for="alert in alerts" :key="alert.id" class="student-card row-card alert-card">
          <div>
            <span>{{ alert.tipo }}</span>
            <h3>{{ alert.titulo }}</h3>
            <p>{{ alert.descripcion }}</p>
          </div>
        </article>
      </div>
    </section>

    <section v-if="insights" class="student-section">
      <div class="section-title">
        <h2>Insights</h2>
        <RouterLink to="/student/plans">{{ canUseFeature('plusInsights') ? 'PLUS activo' : 'Ver PLUS' }}</RouterLink>
      </div>
      <div class="insight-grid">
        <article class="student-card">
          <span>Tus intereses principales</span>
          <div class="pill-row">
            <strong v-for="area in insights.topAreas.slice(0, 6)" :key="area">{{ area }}</strong>
          </div>
        </article>
        <article class="student-card locked-insight" :class="{ locked: !canUseFeature('plusInsights') }">
          <span>Coincidencia PLUS</span>
          <h3>{{ bestCompatibility }}</h3>
          <p>{{ canUseFeature('plusInsights') ? 'Este programa coincide contigo por comportamiento e intereses.' : 'Este programa coincide contigo. Desbloquea el porcentaje exacto con PLUS.' }}</p>
        </article>
      </div>
    </section>

    <section class="student-section">
      <div class="section-title">
        <h2>Recomendaciones</h2>
        <RouterLink to="/student/preferences">Ajustar preferencias</RouterLink>
      </div>
      <div class="recommendation-grid">
        <article v-for="program in recommendations" :key="program.id" class="student-card">
          <div class="card-top">
            <span>{{ program.universidadCiudad }}</span>
            <strong v-if="canUseFeature('plusInsights')">{{ program.compatibilityScore || program.score }}%</strong>
            <strong v-else>PLUS</strong>
          </div>
          <span v-if="program.recommendedForYou" class="recommendation-badge">Recomendado para ti</span>
          <h3>{{ program.nombre }}</h3>
          <p>{{ program.universidadNombre }}</p>
          <small>{{ program.reasons.join(' - ') }}</small>
          <div class="actions">
            <FeatureLock :locked="isLimitReached('favorites')" label="Guardar" :tooltip="`Disponible con ${getUpgradeTarget('favorites').toUpperCase()}`">
              <template #default="{ locked }">
                <button type="button" :disabled="locked" @click="locked ? showLimit('favorites') : addFavorite('programa', program.id)">
                  <span v-if="locked" aria-hidden="true">🔒</span>
                  Guardar
                </button>
              </template>
            </FeatureLock>
            <FeatureLock :locked="isLimitReached('comparisons')" label="Comparar" :tooltip="`Disponible con ${getUpgradeTarget('comparisons').toUpperCase()}`">
              <template #default="{ locked }">
                <button type="button" :disabled="locked" @click="locked ? showLimit('comparisons') : addComparison('programa', program.id)">
                  <span v-if="locked" aria-hidden="true">🔒</span>
                  Comparar
                </button>
              </template>
            </FeatureLock>
          </div>
        </article>
      </div>
      <p v-if="!recommendations.length && !loading" class="empty">Completa tus preferencias para recibir recomendaciones mas precisas.</p>
    </section>

    <UpgradeModal :model-value="upsell" @close="dismissUpgradeModal" />
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import FeatureLock from '@/components/student/FeatureLock.vue';
import PlanUsageBar from '@/components/student/PlanUsageBar.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import StudentPlanCard from '@/components/student/StudentPlanCard.vue';
import UpgradeModal from '@/components/student/UpgradeModal.vue';
import { useStudentStore, type StudentFeature } from '@/stores/student';

const studentStore = useStudentStore();
const {
  profile,
  recommendations,
  alerts,
  insights,
  upsell,
  planInfo,
  plan,
  limits,
  usage,
  loading,
} = storeToRefs(studentStore);
const {
  hydrateDashboard,
  addFavorite,
  addComparison,
  canUseFeature,
  isLimitReached,
  getUpgradeTarget,
  openUpgradeModal,
  dismissUpgradeModal,
} = studentStore;

const dashboardCta = computed(() => plan.value === 'plus' ? 'PLUS activo' : `Mejorar a ${plan.value === 'free' ? 'BASIC' : 'PLUS'}`);
const valueHeadline = computed(() => plan.value === 'free' ? 'FREE es suficiente para explorar, no para decidir a fondo' : 'Tu plan ya desbloquea ventajas de decision');
const bestCompatibility = computed(() => {
  const best = insights.value?.compatibilityScores?.[0];
  if (!best) return 'Aun sin suficiente actividad';
  return canUseFeature('plusInsights') ? `${best.score}% con ${best.programName}` : `${best.programName}`;
});

const availableFeatures = computed(() => [
  { label: 'Guardar favoritos', enabled: true, required: '' },
  { label: 'Comparar programas', enabled: true, required: '' },
  { label: 'Alertas de oportunidades', enabled: canUseFeature('alerts'), required: 'BASIC' },
  { label: 'Contacto asesor', enabled: canUseFeature('advisor'), required: 'BASIC' },
  { label: 'Recomendaciones inteligentes', enabled: canUseFeature('advancedRecommendations'), required: 'PLUS' },
  { label: 'Insights avanzados', enabled: canUseFeature('plusInsights'), required: 'PLUS' },
]);

const showLimit = (feature: StudentFeature) => {
  const target = getUpgradeTarget(feature);
  const message = feature === 'favorites'
    ? `Has alcanzado el limite de favoritos de tu plan ${plan.value.toUpperCase()}. Desbloquea mas funciones con ${target.toUpperCase()}.`
    : `Has alcanzado el limite de comparaciones de tu plan ${plan.value.toUpperCase()}. Desbloquea mas funciones con ${target.toUpperCase()}.`;
  openUpgradeModal(message, target);
};

onMounted(() => {
  void hydrateDashboard();
});
</script>

<style scoped src="./student.css"></style>
