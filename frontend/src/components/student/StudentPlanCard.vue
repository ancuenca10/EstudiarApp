<template>
  <article class="plan-card-shell" :class="plan">
    <div class="plan-top">
      <div>
        <span class="eyebrow">Tu plan</span>
        <h2>{{ planTitle }}</h2>
      </div>
      <strong class="current-badge">Plan actual</strong>
    </div>

    <div class="price-row">
      <strong>{{ priceLabel }}</strong>
      <span>{{ statusLabel }}</span>
    </div>

    <p v-if="expirationLabel">{{ expirationLabel }}</p>
    <p v-else>{{ plan === 'free' ? 'Empieza limitado. BASIC y PLUS desbloquean mas decision y acompanamiento.' : 'Activo para este ciclo de suscripcion.' }}</p>

    <div class="usage-list">
      <PlanUsageBar label="Favoritos" :used="usage.favorites" :limit="limits.favorites" />
      <PlanUsageBar label="Comparaciones" :used="usage.comparisons" :limit="limits.comparisons" />
    </div>

    <RouterLink v-if="upgradeTarget" class="upgrade-cta" to="/student/plans">
      Mejorar a {{ upgradeTarget.toUpperCase() }}
    </RouterLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { StudentPlan, StudentPlanInfo } from '@/stores/student';
import PlanUsageBar from './PlanUsageBar.vue';

const props = defineProps<{
  planInfo: StudentPlanInfo | null;
}>();

const plan = computed<StudentPlan>(() => props.planInfo?.plan || 'free');
const planTitle = computed(() => {
  if (plan.value === 'plus') return 'Plan Plus activo';
  if (plan.value === 'basic') return 'Plan Basico activo';
  return 'Plan gratuito';
});
const limits = computed(() => props.planInfo?.limits || {
  favorites: 10,
  comparisons: 3,
  advisorAccess: false,
  recommendations: 'basic',
  alerts: false,
  processTracking: false,
});
const usage = computed(() => props.planInfo?.usage || { favorites: 0, comparisons: 0 });
const priceLabel = computed(() => {
  if (plan.value === 'plus') return '$9.800 COP / mes';
  if (plan.value === 'basic') return '$4.800 COP / mes';
  return '$0 COP';
});
const statusLabel = computed(() => props.planInfo?.estadoSuscripcion === 'active' || plan.value === 'free' ? 'Activo' : 'Inactivo');
const expirationLabel = computed(() => props.planInfo?.fechaFinPlan ? `Expira el ${new Date(props.planInfo.fechaFinPlan).toLocaleDateString('es-CO')}` : '');
const upgradeTarget = computed<StudentPlan | null>(() => {
  if (plan.value === 'free') return 'basic';
  if (plan.value === 'basic') return 'plus';
  return null;
});
</script>

<style scoped>
.plan-card-shell {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 16px;
  padding: 20px;
}

.plan-card-shell.free {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}

.plan-card-shell.basic {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #93c5fd;
}

.plan-card-shell.plus {
  background: linear-gradient(135deg, #fffbeb, #fef3c7 45%, #fde68a);
  border-color: #f59e0b;
  box-shadow: 0 18px 40px rgba(217, 119, 6, 0.16);
}

.plan-top,
.price-row {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.eyebrow,
.current-badge,
.price-row span {
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.eyebrow {
  color: #475569;
}

h2 {
  color: #0f172a;
  font-size: 2rem;
  margin: 4px 0 0;
}

.current-badge {
  background: #0f172a;
  border-radius: 999px;
  color: #fff;
  padding: 7px 10px;
}

.price-row strong {
  color: #0f172a;
  font-size: 1.35rem;
}

.price-row span {
  color: #047857;
}

p {
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.usage-list {
  display: grid;
  gap: 14px;
}

.upgrade-cta {
  animation: ctaPulse 2.8s ease-in-out infinite;
  background: #0f766e;
  border-radius: 8px;
  color: #fff;
  font-weight: 900;
  justify-self: start;
  padding: 11px 14px;
  text-decoration: none;
}

.plus .upgrade-cta {
  background: #92400e;
}

@keyframes ctaPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
</style>
