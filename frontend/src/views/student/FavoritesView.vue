<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Favoritos</p>
        <h1>Tus guardados y limite del plan</h1>
      </div>
      <RouterLink class="primary-link accent" to="/student/plans">{{ upgradeLabel }}</RouterLink>
    </section>

    <section class="plan-summary-grid">
      <StudentPlanCard :plan-info="planInfo" />
      <article class="student-card">
        <span>Uso del plan</span>
        <h2>{{ favoritesLimitLabel }} favoritos usados</h2>
        <PlanUsageBar label="Favoritos" :used="usage.favorites" :limit="limits.favorites" hint="Cuando llegues al limite, necesitaras mejorar el plan para seguir guardando." />
      </article>
    </section>

    <article v-if="isLimitReached('favorites')" class="student-card upsell-inline">
      <strong>Has alcanzado el limite de tu plan {{ plan.toUpperCase() }}.</strong>
      <RouterLink class="primary-link" to="/student/plans">Desbloquear mas favoritos</RouterLink>
    </article>

    <div class="list">
      <article v-for="favorite in favorites" :key="favorite.id" class="student-card row-card">
        <div>
          <span>{{ favorite.tipo }}</span>
          <h3>{{ favorite.item.nombre }}</h3>
          <p>{{ favorite.item.universidadNombre || favorite.item.universidadCiudad || favorite.item.descripcion }}</p>
        </div>
        <button type="button" @click="deleteFavorite(favorite.id)">Eliminar</button>
      </article>
    </div>
    <p v-if="!favorites.length && !loading" class="empty">Aun no tienes favoritos guardados.</p>

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
const { favorites, favoritesLimitLabel, loading, planInfo, plan, limits, usage, upsell } = storeToRefs(studentStore);
const { fetchFavorites, fetchPlan, deleteFavorite, isLimitReached, dismissUpgradeModal } = studentStore;

const upgradeLabel = computed(() => plan.value === 'free' ? 'Mejorar a BASIC' : plan.value === 'basic' ? 'Mejorar a PLUS' : 'PLUS activo');

onMounted(() => {
  void Promise.all([fetchFavorites(), fetchPlan()]);
});
</script>

<style scoped src="./student.css"></style>
