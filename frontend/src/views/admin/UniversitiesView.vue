<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Gestion administrativa</p>
        <h1>Universidades</h1>
        <p>{{ isAsesor ? 'Crear y editar universidades.' : 'Crear, editar y eliminar universidades.' }}</p>
      </div>
      <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
    </header>

    <section class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Buscar universidad" />
      <div class="toolbar-actions">
        <button type="button" class="ghost-btn" @click="loadUniversities" :disabled="adminStore.loading">
          Refrescar
        </button>
        <button type="button" class="primary-btn" @click="openCreateModal">
          Crear universidad
        </button>
      </div>
    </section>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>

    <section class="panel">
      <div v-if="adminStore.loading && adminStore.universities.length === 0" class="state">
        Cargando universidades...
      </div>
      <div v-else-if="filteredUniversities.length === 0" class="state">
        No hay universidades para mostrar.
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Descripcion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="university in filteredUniversities" :key="university.id">
              <td>{{ university.nombre }}</td>
              <td>{{ university.ciudad }}</td>
              <td><span class="badge">{{ university.estado || 'pendiente' }}</span></td>
              <td>
                {{ university.descripcion }}
                <small v-if="university.fuenteUrl" class="source-note">
                  Fuente:
                  <a :href="university.fuenteUrl" target="_blank" rel="noreferrer">
                    {{ university.fuenteNombre || university.fuenteUrl }}
                  </a>
                </small>
              </td>
              <td>
                <div class="row-actions">
                  <button class="ghost-btn" type="button" :disabled="adminStore.loading" @click="openEditModal(university)">
                    Editar
                  </button>
                  <button
                    v-if="canDeleteContent"
                    class="danger-btn"
                    type="button"
                    :disabled="adminStore.loading"
                    @click="removeUniversity(university.id)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="submitUniversity">
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
          Estado
          <select v-model="form.estado">
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
          </select>
        </label>
        <label v-if="canAssignUniversityUser">
          Usuario UNIVERSITY asociado
          <select v-model="form.userId">
            <option value="">Sin usuario UNIVERSITY asociado</option>
            <option v-for="user in adminStore.universityUsers" :key="user.id" :value="user.id">
              {{ user.name }} - {{ user.email }} - {{ user.id }}
            </option>
          </select>
          <small v-if="adminStore.universityUsers.length === 0">
            No hay usuarios UNIVERSITY disponibles.
          </small>
        </label>
        <label>
          Descripcion
          <textarea v-model.trim="form.descripcion" rows="5" required />
        </label>
        <DynamicFieldsEditor
          v-model="dynamicFieldValues"
          :fields="adminEditableFields"
          title="Campos dinamicos"
        />
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit" :disabled="adminStore.loading">
            {{ editingId ? 'Guardar cambios' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import DynamicFieldsEditor from '@/components/DynamicFieldsEditor.vue';
import { useAdminStore, type AdminUniversity } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';
import { useParametrizacionStore } from '@/stores/parametrizacion';

const router = useRouter();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const parametrizacionStore = useParametrizacionStore();
const search = ref('');
const showModal = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const editingId = ref<string | null>(null);
const dynamicFieldValues = ref<Record<string, string | string[] | boolean | null>>({});
const isAsesor = computed(() => authStore.user?.role?.toUpperCase() === 'ASESOR');
const canDeleteContent = computed(() => ['ADMIN', 'SUPERADMIN'].includes(authStore.user?.role?.toUpperCase() || ''));
const canAssignUniversityUser = computed(() => ['ADMIN', 'SUPERADMIN'].includes(authStore.user?.role?.toUpperCase() || ''));
const canUseDynamicFields = computed(() => authStore.isSuperAdmin);
const form = reactive({
  nombre: '',
  ciudad: '',
  descripcion: '',
  estado: 'pendiente',
  userId: '',
});

const filteredUniversities = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return adminStore.universities;

  return adminStore.universities.filter((university) =>
    `${university.nombre} ${university.ciudad} ${university.estado || ''}`.toLowerCase().includes(term)
  );
});

const adminEditableFields = computed(() =>
  parametrizacionStore.activeFields.filter((field) => field.editableByAdmin !== false)
);

const setMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = text;
  messageType.value = type;
};

const resetForm = () => {
  form.nombre = '';
  form.ciudad = '';
  form.descripcion = '';
  form.estado = 'pendiente';
  form.userId = '';
  editingId.value = null;
  dynamicFieldValues.value = {};
};

