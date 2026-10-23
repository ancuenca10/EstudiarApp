<template>
  <article class="application-card">
    <div class="card-head">
      <span :class="['status-badge', application.estado]">{{ statusLabel }}</span>
      <strong>{{ application.progress }}%</strong>
    </div>
    <h3>{{ application.program.nombre }}</h3>
    <p>{{ application.university.nombre }} · {{ application.university.ciudad || 'Ciudad no definida' }}</p>
    <div class="progress-track">
      <span :style="{ width: `${application.progress}%` }" />
    </div>
    <small>{{ progressMessage }}</small>
    <RouterLink :to="`/student/applications/${application.id}`">Ver proceso</RouterLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { StudentApplication } from '@/stores/student';

const props = defineProps<{
  application: StudentApplication;
}>();

const labels: Record<string, string> = {
  iniciado: 'Iniciado',
  investigando: 'Investigando',
  preparando_documentos: 'Preparando documentos',
  aplicado: 'Aplicado',
  en_revision: 'En revision',
  admitido: 'Admitido',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const statusLabel = computed(() => labels[props.application.estado] || props.application.estado);
const progressMessage = computed(() =>
  props.application.missingRequirements > 0
    ? `Te faltan ${props.application.missingRequirements} documentos para aplicar`
    : 'Checklist completo para avanzar'
);
</script>

<style scoped>
.application-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 18px;
}

.card-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.status-badge {
  background: #eef2ff;
  border-radius: 999px;
  color: #3730a3;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 6px 10px;
}

.status-badge.admitido {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rechazado,
.status-badge.cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.card-head strong {
  color: #0f766e;
  font-size: 1.3rem;
}

h3 {
  color: #0f172a;
  margin: 0;
}

p,
small {
  color: #64748b;
}

p {
  margin: 0;
}

.progress-track {
  background: #e2e8f0;
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}

.progress-track span {
  background: linear-gradient(90deg, #0f766e, #14b8a6);
  display: block;
  height: 100%;
}

a {
  background: #0f172a;
  border-radius: 8px;
  color: #fff;
  font-weight: 900;
  justify-self: start;
  padding: 10px 12px;
  text-decoration: none;
}
</style>
