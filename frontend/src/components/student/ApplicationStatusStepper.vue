<template>
  <ol class="status-stepper" aria-label="Estado de inscripcion">
    <li
      v-for="step in steps"
      :key="step.value"
      :class="{ active: step.value === status, done: step.index < activeIndex }"
    >
      <span>{{ step.index + 1 }}</span>
      <strong>{{ step.label }}</strong>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StudentApplicationStatus } from '@/stores/student';

const props = defineProps<{
  status: StudentApplicationStatus;
}>();

const steps = [
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'investigando', label: 'Investigando' },
  { value: 'preparando_documentos', label: 'Documentos' },
  { value: 'aplicado', label: 'Aplicado' },
  { value: 'en_revision', label: 'Revision' },
  { value: 'admitido', label: 'Admitido' },
].map((step, index) => ({ ...step, index })) as Array<{
  value: StudentApplicationStatus;
  label: string;
  index: number;
}>;

const activeIndex = computed(() => {
  if (props.status === 'rechazado' || props.status === 'cancelado') return -1;
  const index = steps.findIndex((step) => step.value === props.status);
  return index < 0 ? 0 : index;
});
</script>

<style scoped>
.status-stepper {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  display: grid;
  gap: 6px;
  min-height: 78px;
  padding: 10px;
  text-align: center;
}

li.done,
li.active {
  border-color: #14b8a6;
}

li.done {
  background: #ccfbf1;
  color: #115e59;
}

li.active {
  background: #fef3c7;
  color: #92400e;
}

span {
  display: grid;
  height: 28px;
  margin: 0 auto;
  place-items: center;
  width: 28px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 900;
}

li.done span,
li.active span {
  background: #0f172a;
  color: #fff;
}

strong {
  font-size: 0.8rem;
}

@media (max-width: 860px) {
  .status-stepper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
