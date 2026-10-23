<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Plan PLUS</p>
        <h1>Gestion de inscripcion a la universidad</h1>
      </div>
      <RouterLink class="primary-link" to="/student/plans">
        {{ plan === 'plus' ? 'PLUS activo' : 'Mejorar a PLUS' }}
      </RouterLink>
    </section>

    <section v-if="plan !== 'plus'" class="student-card plus-lock">
      <span>Disponible en plan PLUS</span>
      <h2>Tu asistente personal para entrar a la universidad</h2>
      <p>Gestiona tu inscripcion con checklist, seguimiento, documentos y acompanamiento personalizado.</p>
      <button type="button" @click="showPlusUpgrade">Desbloquear gestion de inscripcion</button>
    </section>

    <template v-else>
      <section class="applications-hero">
        <article class="student-card">
          <span>Proceso guiado</span>
          <h2>Centraliza cada avance hasta aplicar</h2>
          <p>Elige un programa, completa los requisitos y mueve tu proceso por el pipeline de inscripcion.</p>
        </article>
        <article class="student-card value-card">
          <span>Estado general</span>
          <h2>{{ applications.length }} procesos activos</h2>
          <p>{{ activeMessage }}</p>
        </article>
      </section>

      <section class="student-section">
        <div class="section-title">
          <h2>Tus procesos</h2>
          <span>{{ applications.length }} en seguimiento</span>
        </div>
        <div v-if="applications.length" class="applications-grid">
          <ApplicationCard
            v-for="application in applications"
            :key="application.id"
            :application="application"
          />
        </div>
        <p v-else class="empty">Aun no tienes procesos. Inicia uno desde un programa recomendado.</p>
      </section>

      <section class="student-section">
        <div class="section-title">
          <h2>Iniciar proceso de inscripcion</h2>
          <RouterLink to="/student/preferences">Afinar recomendaciones</RouterLink>
        </div>
        <div class="start-grid">
          <article v-for="program in recommendations.slice(0, 6)" :key="program.id" class="student-card start-card">
            <span>{{ program.universidadCiudad }}</span>
            <h3>{{ program.nombre }}</h3>
            <p>{{ program.universidadNombre }}</p>
            <small>{{ program.reasons.slice(0, 2).join(' - ') }}</small>
            <button type="button" :disabled="loading" @click="startApplication(program.id)">
              Iniciar proceso de inscripcion
            </button>
          </article>
        </div>
        <p v-if="!recommendations.length && !loading" class="empty">
          Completa tus preferencias para ver programas sugeridos e iniciar tu proceso.
        </p>
      </section>
    </template>

    <UpgradeModal :model-value="upsell" @close="dismissUpgradeModal" />
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink, useRouter } from 'vue-router';
import ApplicationCard from '@/components/student/ApplicationCard.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import UpgradeModal from '@/components/student/UpgradeModal.vue';
import { useStudentStore } from '@/stores/student';

const studentStore = useStudentStore();
const router = useRouter();
const { applications, recommendations, plan, loading, upsell } = storeToRefs(studentStore);
const {
  fetchPlan,
  fetchApplications,
  fetchRecommendations,
  createApplication,
  openUpgradeModal,
  dismissUpgradeModal,
} = studentStore;

const activeMessage = computed(() => {
  const pendingDocs = applications.value.reduce((acc, item) => acc + item.missingRequirements, 0);
  if (pendingDocs === 0 && applications.value.length > 0) return 'Tus checklists estan completos para avanzar.';
  if (pendingDocs > 0) return `Tienes ${pendingDocs} requisitos pendientes por completar.`;
  return 'PLUS convierte tus programas favoritos en procesos accionables.';
});

const showPlusUpgrade = () => {
  openUpgradeModal(
    'Gestiona tu inscripcion con acompanamiento personalizado en plan PLUS',
    'plus'
  );
};

const startApplication = async (programId: string) => {
  try {
    const application = await createApplication(programId);
    await router.push(`/student/applications/${application.id}`);
  } catch {
    if (plan.value !== 'plus') showPlusUpgrade();
  }
};

onMounted(async () => {
  await fetchPlan();
  if (plan.value === 'plus') {
    await Promise.all([fetchApplications(), fetchRecommendations()]);
  }
});
</script>

<style scoped src="./student.css"></style>
