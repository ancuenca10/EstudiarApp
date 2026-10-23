<template>
  <div class="checklist">
    <article v-for="item in requirements" :key="item.id" class="requirement-row">
      <label>
        <input
          type="checkbox"
          :checked="item.completado"
          @change="toggleRequirement(item)"
        />
        <span>
          <strong>{{ item.nombre }}</strong>
          <small>{{ item.descripcion || 'Requisito del proceso' }}</small>
        </span>
      </label>
      <div class="file-row">
        <input
          :value="item.archivoUrl || ''"
          type="url"
          placeholder="URL del documento"
          @change="updateFile(item, ($event.target as HTMLInputElement).value)"
        />
        <span v-if="item.obligatorio">Obligatorio</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { ApplicationRequirement } from '@/stores/student';

const props = defineProps<{
  applicationId: string;
  requirements: ApplicationRequirement[];
}>();

const emit = defineEmits<{
  update: [requirementId: string, payload: Partial<ApplicationRequirement>];
}>();

const toggleRequirement = (item: ApplicationRequirement) => {
  emit('update', item.id, { completado: !item.completado });
};

const updateFile = (item: ApplicationRequirement, archivoUrl: string) => {
  emit('update', item.id, { archivoUrl: archivoUrl.trim() || null });
};

void props.applicationId;
</script>

<style scoped>
.checklist {
  display: grid;
  gap: 10px;
}

.requirement-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 14px;
}

label {
  align-items: flex-start;
  display: flex;
  gap: 10px;
}

input[type='checkbox'] {
  height: 20px;
  margin-top: 2px;
  width: 20px;
}

strong,
small {
  display: block;
}

strong {
  color: #0f172a;
}

small {
  color: #64748b;
  line-height: 1.4;
  margin-top: 4px;
}

.file-row {
  align-items: center;
  display: flex;
  gap: 10px;
}

.file-row input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
}

.file-row span {
  background: #fef3c7;
  border-radius: 999px;
  color: #92400e;
  font-size: 0.76rem;
  font-weight: 900;
  padding: 6px 9px;
}

@media (max-width: 620px) {
  .file-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
