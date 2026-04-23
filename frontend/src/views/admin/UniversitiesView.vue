<template>
  <main class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SUPERADMIN</p>
        <h1>Universidades</h1>
        <p>Crear universidades y eliminar registros existentes.</p>
      </div>
      <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
    </header>

    <section class="layout">
      <form class="panel" @submit.prevent="submitUniversity">
        <h2>{{ editingId ? 'Editar universidad' : 'Crear universidad' }}</h2>
        <label>
          Nombre
          <input v-model.trim="form.nombre" type="text" required />
        </label>
        <label>
          Ciudad
          <input v-model.trim="form.ciudad" type="text" required />
        </label>
        <label>
          Descripcion
          <textarea v-model.trim="form.descripcion" rows="5" required />
        </label>
        <label>
          Estado
          <select v-model="form.estado">
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
          </select>
        </label>
        <div class="form-actions">
          <button class="primary-btn" type="submit" :disabled="adminStore.loading">
            {{ editingId ? 'Guardar cambios' : 'Crear' }}
          </button>
          <button v-if="editingId" class="ghost-btn" type="button" @click="cancelEdit">
            Cancelar
          </button>
        </div>
      </form>

      <section class="panel">
        <div class="section-header">
          <h2>Listado</h2>
          <button class="ghost-btn" type="button" @click="loadUniversities" :disabled="adminStore.loading">
            Refrescar
          </button>
        </div>

        <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
        <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>

        <div v-if="adminStore.loading && adminStore.universities.length === 0" class="state">
          Cargando universidades...
        </div>
        <div v-else-if="adminStore.universities.length === 0" class="state">
          No hay universidades para mostrar.
        </div>
        <div v-else class="university-list">
          <article v-for="university in adminStore.universities" :key="university.id" class="university-item">
            <div>
              <h3>{{ university.nombre }}</h3>
              <p>{{ university.ciudad }} · {{ university.estado || 'pendiente' }}</p>
              <small>{{ university.descripcion }}</small>
            </div>
            <div class="item-actions">
              <button class="ghost-btn" type="button" :disabled="adminStore.loading" @click="startEdit(university)">
                Editar
              </button>
              <button class="danger-btn" type="button" :disabled="adminStore.loading" @click="removeUniversity(university.id)">
                Eliminar
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore, type AdminUniversity } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const form = reactive({
  nombre: '',
  ciudad: '',
  descripcion: '',
  estado: 'pendiente',
});
const editingId = ref<string | null>(null);

const setMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = text;
  messageType.value = type;
};

const resetForm = () => {
  form.nombre = '';
  form.ciudad = '';
  form.descripcion = '';
  form.estado = 'pendiente';
  editingId.value = null;
};

const loadUniversities = async () => {
  try {
    await adminStore.fetchUniversities();
  } catch {
    setMessage(adminStore.error || 'No se pudieron cargar las universidades', 'error');
  }
};

const submitUniversity = async () => {
  try {
    if (editingId.value) {
      await adminStore.updateUniversity(editingId.value, { ...form });
      setMessage('Universidad actualizada correctamente');
    } else {
      await adminStore.createUniversity({ ...form });
      setMessage('Universidad creada correctamente');
    }
    resetForm();
  } catch {
    setMessage(adminStore.error || 'No se pudo guardar la universidad', 'error');
  }
};

const startEdit = (university: AdminUniversity) => {
  editingId.value = university.id;
  form.nombre = university.nombre;
  form.ciudad = university.ciudad;
  form.descripcion = university.descripcion;
  form.estado = university.estado || 'pendiente';
};

const cancelEdit = () => {
  resetForm();
};

const removeUniversity = async (id: string) => {
  const confirmed = window.confirm('Seguro que deseas eliminar esta universidad?');
  if (!confirmed) return;

  try {
    await adminStore.deleteUniversity(id);
    setMessage('Universidad eliminada correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo eliminar la universidad', 'error');
  }
};

onMounted(loadUniversities);
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.page-header,
.section-header,
.university-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  margin-bottom: 18px;
}

.layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

label {
  display: block;
  font-weight: 700;
  margin-bottom: 14px;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: block;
  font: inherit;
  margin-top: 6px;
  padding: 10px 12px;
  width: 100%;
}

.primary-btn,
.ghost-btn,
.danger-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.form-actions,
.item-actions {
  display: flex;
  gap: 10px;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.ghost-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.danger-btn {
  align-self: flex-start;
  background: #fee2e2;
  color: #991b1b;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.feedback,
.state {
  border-radius: 6px;
  margin-bottom: 16px;
  padding: 12px 14px;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.state {
  color: #64748b;
  text-align: center;
}

.university-list {
  display: grid;
  gap: 12px;
}

.university-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
}

.university-item p,
.university-item small {
  color: #64748b;
}

@media (max-width: 900px) {
  .page-header,
  .section-header,
  .university-item {
    flex-direction: column;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
