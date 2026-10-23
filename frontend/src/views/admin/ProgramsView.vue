<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Gestion administrativa</p>
        <h1>Programas</h1>
        <p>{{ isAsesor ? 'Revisar, crear, editar y aprobar programas.' : 'Crear, editar, aprobar y eliminar programas.' }}</p>
      </div>
      <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
    </header>

    <section class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Buscar programa" />
      <div class="toolbar-actions">
        <button class="ghost-btn" type="button" @click="loadPrograms" :disabled="adminStore.loading">
          Refrescar
        </button>
        <button type="button" class="primary-btn" @click="openCreateModal" :disabled="adminStore.universities.length === 0">
          Crear programa
        </button>
      </div>
    </section>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>

    <section class="panel">
      <div v-if="adminStore.loading && adminStore.programs.length === 0" class="state">Cargando programas...</div>
      <div v-else-if="filteredPrograms.length === 0" class="state">No hay programas para mostrar.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Modalidad</th>
              <th>Duracion</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="program in filteredPrograms" :key="program.id">
              <td>
                <strong>{{ program.nombre }}</strong>
                <small>{{ program.descripcion }}</small>
                <small v-if="program.fuenteUrl" class="source-note">
                  Fuente:
                  <a :href="program.fuenteUrl" target="_blank" rel="noreferrer">
                    {{ program.fuenteNombre || program.fuenteUrl }}
                  </a>
                </small>
              </td>
              <td>{{ program.modalidad || '-' }}</td>
              <td>{{ program.duracion || '-' }}</td>
              <td>{{ formatPrice(program.precio) }}</td>
              <td><span class="badge">{{ program.estado }}</span></td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="program.estado !== 'rechazado'"
                    class="primary-btn"
                    type="button"
                    :disabled="adminStore.loading || program.estado !== 'pendiente'"
                    @click="approve(program.id)"
                  >
                    Aprobar
                  </button>
                  <button
                    v-if="program.estado !== 'rechazado'"
                    class="danger-btn"
                    type="button"
                    :disabled="adminStore.loading || program.estado !== 'pendiente'"
                    @click="startReject(program.id)"
                  >
                    Rechazar
                  </button>
                  <button class="ghost-btn" type="button" :disabled="adminStore.loading" @click="openEditModal(program)">
                    Editar
                  </button>
                  <button class="ghost-btn" type="button" :disabled="historyLoading" @click="openHistoryModal(program)">
                    Historial
                  </button>
                  <button
                    v-if="canDeleteContent"
                    class="danger-btn"
                    type="button"
                    :disabled="adminStore.loading"
                    @click="removeProgram(program.id)"
                  >
                    Eliminar
                  </button>
                </div>
                <div v-if="rejectingProgramId === program.id" class="reject-box">
                  <label>
                    Razon del rechazo
                    <textarea
                      v-model.trim="rejectionReason"
                      rows="3"
                      maxlength="1000"
                      placeholder="Escribe la razon del rechazo"
                      required
                    />
                  </label>
                  <small>{{ rejectionReason.length }}/1000</small>
                  <div class="row-actions">
                    <button
                      class="danger-btn"
                      type="button"
                      :disabled="adminStore.loading || !rejectionReason.trim()"
                      @click="confirmReject(program.id)"
                    >
                      Confirmar rechazo
                    </button>
                    <button class="ghost-btn" type="button" @click="cancelReject">
                      Cancelar
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="submitProgram">
        <h2>{{ editingId ? 'Editar programa' : 'Crear programa' }}</h2>
        <label>
          Universidad
          <select v-model="form.universidadId" required>
            <option value="" disabled>Selecciona una universidad</option>
            <option v-for="university in adminStore.universities" :key="university.id" :value="university.id">
              {{ university.nombre }}
            </option>
          </select>
        </label>
        <label>
          Nombre
          <input v-model.trim="form.nombre" type="text" required />
        </label>
        <label>
          Modalidad
          <input v-model.trim="form.modalidad" type="text" placeholder="Presencial, virtual, hibrida" required />
        </label>
        <label>
          Duracion
          <input v-model.trim="form.duracion" type="text" placeholder="10 semestres" required />
        </label>
        <label>
          Precio
          <input v-model.number="form.precio" type="number" min="0" step="1" required />
        </label>
        <label>
          Estado
          <select v-model="form.estado">
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
            <option value="rechazado">rechazado</option>
          </select>
        </label>
        <label v-if="form.estado === 'rechazado'">
          Razon del rechazo
          <textarea
            v-model.trim="form.rechazoMotivo"
            rows="3"
            maxlength="1000"
            placeholder="Escribe la razon del rechazo"
            required
          />
          <small>{{ form.rechazoMotivo.length }}/1000</small>
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
          <button class="primary-btn" type="submit" :disabled="adminStore.loading || adminStore.universities.length === 0">
            {{ editingId ? 'Guardar cambios' : 'Crear programa' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="showHistoryModal" class="modal-backdrop" @click.self="closeHistoryModal">
      <section class="modal history-modal">
        <div class="modal-title-row">
          <div>
            <h2>Historial de moderacion</h2>
            <p v-if="historyProgram">{{ historyProgram.nombre }}</p>
          </div>
          <button class="ghost-btn" type="button" @click="closeHistoryModal">Cerrar</button>
        </div>

        <p v-if="historyError" class="feedback error">{{ historyError }}</p>
        <div v-if="historyLoading" class="state">Cargando historial...</div>
        <div v-else-if="selectedHistory.length === 0" class="state">
          Este programa aun no tiene historial de moderacion.
        </div>
        <ol v-else class="history-list">
          <li v-for="entry in selectedHistory" :key="entry.id">
            <div class="history-row">
              <strong>{{ formatDate(entry.fecha) }}</strong>
              <span class="badge">{{ entry.accion }}</span>
            </div>
            <p>{{ entry.estadoAnterior || 'sin estado' }} -> {{ entry.estadoNuevo }}</p>
            <small>Rol del actor: {{ entry.actorRol || '-' }}</small>
            <blockquote v-if="entry.motivo">{{ entry.motivo }}</blockquote>
          </li>
        </ol>
      </section>
    </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import DynamicFieldsEditor from '@/components/DynamicFieldsEditor.vue';
import {
  useAdminStore,
  type AdminProgram,
  type ProgramModerationHistoryItem,
} from '@/stores/admin';
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
const rejectingProgramId = ref<string | null>(null);
const rejectionReason = ref('');
const showHistoryModal = ref(false);
const historyProgram = ref<AdminProgram | null>(null);
const selectedHistory = ref<ProgramModerationHistoryItem[]>([]);
const historyLoading = ref(false);
const historyError = ref('');
const isAsesor = computed(() => authStore.user?.role?.toUpperCase() === 'ASESOR');
const canDeleteContent = computed(() => ['ADMIN', 'SUPERADMIN'].includes(authStore.user?.role?.toUpperCase() || ''));
const canUseDynamicFields = computed(() => authStore.isSuperAdmin);
const form = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  modalidad: '',
  duracion: '',
  universidadId: '',
  estado: 'pendiente',
  rechazoMotivo: '',
});

