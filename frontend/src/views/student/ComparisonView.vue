<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Comparador</p>
        <h1>Compara sin perder el limite de vista</h1>
      </div>
      <RouterLink class="primary-link accent" to="/student/plans">{{ upgradeLabel }}</RouterLink>
    </section>

    <section class="plan-summary-grid">
      <StudentPlanCard :plan-info="planInfo" />
      <article class="student-card">
        <span>Uso del plan</span>
        <h2>{{ comparisonsLimitLabel }} comparaciones usadas</h2>
        <PlanUsageBar label="Comparaciones" :used="usage.comparisons" :limit="limits.comparisons" hint="BASIC permite comparar mas. PLUS amplia la decision con insights." />
      </article>
    </section>

    <article v-if="isLimitReached('comparisons')" class="student-card upsell-inline">
      <strong>Has usado todas tus comparaciones del plan {{ plan.toUpperCase() }}.</strong>
      <RouterLink class="primary-link" to="/student/plans">Ampliar comparador</RouterLink>
    </article>

    <div class="comparison-table">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Universidad</th>
            <th>Ciudad</th>
            <th>Modalidad</th>
            <th>Precio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comparison in comparisons" :key="comparison.id">
            <td>{{ comparison.item.nombre }}</td>
            <td>{{ comparison.tipo }}</td>
            <td>{{ comparison.item.universidadNombre || '-' }}</td>
            <td>{{ comparison.item.universidadCiudad || '-' }}</td>
            <td>{{ comparison.item.modalidad || '-' }}</td>
            <td>{{ formatPrice(comparison.item.precio) }}</td>
            <td><button type="button" @click="deleteComparison(comparison.id)">Quitar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!comparisons.length && !loading" class="empty">Agrega programas o universidades para compararlos.</p>

    <UpgradeModal :model-value="upsell" @close="dismissUpgradeModal" />
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import PlanUsageBar from '@/components/student/PlanUsageBar.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import StudentPlanCard from '@/components/student/StudentPlanCard.vue';
import UpgradeModal from '@/components/student/UpgradeModal.vue';
import { useStudentStore } from '@/stores/student';

const studentStore = useStudentStore();
const { comparisons, comparisonsLimitLabel, loading, planInfo, plan, limits, usage, upsell } = storeToRefs(studentStore);
const { fetchComparisons, fetchPlan, deleteComparison, isLimitReached, dismissUpgradeModal } = studentStore;

const upgradeLabel = computed(() => plan.value === 'free' ? 'Mejorar a BASIC' : plan.value === 'basic' ? 'Mejorar a PLUS' : 'PLUS activo');
const formatPrice = (value?: number | null) =>
  value === null || value === undefined
    ? '-'
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

onMounted(() => {
  void Promise.all([fetchComparisons(), fetchPlan()]);
});
</script>

<style scoped src="./student.css"></style>
