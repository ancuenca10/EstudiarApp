<template>
  <section class="comparison-table">
    <table>
      <thead>
        <tr>
          <th>Campo</th>
          <th v-for="program in programs" :key="program.id">
            <div class="program-head">
              <div>
                <strong>{{ program.name }}</strong>
                <p>{{ program.universityName }}</p>
              </div>
              <button type="button" @click="$emit('remove', program.id, program.universityId)">×</button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>{{ row.label }}</td>
          <td v-for="program in programs" :key="`${row.key}-${program.id}`">
            {{ row.format(program) }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { ProgramComparisonData } from '@/types';

const props = defineProps<{
  programs: ProgramComparisonData[];
}>();

defineEmits<{
  (e: 'remove', programId: string, universityId: string): void;
}>();

const formatCurrency = (value?: number) => {
  if (!value) return 'No definido';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const rows: Array<{
  key: string;
  label: string;
  format: (program: ProgramComparisonData) => string;
}> = [
  { key: 'level', label: 'Nivel', format: (program) => program.level || '-' },
  { key: 'modality', label: 'Modalidad', format: (program) => program.modality || '-' },
  { key: 'duration', label: 'Duración', format: (program) => program.duration || '-' },
  { key: 'price', label: 'Precio', format: (program) => formatCurrency(program.price) },
  { key: 'schedule', label: 'Horario', format: (program) => program.schedule || '-' },
  {
    key: 'requirements',
    label: 'Requisitos',
    format: (program) => {
      const labels = [];
      if (program.requires_exam) labels.push('Examen');
      if (program.requires_interview) labels.push('Entrevista');
      return labels.length > 0 ? labels.join(', ') : 'Básicos';
    },
  },
];
</script>

<style scoped>
.comparison-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

th,
td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.program-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.program-head p {
  margin: 0.25rem 0 0;
  font-weight: 400;
}

.program-head button {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
}
</style>
