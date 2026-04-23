<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section class="modal">
      <header class="modal-header">
        <h2>{{ isEditing ? 'Editar universidad' : 'Crear universidad' }}</h2>
        <button type="button" class="icon-btn" aria-label="Cerrar" @click="emit('close')">
          x
        </button>
      </header>

      <form class="form" @submit.prevent="handleSubmit">
        <label>
          Nombre
          <input v-model.trim="form.name" type="text" required />
        </label>

        <label>
          Pais
          <input v-model.trim="form.country" type="text" required />
        </label>

        <label>
          Ciudad
          <input v-model.trim="form.city" type="text" required />
        </label>

        <label>
          Tipo
          <select v-model="form.type">
            <option value="private">Privada</option>
            <option value="public">Publica</option>
          </select>
        </label>

        <label>
          Sitio web
          <input v-model.trim="form.website" type="url" placeholder="https://..." />
        </label>

        <label class="full-width">
          Descripcion
          <textarea v-model.trim="form.description" rows="4" required />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <footer class="actions">
          <button type="button" class="btn-secondary" @click="emit('close')">
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            Guardar
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { University } from '@/types/university';

const props = defineProps<{
  university?: University | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [value: Partial<University>];
}>();

const error = ref('');

const form = reactive({
  id: '',
  name: '',
  country: 'Colombia',
  city: '',
  type: 'private' as 'private' | 'public',
  website: '',
  description: '',
});

const isEditing = computed(() => Boolean(props.university));

const syncForm = () => {
  form.id = props.university?.id || '';
  form.name = props.university?.name || '';
  form.country = props.university?.country || 'Colombia';
  form.city = props.university?.city || '';
  form.type = props.university?.type || 'private';
  form.website = props.university?.website || '';
  form.description = props.university?.description || '';
  error.value = '';
};

watch(() => props.university, syncForm, { immediate: true });

const handleSubmit = () => {
  if (!form.name || !form.country || !form.city || !form.description) {
    error.value = 'Completa los campos obligatorios';
    return;
  }

  emit('save', {
    id: form.id || undefined,
    name: form.name,
    country: form.country,
    city: form.city,
    type: form.type,
    website: form.website,
    description: form.description,
  });
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
}

.form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 24px;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.full-width,
.error,
.actions {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.error {
  margin: 0;
  color: #b42318;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #334155;
}

@media (max-width: 640px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
