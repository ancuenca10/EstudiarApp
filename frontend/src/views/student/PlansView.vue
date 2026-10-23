<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Planes</p>
        <h1>Elige cuanto poder de decision quieres</h1>
      </div>
      <RouterLink class="primary-link" to="/student">Panel</RouterLink>
    </section>

    <section class="plan-summary-grid">
      <StudentPlanCard :plan-info="planInfo" />
      <article class="student-card value-card">
        <span>Diferencias visibles</span>
        <h2>{{ planMessage }}</h2>
        <div class="usage-list">
          <PlanUsageBar label="Favoritos" :used="usage.favorites" :limit="limits.favorites" />
          <PlanUsageBar label="Comparaciones" :used="usage.comparisons" :limit="limits.comparisons" />
        </div>
      </article>
    </section>

    <section class="plan-grid premium-grid">
      <article
        v-for="card in planCards"
        :key="card.key"
        class="student-card plan-card"
        :class="[card.key, { active: planInfo?.plan === card.key }]"
      >
        <div class="plan-card-head">
          <span>{{ card.name }}</span>
          <strong v-if="planInfo?.plan === card.key">Plan actual</strong>
        </div>
        <h3>{{ card.price }}</h3>
        <p>{{ card.description }}</p>
        <ul class="feature-checklist">
          <li v-for="feature in card.features" :key="feature.label" :class="{ locked: !feature.enabled }">
            <strong>{{ feature.enabled ? '✓' : '×' }}</strong>
            <span>{{ feature.label }}</span>
          </li>
        </ul>
        <button type="button" :disabled="planInfo?.plan === card.key" @click="upgradePlan(card.key)">
          {{ planInfo?.plan === card.key ? 'Tu plan actual' : `Mejorar a ${card.name}` }}
        </button>
      </article>
    </section>
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import PlanUsageBar from '@/components/student/PlanUsageBar.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import StudentPlanCard from '@/components/student/StudentPlanCard.vue';
import { useStudentStore, type StudentPlan } from '@/stores/student';

const studentStore = useStudentStore();
const { planInfo, plan, limits, usage } = storeToRefs(studentStore);
const { fetchPlan, upgradePlan } = studentStore;

const planMessage = computed(() => {
  if (plan.value === 'plus') return 'Tienes recomendaciones inteligentes, insights y acompanamiento completo.';
  if (plan.value === 'basic') return 'Ya tienes mas capacidad. PLUS suma personalizacion avanzada.';
  return 'FREE muestra el producto. BASIC y PLUS muestran el verdadero valor.';
});

const planCards = computed<Array<{
  key: StudentPlan;
  name: string;
  price: string;
  description: string;
  features: Array<{ label: string; enabled: boolean }>;
}>>(() => [
  {
    key: 'free',
    name: 'FREE',
    price: '$0 COP',
    description: 'Para explorar con limites visibles.',
    features: [
      { label: '10 favoritos', enabled: true },
      { label: '3 comparaciones', enabled: true },
      { label: 'Recomendaciones basicas', enabled: true },
      { label: 'Alertas', enabled: false },
      { label: 'Asesoria', enabled: false },
      { label: 'Insights avanzados', enabled: false },
    ],
  },
  {
    key: 'basic',
    name: 'BASIC',
    price: '$4.800 COP / mes',
    description: 'Para no perder oportunidades y comparar mejor.',
    features: [
      { label: '30 favoritos', enabled: true },
      { label: '5 comparaciones', enabled: true },
      { label: 'Alertas de programas', enabled: true },
      { label: 'Contacto asesor', enabled: true },
      { label: 'Recomendaciones mejoradas', enabled: true },
      { label: 'Personalizacion avanzada', enabled: false },
    ],
  },
  {
    key: 'plus',
    name: 'PLUS',
    price: '$9.800 COP / mes',
    description: 'Para decidir con prioridad, seguimiento e insights.',
    features: [
      { label: 'Favoritos ilimitados', enabled: true },
      { label: '10 comparaciones', enabled: true },
      { label: 'Recomendaciones inteligentes', enabled: true },
      { label: 'Prioridad en resultados', enabled: true },
      { label: 'Asesoria personalizada', enabled: true },
      { label: 'Insights avanzados', enabled: true },
    ],
  },
]);

onMounted(() => {
  void fetchPlan();
});
</script>

<style scoped src="./student.css"></style>
