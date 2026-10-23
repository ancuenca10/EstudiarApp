<template>
  <main class="programs-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Panel Universidad</p>
        <h1>Mis programas</h1>
        <p>Gestiona los programas de tu universidad. Todo cambio vuelve a revision.</p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="router.push('/universidad')">Dashboard</button>
        <button class="primary-btn" type="button" :disabled="!panelStore.university" @click="openCreateModal">
          Crear programa
        </button>
      </div>
    </header>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <section v-if="panelStore.error" class="empty-panel">
      <h2>No hay universidad asociada</h2>
      <p>Tu cuenta aun no esta asociada a una universidad. Contacta al administrador.</p>
    </section>

    <section v-else class="panel">
      <div v-if="panelStore.loading && panelStore.programs.length === 0" class="state">Cargando programas...</div>
      <div v-else-if="panelStore.programs.length === 0" class="state">Todavia no tienes programas registrados.</div>
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
            <tr v-for="program in panelStore.programs" :key="program.id">
              <td>
                <strong>{{ program.nombre }}</strong>
                <small>{{ program.descripcion }}</small>
                <div v-if="program.estado === 'rechazado' && program.rechazoMotivo" class="rejection-alert">
                  <strong>Este programa fue rechazado por las siguientes razones:</strong>
                  <p>{{ program.rechazoMotivo }}</p>
                  <small v-if="program.fechaRechazo">Fecha: {{ formatDate(program.fechaRechazo) }}</small>
                </div>
                <div v-if="program.estado === 'aprobado'" class="approved-note">
                  Si editas este programa aprobado, volvera a revision y dejara de considerarse aprobado hasta nueva validacion.
                </div>
              </td>
              <td>{{ program.modalidad }}</td>
              <td>{{ program.duracion }}</td>
              <td>{{ formatPrice(program.precio) }}</td>
              <td><span class="badge" :class="program.estado">{{ program.estado }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="ghost-btn" type="button" @click="openEditModal(program)">
                    Editar
                  </button>
                  <button class="ghost-btn" type="button" :disabled="historyLoading" @click="openHistoryModal(program)">
                    Ver historial
                  </button>
                  <button
                    class="danger-btn"
                    type="button"
                    :disabled="panelStore.loading || !program.id"
                    @click="removeProgram(program.id)"
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

    <section v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="submitProgram">
        <h2>{{ editingId ? 'Editar programa' : 'Crear programa' }}</h2>
        <label>
          Nombre
          <input v-model.trim="form.nombre" type="text" required />
        </label>
        <label>
          Modalidad
          <input v-model.trim="form.modalidad" type="text" required />
        </label>
        <label>
          Duracion
          <input v-model.trim="form.duracion" type="text" required />
        </label>
        <label>
          Precio
          <input v-model.number="form.precio" type="number" min="0" step="1" required />
        </label>
        <label>
          Descripcion
          <textarea v-model.trim="form.descripcion" rows="5" required />
        </label>

        <DynamicFieldsEditor
          v-model="dynamicFieldValues"
          :fields="universityEditableFields"
          title="Campos adicionales"
        />

        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit" :disabled="panelStore.loading">
            {{ editingId ? 'Guardar y reenviar' : 'Crear programa' }}
          </button>
        </div>
      </form>
    </section>

    <section v-if="showHistoryModal" class="modal-backdrop" @click.self="closeHistoryModal">
      <div class="modal history-modal">
        <div class="modal-title-row">
          <div>
            <h2>Historial del programa</h2>
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
              <span class="badge" :class="entry.estadoNuevo">{{ entry.accion }}</span>
            </div>
            <p>{{ entry.estadoAnterior || 'sin estado' }} -> {{ entry.estadoNuevo }}</p>
            <small>Actor: {{ entry.actorRol || '-' }}</small>
            <blockquote v-if="entry.motivo">{{ entry.motivo }}</blockquote>
          </li>
        </ol>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import DynamicFieldsEditor from '@/components/DynamicFieldsEditor.vue';
import { useParametrizacionStore } from '@/stores/parametrizacion';
import {
  useUniversityPanelStore,
  type UniversityPanelProgram,
  type UniversityProgramModerationHistoryItem,
} from '@/stores/universityPanel';

const router = useRouter();
const panelStore = useUniversityPanelStore();
const parametrizacionStore = useParametrizacionStore();

const showModal = ref(false);
const editingId = ref<string | null>(null);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const dynamicFieldValues = ref<Record<string, string | string[] | boolean | null>>({});
const showHistoryModal = ref(false);
const historyProgram = ref<UniversityPanelProgram | null>(null);
const selectedHistory = ref<UniversityProgramModerationHistoryItem[]>([]);
const historyLoading = ref(false);
const historyError = ref('');

const form = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  modalidad: '',
  duracion: '',
});

const universityEditableFields = computed(() =>
  parametrizacionStore.activeFields.filter((field) => field.editableByUniversity !== false)
);

const setMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = text;
  messageType.value = type;
};

const resetForm = () => {
  editingId.value = null;
  form.nombre = '';
  form.descripcion = '';
  form.precio = 0;
  form.modalidad = '';
  form.duracion = '';
  dynamicFieldValues.value = {};
};

