<template>
  <ol class="timeline">
    <li v-for="item in timeline" :key="item.id">
      <span>{{ statusLabel(item.estado) }}</span>
      <strong>{{ item.comentario || 'Avance registrado' }}</strong>
      <small>{{ formatDate(item.createdAt) }}</small>
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { ApplicationTimelineItem, StudentApplicationStatus } from '@/stores/student';

defineProps<{
  timeline: ApplicationTimelineItem[];
}>();

const labels: Record<StudentApplicationStatus, string> = {
  iniciado: 'Iniciado',
  investigando: 'Investigando',
  preparando_documentos: 'Preparando documentos',
  aplicado: 'Aplicado',
  en_revision: 'En revision',
  admitido: 'Admitido',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const statusLabel = (status: StudentApplicationStatus) => labels[status] || status;
const formatDate = (value: string) => new Date(value).toLocaleString('es-CO');
</script>

<style scoped>
.timeline {
  border-left: 2px solid #cbd5e1;
  display: grid;
  gap: 14px;
  list-style: none;
  margin: 0;
  padding: 0 0 0 18px;
}

li {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 5px;
  padding: 12px;
  position: relative;
}

li::before {
  background: #0f766e;
  border: 3px solid #fff;
  border-radius: 999px;
  content: '';
  height: 12px;
  left: -26px;
  position: absolute;
  top: 14px;
  width: 12px;
}

span {
  color: #0f766e;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
}

strong {
  color: #0f172a;
}

small {
  color: #64748b;
}
</style>