const filteredPrograms = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return adminStore.programs;

  return adminStore.programs.filter((program) =>
    `${program.nombre} ${program.modalidad || ''} ${program.estado}`.toLowerCase().includes(term)
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
  form.descripcion = '';
  form.precio = 0;
  form.modalidad = '';
  form.duracion = '';
  form.universidadId = '';
  form.estado = 'pendiente';
  form.rechazoMotivo = '';
  editingId.value = null;
  dynamicFieldValues.value = {};
};

const openCreateModal = async () => {
  resetForm();
  if (canUseDynamicFields.value) {
    await parametrizacionStore.fetchFields('programa');
  }
  showModal.value = true;
};

const openEditModal = async (program: AdminProgram) => {
  editingId.value = program.id;
  form.nombre = program.nombre;
  form.descripcion = program.descripcion || '';
  form.precio = program.precio || 0;
  form.modalidad = program.modalidad || '';
  form.duracion = program.duracion || '';
  form.universidadId = program.universidadId || '';
  form.estado = program.estado || 'pendiente';
  form.rechazoMotivo = program.rechazoMotivo || '';
  if (canUseDynamicFields.value) {
    await parametrizacionStore.fetchFields('programa');
  }
  dynamicFieldValues.value = Object.fromEntries(
    (program.dynamicFields || []).map((field) => [
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

const cancelReject = () => {
  rejectingProgramId.value = null;
  rejectionReason.value = '';
};

const loadPrograms = async () => {
  try {
    await adminStore.fetchPrograms();
  } catch {
    setMessage(adminStore.error || 'No se pudieron cargar los programas', 'error');
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

const submitProgram = async () => {
  try {
    if (form.estado === 'rechazado' && !form.rechazoMotivo.trim()) {
      setMessage('Debes escribir la razon del rechazo', 'error');
      return;
    }

    const dynamicFields = buildDynamicFieldsPayload();
    if (editingId.value) {
      await adminStore.updateProgram(editingId.value, { ...form, dynamicFields });
      setMessage('Programa actualizado correctamente');
    } else {
      await adminStore.createProgram({ ...form, dynamicFields });
      setMessage('Programa creado correctamente. Queda pendiente de aprobacion.');
    }
    closeModal();
  } catch {
    setMessage(adminStore.error || 'No se pudo guardar el programa', 'error');
  }
};

const approve = async (programId: string) => {
  try {
    await adminStore.approveProgram(programId);
    setMessage('Programa aprobado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo aprobar el programa', 'error');
  }
};

const startReject = (programId: string) => {
  rejectingProgramId.value = programId;
  rejectionReason.value = '';
};

const confirmReject = async (programId: string) => {
  if (!rejectionReason.value.trim()) {
    setMessage('Debes escribir la razon del rechazo', 'error');
    return;
  }

  try {
    await adminStore.changeProgramStatus(programId, 'rechazado', rejectionReason.value.trim());
    cancelReject();
    setMessage('Programa rechazado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo rechazar el programa', 'error');
  }
};

const removeProgram = async (programId: string) => {
  const confirmed = window.confirm('Seguro que deseas eliminar este programa?');
  if (!confirmed) return;

  try {
    await adminStore.deleteProgram(programId);
    setMessage('Programa eliminado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo eliminar el programa', 'error');
  }
};

const openHistoryModal = async (program: AdminProgram) => {
  historyProgram.value = program;
  selectedHistory.value = [];
  historyError.value = '';
  showHistoryModal.value = true;
  historyLoading.value = true;

  try {
    selectedHistory.value = await adminStore.fetchProgramModerationHistory(program.id);
  } catch {
    historyError.value = adminStore.error || 'No se pudo cargar el historial';
  } finally {
    historyLoading.value = false;
  }
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyProgram.value = null;
  selectedHistory.value = [];
  historyError.value = '';
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

onMounted(async () => {
  await Promise.allSettled([
    adminStore.fetchUniversities(),
    loadPrograms(),
  ]);
});
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

.row-actions {
  flex-wrap: wrap;
}

.reject-box {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  margin-top: 10px;
  padding: 12px;
}

.reject-box textarea {
  min-width: 260px;
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

small {
  color: #64748b;
  display: block;
  margin-top: 4px;
}

.source-note a {
  color: #2563eb;
  overflow-wrap: anywhere;
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
  max-width: 560px;
  width: 100%;
}

.history-modal {
  max-width: 720px;
}

.modal-title-row,
.history-row {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.history-list {
  display: grid;
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-list li {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.history-list p {
  margin: 8px 0 0;
}

.history-list blockquote {
  background: #fff7ed;
  border-left: 4px solid #fb923c;
  color: #7c2d12;
  margin: 10px 0 0;
  padding: 8px 10px;
}

@media (max-width: 760px) {
  .page-header,
  .toolbar,
  .modal-actions,
  .modal-title-row {
    flex-direction: column;
  }

  .toolbar input {
    max-width: none;
  }
}
</style>
