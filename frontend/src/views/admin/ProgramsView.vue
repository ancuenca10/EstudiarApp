<template>
  <main class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SUPERADMIN</p>
        <h1>Programas</h1>
        <p>Aprobar programas pendientes y revisar su estado.</p>
      </div>
      <div class="actions">
        <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
        <button class="primary-btn" type="button" @click="loadPrograms" :disabled="adminStore.loading">
          Refrescar
        </button>
      </div>
    </header>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>

    <section class="layout">
      <form class="panel" @submit.prevent="submitProgram">
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
          Descripcion
          <textarea v-model.trim="form.descripcion" rows="5" required />
        </label>
        <label>
          Estado
          <select v-model="form.estado">
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
            <option value="rechazado">rechazado</option>
          </select>
        </label>
        <div class="form-actions">
          <button class="primary-btn" type="submit" :disabled="adminStore.loading || adminStore.universities.length === 0">
            {{ editingId ? 'Guardar cambios' : 'Crear programa' }}
          </button>
          <button v-if="editingId" class="ghost-btn" type="button" @click="cancelEdit">
            Cancelar
          </button>
        </div>
      </form>

      <section class="panel">
      <div v-if="adminStore.loading && adminStore.programs.length === 0" class="state">Cargando programas...</div>
      <div v-else-if="adminStore.programs.length === 0" class="state">No hay programas para mostrar.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Modalidad</th>
              <th>Duracion</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="program in adminStore.programs" :key="program.id">
              <td>
                <strong>{{ program.nombre }}</strong>
                <small>{{ program.descripcion }}</small>
              </td>
              <td>{{ program.modalidad || '-' }}</td>
              <td>{{ program.duracion || '-' }}</td>
              <td>{{ formatPrice(program.precio) }}</td>
              <td><span class="badge">{{ program.estado }}</span></td>
              <td>
                <div class="row-actions">
                  <button
                    class="primary-btn"
                    type="button"
                    :disabled="adminStore.loading || program.estado !== 'pendiente'"
                    @click="approve(program.id)"
                  >
                    Aprobar
                  </button>
                  <button class="ghost-btn" type="button" :disabled="adminStore.loading" @click="startEdit(program)">
                    Editar
                  </button>
                  <button class="danger-btn" type="button" :disabled="adminStore.loading" @click="removeProgram(program.id)">
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore, type AdminProgram } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const form = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  modalidad: '',
  duracion: '',
  universidadId: '',
  estado: 'pendiente',
});
const editingId = ref<string | null>(null);

const setMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = text;
  messageType.value = type;
};

const loadPrograms = async () => {
  try {
    await adminStore.fetchPrograms();
  } catch {
    setMessage(adminStore.error || 'No se pudieron cargar los programas', 'error');
  }
};

const resetForm = () => {
  form.nombre = '';
  form.descripcion = '';
  form.precio = 0;
  form.modalidad = '';
  form.duracion = '';
  form.universidadId = '';
  form.estado = 'pendiente';
  editingId.value = null;
};

const submitProgram = async () => {
  try {
    if (editingId.value) {
      await adminStore.updateProgram(editingId.value, { ...form });
      setMessage('Programa actualizado correctamente');
    } else {
      await adminStore.createProgram({ ...form });
      setMessage('Programa creado correctamente. Queda pendiente de aprobacion.');
    }
    resetForm();
  } catch {
    setMessage(adminStore.error || 'No se pudo guardar el programa', 'error');
  }
};

const startEdit = (program: AdminProgram) => {
  editingId.value = program.id;
  form.nombre = program.nombre;
  form.descripcion = program.descripcion || '';
  form.precio = program.precio || 0;
  form.modalidad = program.modalidad || '';
  form.duracion = program.duracion || '';
  form.universidadId = program.universidadId || '';
  form.estado = program.estado || 'pendiente';
};

const cancelEdit = () => {
  resetForm();
};

const approve = async (programId: string) => {
  try {
    await adminStore.approveProgram(programId);
    setMessage('Programa aprobado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo aprobar el programa', 'error');
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

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
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
.actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  margin-bottom: 18px;
}

.actions {
  align-items: flex-start;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
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

.layout {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 18px;
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

.table-wrap {
  overflow-x: auto;
}

.form-actions,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.badge {
  background: #eef2ff;
  border-radius: 999px;
  color: #3730a3;
  font-weight: 800;
  padding: 4px 9px;
}

@media (max-width: 760px) {
  .page-header,
  .actions {
    flex-direction: column;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