const openCreateModal = async () => {
  resetForm();
  if (canAssignUniversityUser.value) {
    await adminStore.fetchUniversityUsers();
  }
  if (canUseDynamicFields.value) {
    await parametrizacionStore.fetchFields('universidad');
  }
  showModal.value = true;
};

const openEditModal = async (university: AdminUniversity) => {
  editingId.value = university.id;
  form.nombre = university.nombre;
  form.ciudad = university.ciudad;
  form.descripcion = university.descripcion;
  form.estado = university.estado || 'pendiente';
  form.userId = university.userId || '';
  if (canAssignUniversityUser.value) {
    await adminStore.fetchUniversityUsers();
  }
  if (canUseDynamicFields.value) {
    await parametrizacionStore.fetchFields('universidad');
  }
  dynamicFieldValues.value = Object.fromEntries(
    (university.dynamicFields || []).map((field) => [
      field.fieldId,
      field.value === 'true' ? true : field.value === 'false' ? false : (field.value || ''),
    ])
  );
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const loadUniversities = async () => {
  try {
    await adminStore.fetchUniversities();
  } catch {
    setMessage(adminStore.error || 'No se pudieron cargar las universidades', 'error');
  }
};

const buildDynamicFieldsPayload = () => {
  return adminEditableFields.value.reduce<Array<{ fieldId: string; value: string | string[] | boolean | null }>>(
    (acc, field) => {
      const rawValue = dynamicFieldValues.value[field.id];

      if (field.tipo === 'checkbox') {
        acc.push({ fieldId: field.id, value: Boolean(rawValue) });
        return acc;
      }

      const normalizedValue = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string' ? rawValue.trim() : rawValue ?? '';

      if (field.requerido && (normalizedValue === '' || (Array.isArray(normalizedValue) && normalizedValue.length === 0))) {
        throw new Error(`El campo "${field.etiqueta}" es obligatorio`);
      }

      if (normalizedValue !== '' && (!Array.isArray(normalizedValue) || normalizedValue.length > 0)) {
        acc.push({ fieldId: field.id, value: normalizedValue });
      }

      return acc;
    },
    []
  );
};

const submitUniversity = async () => {
  try {
    const dynamicFields = buildDynamicFieldsPayload();
    const payload = {
      nombre: form.nombre,
      ciudad: form.ciudad,
      descripcion: form.descripcion,
      estado: form.estado,
      dynamicFields,
      ...(form.userId ? { userId: form.userId } : {}),
    };

    if (editingId.value) {
      await adminStore.updateUniversity(editingId.value, payload);
      setMessage('Universidad actualizada correctamente');
    } else {
      await adminStore.createUniversity(payload);
      setMessage('Universidad creada correctamente');
    }
    closeModal();
  } catch {
    setMessage(adminStore.error || 'No se pudo guardar la universidad', 'error');
  }
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
.toolbar,
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.page-header,
.toolbar {
  margin-bottom: 18px;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
h2,
p {
  margin-top: 0;
}

.toolbar input {
  max-width: 320px;
}

.toolbar-actions,
.row-actions {
  display: flex;
  gap: 10px;
}

.panel,
.modal {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
  padding: 10px 12px;
}

label {
  display: block;
  font-weight: 700;
  margin-bottom: 14px;
}

label input,
label select,
label textarea {
  display: block;
  margin-top: 6px;
  width: 100%;
}

label small {
  color: #64748b;
  display: block;
  margin-top: 6px;
}

.source-note {
  color: #64748b;
  display: block;
  margin-top: 6px;
}

.source-note a {
  color: #2563eb;
  overflow-wrap: anywhere;
}

.dynamic-fields {
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 12px;
}

.dynamic-fields h3 {
  margin: 0 0 12px;
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

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.ghost-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.danger-btn {
  background: #fee2e2;
  color: #991b1b;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
  vertical-align: top;
}

.badge {
  background: #eef2ff;
  border-radius: 999px;
  color: #3730a3;
  font-weight: 800;
  padding: 4px 9px;
}

.feedback,
.state {
  border-radius: 6px;
  margin-bottom: 16px;
  padding: 12px 14px;
}

.state {
  color: #64748b;
  text-align: center;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal {
  max-width: 520px;
  width: 100%;
}

@media (max-width: 760px) {
  .page-header,
  .toolbar,
  .modal-actions {
    flex-direction: column;
  }

  .toolbar input {
    max-width: none;
  }
}
</style>
