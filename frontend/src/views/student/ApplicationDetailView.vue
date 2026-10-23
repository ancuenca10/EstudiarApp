<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Inscripcion PLUS</p>
        <h1>{{ application?.program.nombre || 'Proceso de inscripcion' }}</h1>
      </div>
      <RouterLink class="primary-link" to="/student/applications">Mis inscripciones</RouterLink>
    </section>

    <section v-if="application" class="application-detail-grid">
      <article class="student-card application-summary">
        <span>{{ application.university.nombre }}</span>
        <h2>{{ application.progress }}% completado</h2>
        <p>{{ progressMessage }}</p>
        <ApplicationStatusStepper :status="application.estado" />
      </article>

      <article class="student-card">
        <span>Acompanamiento</span>
        <h2>{{ application.asesorNombre || 'Asesor por asignar' }}</h2>
        <p>PLUS centraliza tus avances y deja listo el contexto para recibir asesoria personalizada.</p>
      </article>
    </section>

    <section v-if="application" class="student-section">
      <div class="section-title">
        <h2>Actualizar estado</h2>
        <span>{{ statusLabel(application.estado) }}</span>
      </div>
      <div class="status-actions">
        <button
          v-for="status in statuses"
          :key="status.value"
          type="button"
          :class="{ active: application.estado === status.value }"
          @click="changeStatus(status.value)"
        >
          {{ status.label }}
        </button>
      </div>
    </section>

    <section v-if="application" class="application-workspace">
      <article class="student-card">
        <div class="section-title compact">
          <h2>Checklist de requisitos</h2>
          <span>{{ application.requirementsCompleted }}/{{ application.requirementsTotal }}</span>
        </div>
        <ApplicationChecklist
          :application-id="application.id"
          :requirements="applicationRequirements"
          @update="updateRequirement"
        />
      </article>

      <article class="student-card">
        <div class="section-title compact">
          <h2>Historial</h2>
          <span>{{ applicationTimeline.length }} avances</span>
        </div>
        <ApplicationTimeline :timeline="applicationTimeline" />
      </article>
    </section>

    <p v-if="!application && !loading" class="empty">No encontramos este proceso de inscripcion.</p>
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink, useRoute } from 'vue-router';
import ApplicationChecklist from '@/components/student/ApplicationChecklist.vue';
import ApplicationStatusStepper from '@/components/student/ApplicationStatusStepper.vue';
import ApplicationTimeline from '@/components/student/ApplicationTimeline.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import { useStudentStore, type ApplicationRequirement, type StudentApplicationStatus } from '@/stores/student';

const route = useRoute();
const studentStore = useStudentStore();
const { selectedApplication: application, applicationRequirements, applicationTimeline, loading } = storeToRefs(studentStore);
const { fetchApplication, updateApplicationStatus, updateApplicationRequirement } = studentStore;

const statuses: Array<{ value: StudentApplicationStatus; label: string }> = [
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'investigando', label: 'Investigando' },
  { value: 'preparando_documentos', label: 'Documentos' },
  { value: 'aplicado', label: 'Aplicado' },
  { value: 'en_revision', label: 'En revision' },
  { value: 'admitido', label: 'Admitido' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const statusLabel = (value: StudentApplicationStatus) =>
  statuses.find((status) => status.value === value)?.label || value;

const progressMessage = computed(() => {
  if (!application.value) return '';
  if (application.value.missingRequirements > 0) {
    return `Te faltan ${application.value.missingRequirements} documentos para aplicar.`;
  }
  return 'Checklist completo. Puedes avanzar al siguiente estado del proceso.';
});

const changeStatus = async (estado: StudentApplicationStatus) => {
  if (!application.value || application.value.estado === estado) return;
  await updateApplicationStatus(application.value.id, estado);
};

const updateRequirement = async (
  requirementId: string,
  payload: Partial<ApplicationRequirement>
) => {
  if (!application.value) return;
  await updateApplicationRequirement(application.value.id, requirementId, payload);
};

onMounted(() => {
  void fetchApplication(String(route.params.id));
});
</script>

<style scoped src="./student.css"></style>