const openCreateModal = async () => {
  resetForm();
  await parametrizacionStore.fetchFields('programa');
  showModal.value = true;
};

const openEditModal = async (program: UniversityPanelProgram) => {
  if (program.estado === 'aprobado') {
    const confirmed = window.confirm(
      'Si editas este programa aprobado, volvera a revision y dejara de considerarse aprobado hasta nueva validacion. Deseas continuar?'
    );
    if (!confirmed) return;
  }

  editingId.value = program.id;
  form.nombre = program.nombre;
  form.descripcion = program.descripcion;
  form.precio = program.precio;
  form.modalidad = program.modalidad;
  form.duracion = program.duracion;
  await parametrizacionStore.fetchFields('programa');
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

const buildDynamicFieldsPayload = () => {
  return universityEditableFields.value.reduce<Array<{ fieldId: string; value: string | string[] | boolean | null }>>(
    (acc, field) => {
      const rawValue = dynamicFieldValues.value[field.id];

      if (field.tipo === 'checkbox') {
        acc.push({ fieldId: field.id, value: Boolean(rawValue) });
        return acc;
      }

      const value = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string' ? rawValue.trim() : rawValue ?? '';
      if (field.requerido && (value === '' || (Array.isArray(value) && value.length === 0))) {
        throw new Error(`El campo "${field.etiqueta}" es obligatorio`);
      }

      if (value !== '' && (!Array.isArray(value) || value.length > 0)) {
        acc.push({ fieldId: field.id, value });
      }

      return acc;
    },
    []
  );
};

const submitProgram = async () => {
  try {
    const payload = {
      ...form,
      dynamicFields: buildDynamicFieldsPayload(),
    };

    if (editingId.value) {
      await panelStore.updateMyProgram(editingId.value, payload);
      setMessage('Programa actualizado y enviado a revision');
    } else {
      await panelStore.createMyProgram(payload);
      setMessage('Programa creado y enviado a revision');
    }

    closeModal();
  } catch {
    setMessage(panelStore.error || parametrizacionStore.error || 'No se pudo guardar el programa', 'error');
  }
};

const removeProgram = async (programId: string) => {
  if (!programId) {
    setMessage('No se puede eliminar un programa sin id', 'error');
    return;
  }

  const confirmed = window.confirm('Seguro que deseas eliminar este programa?');
  if (!confirmed) return;

  try {
    await panelStore.deleteMyProgram(programId);
    await panelStore.fetchMyPrograms();
    setMessage('Programa eliminado correctamente');
  } catch {
    setMessage(panelStore.error || 'No se pudo eliminar el programa', 'error');
  }
};

const openHistoryModal = async (program: UniversityPanelProgram) => {
  historyProgram.value = program;
  selectedHistory.value = [];
  historyError.value = '';
  showHistoryModal.value = true;
  historyLoading.value = true;

  try {
    selectedHistory.value = await panelStore.fetchMyProgramModerationHistory(program.id);
  } catch {
    historyError.value = panelStore.error || 'No se pudo cargar el historial';
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
  try {
    await panelStore.fetchMyUniversity();
    await panelStore.fetchMyPrograms();
  } catch {
    // El estado de error se muestra en la vista.
  }
});
</script>

<style scoped>
.programs-page {
  margin: 0 auto;
  max-width: 1180px;
  padding: 32px 20px 56px;
}

.page-header,
.header-actions,
.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.page-header {
  align-items: flex-start;
  margin-bottom: 18px;
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

.panel,
.empty-panel,
.feedback {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
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
}

.badge {
  border-radius: 999px;
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 4px 8px;
}

.badge.pendiente {
  background: #e5e7eb;
  color: #374151;
}

.badge.aprobado {
  background: #dcfce7;
  color: #166534;
}

.badge.rechazado {
  background: #fee2e2;
  color: #991b1b;
}

.ghost-btn,
.primary-btn,
.danger-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 12px;
}

.ghost-btn {
  background: #e2e8f0;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.danger-btn {
  background: #fee2e2;
  color: #991b1b;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rejection-alert {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #7f1d1d;
  margin-top: 10px;
  padding: 10px 12px;
}

.rejection-alert p {
  margin: 6px 0;
}

.rejection-alert small {
  color: #991b1b;
}

.approved-note {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #166534;
  margin-top: 10px;
  padding: 10px 12px;
}

.modal-backdrop {
  align-items: center;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 20px;
  position: fixed;
  z-index: 50;
}

.modal {
  background: #fff;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  max-width: 620px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 20px;
  width: 100%;
}

.history-modal {
  max-width: 720px;
}

.modal-title-row,
.history-row {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
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
  background: #fff1f2;
  border-left: 4px solid #f43f5e;
  color: #7f1d1d;
  margin: 10px 0 0;
  padding: 8px 10px;
}

.modal label,
.dynamic-fields {
  display: grid;
  gap: 6px;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 12px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 860px) {
  .page-header,
  .header-actions,
  .modal-actions,
  .modal-title-row {
    flex-direction: column;
  }
}
</style>
