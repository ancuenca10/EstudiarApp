<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Gestion administrativa</p>
        <h1>Becas</h1>
        <p>Crear, editar, aprobar y rechazar becas.</p>
      </div>
      <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
    </header>

    <section class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Buscar beca" />
      <select v-model="statusFilter">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendientes</option>
        <option value="aprobado">Aprobadas</option>
        <option value="rechazado">Rechazadas</option>
      </select>
      <button class="ghost-btn" type="button" @click="load">Refrescar</button>
      <button class="primary-btn" type="button" @click="openCreate">Crear beca</button>
    </section>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <p v-if="becasStore.error" class="feedback error">{{ becasStore.error }}</p>

    <section class="panel">
      <div v-if="becasStore.loading && becasStore.becasAdmin.length === 0" class="state">Cargando becas...</div>
      <div v-else-if="filteredBecas.length === 0" class="state">No hay becas para mostrar.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Beca</th>
              <th>Universidad</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="beca in filteredBecas" :key="beca.id">
              <td>
                <strong>{{ beca.nombre }}</strong>
                <small>{{ beca.descripcion }}</small>
                <small v-if="beca.rechazoMotivo" class="reject-note">Motivo: {{ beca.rechazoMotivo }}</small>
              </td>
              <td>{{ beca.universidadNombre || '-' }}</td>
              <td>{{ beca.fechaCierre ? formatDate(beca.fechaCierre) : '-' }}</td>
              <td><span class="badge" :class="beca.estado">{{ beca.estado }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="primary-btn" type="button" :disabled="beca.estado === 'aprobado'" @click="approve(beca.id)">Aprobar</button>
                  <button class="danger-btn" type="button" :disabled="beca.estado === 'rechazado'" @click="startReject(beca.id)">Rechazar</button>
                  <button class="ghost-btn" type="button" @click="openEdit(beca)">Editar</button>
                  <button class="ghost-btn" type="button" @click="openHistory(beca)">Historial</button>
                  <button class="danger-btn" type="button" @click="remove(beca.id)">Eliminar</button>
                </div>
                <div v-if="rejectingId === beca.id" class="reject-box">
                  <textarea v-model.trim="rejectionReason" rows="3" maxlength="1000" placeholder="Escribe la razon del rechazo" />
                  <small>{{ rejectionReason.length }}/1000</small>
                  <div class="row-actions">
                    <button class="danger-btn" type="button" :disabled="!rejectionReason" @click="confirmReject(beca.id)">Confirmar rechazo</button>
                    <button class="ghost-btn" type="button" @click="cancelReject">Cancelar</button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="submit">
        <h2>{{ editingId ? 'Editar beca' : 'Crear beca' }}</h2>
        <label>Universidad
          <select v-model="form.universidadId">
            <option value="">Sin universidad asociada</option>
            <option v-for="university in adminStore.universities" :key="university.id" :value="university.id">{{ university.nombre }}</option>
          </select>
        </label>
        <label>Nombre <input v-model.trim="form.nombre" required /></label>
        <label>Descripcion <textarea v-model.trim="form.descripcion" rows="4" required /></label>
        <label>Requisitos <textarea v-model.trim="form.requisitos" rows="3" /></label>
        <label>Beneficios <textarea v-model.trim="form.beneficios" rows="3" /></label>
        <div class="form-grid">
          <label>Cobertura % <input v-model.number="form.porcentajeCobertura" type="number" min="0" max="100" step="0.01" /></label>
          <label>Monto <input v-model.number="form.monto" type="number" min="0" step="1" /></label>
          <label>Moneda <input v-model.trim="form.moneda" /></label>
          <label>Inicio <input v-model="form.fechaInicio" type="date" /></label>
          <label>Cierre <input v-model="form.fechaCierre" type="date" /></label>
        </div>
        <label>Enlace <input v-model.trim="form.enlace" type="url" /></label>
        <label v-if="!editingId">Estado
          <select v-model="form.estado">
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit">Guardar</button>
        </div>
      </form>
    </section>

    <section v-if="showHistoryModal" class="modal-backdrop" @click.self="closeHistory">
      <div class="modal">
        <div class="modal-title-row">
          <h2>Historial</h2>
          <button class="ghost-btn" type="button" @click="closeHistory">Cerrar</button>
        </div>
        <div v-if="selectedHistory.length === 0" class="state">Esta beca aun no tiene historial.</div>
        <ol v-else class="history-list">
          <li v-for="entry in selectedHistory" :key="entry.id">
            <strong>{{ formatDateTime(entry.fecha) }}</strong>
            <span class="badge">{{ entry.accion }}</span>
            <p>{{ entry.estadoAnterior || 'sin estado' }} -> {{ entry.estadoNuevo }}</p>
            <small>Actor: {{ entry.actorRol || '-' }}</small>
            <blockquote v-if="entry.motivo">{{ entry.motivo }}</blockquote>
          </li>
        </ol>
      </div>
    </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { useAdminStore } from '@/stores/admin';
import { useBecasStore, type Beca, type BecaModerationHistoryItem } from '@/stores/becas';

const router = useRouter();
const adminStore = useAdminStore();
const becasStore = useBecasStore();
const search = ref('');
const statusFilter = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const showModal = ref(false);
const editingId = ref<string | null>(null);
const rejectingId = ref<string | null>(null);
const rejectionReason = ref('');
const showHistoryModal = ref(false);
const selectedHistory = ref<BecaModerationHistoryItem[]>([]);

const form = reactive({
  universidadId: '',
  nombre: '',
  descripcion: '',
  requisitos: '',
  beneficios: '',
  porcentajeCobertura: null as number | null,
  monto: null as number | null,
  moneda: 'COP',
  fechaInicio: '',
  fechaCierre: '',
  enlace: '',
  estado: 'pendiente',
});

const filteredBecas = computed(() => becasStore.becasAdmin.filter((beca) => {
  const text = `${beca.nombre} ${beca.descripcion} ${beca.universidadNombre || ''}`.toLowerCase();
  return (!search.value || text.includes(search.value.toLowerCase())) && (!statusFilter.value || beca.estado === statusFilter.value);
}));

const setMessage = (text: string, type: 'success' | 'error' = 'success') => { message.value = text; messageType.value = type; };
const load = async () => { await Promise.allSettled([becasStore.fetchAdminBecas(), adminStore.fetchUniversities()]); };
const resetForm = () => {
  editingId.value = null; form.universidadId = ''; form.nombre = ''; form.descripcion = ''; form.requisitos = ''; form.beneficios = '';
  form.porcentajeCobertura = null; form.monto = null; form.moneda = 'COP'; form.fechaInicio = ''; form.fechaCierre = ''; form.enlace = ''; form.estado = 'pendiente';
};
const openCreate = () => { resetForm(); showModal.value = true; };
const openEdit = (beca: Beca) => {
  resetForm(); editingId.value = beca.id; form.universidadId = beca.universidadId || ''; form.nombre = beca.nombre; form.descripcion = beca.descripcion;
  form.requisitos = beca.requisitos || ''; form.beneficios = beca.beneficios || ''; form.porcentajeCobertura = beca.porcentajeCobertura ?? null;
  form.monto = beca.monto ?? null; form.moneda = beca.moneda || 'COP'; form.fechaInicio = beca.fechaInicio?.slice(0, 10) || ''; form.fechaCierre = beca.fechaCierre?.slice(0, 10) || ''; form.enlace = beca.enlace || ''; showModal.value = true;
};
const closeModal = () => { showModal.value = false; resetForm(); };
const payload = () => ({ ...form, universidadId: form.universidadId || null, fechaInicio: form.fechaInicio || null, fechaCierre: form.fechaCierre || null, enlace: form.enlace || null });
const submit = async () => {
  try {
    if (editingId.value) await becasStore.updateAdminBeca(editingId.value, payload());
    else await becasStore.createAdminBeca(payload());
    setMessage('Beca guardada'); closeModal();
  } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo guardar', 'error'); }
};
const approve = async (id: string) => { try { await becasStore.changeBecaStatus(id, 'aprobado'); setMessage('Beca aprobada'); } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo aprobar', 'error'); } };
const startReject = (id: string) => { rejectingId.value = id; rejectionReason.value = ''; };
const cancelReject = () => { rejectingId.value = null; rejectionReason.value = ''; };
const confirmReject = async (id: string) => { try { await becasStore.changeBecaStatus(id, 'rechazado', rejectionReason.value); cancelReject(); setMessage('Beca rechazada'); } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo rechazar', 'error'); } };
const remove = async (id: string) => { if (!window.confirm('Eliminar esta beca?')) return; try { await becasStore.deleteAdminBeca(id); setMessage('Beca eliminada'); } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo eliminar', 'error'); } };
const openHistory = async (beca: Beca) => { selectedHistory.value = await becasStore.fetchBecaModerationHistory(beca.id); showHistoryModal.value = true; };
const closeHistory = () => { showHistoryModal.value = false; selectedHistory.value = []; };
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO');
const formatDateTime = (value: string) => new Date(value).toLocaleString('es-CO');

onMounted(load);
</script>

<style scoped>
.admin-page { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
.page-header, .toolbar, .row-actions, .modal-actions, .modal-title-row { display: flex; gap: 12px; }
.page-header, .modal-title-row { justify-content: space-between; align-items: flex-start; }
.toolbar { align-items: center; margin-bottom: 16px; }
.eyebrow { color: #2563eb; font-weight: 800; margin: 0 0 6px; }
h1, h2, p { margin-top: 0; }
.panel, .modal { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.06); padding: 20px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; vertical-align: top; }
td small { display: block; color: #64748b; margin-top: 4px; }
input, textarea, select { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; }
.toolbar input { flex: 1; }
label { display: grid; gap: 6px; font-weight: 700; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.primary-btn, .ghost-btn, .danger-btn { border: 0; border-radius: 6px; cursor: pointer; font-weight: 800; padding: 10px 14px; }
.primary-btn { background: #2563eb; color: #fff; }
.ghost-btn { background: #e2e8f0; }
.danger-btn { background: #dc2626; color: #fff; }
.badge { border-radius: 999px; padding: 4px 10px; background: #e2e8f0; font-weight: 800; }
.badge.aprobado { background: #dcfce7; color: #166534; }
.badge.rechazado { background: #fee2e2; color: #991b1b; }
.badge.pendiente { background: #f1f5f9; color: #334155; }
.feedback { padding: 12px; border-radius: 8px; background: #dcfce7; color: #166534; }
.feedback.error, .reject-note { background: #fee2e2; color: #991b1b; }
.reject-box { margin-top: 10px; display: grid; gap: 8px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; padding: 20px; z-index: 50; }
.modal { width: min(720px, 100%); max-height: 90vh; overflow: auto; display: grid; gap: 12px; }
.history-list { display: grid; gap: 10px; padding-left: 20px; }
blockquote { margin: 8px 0 0; border-left: 4px solid #cbd5e1; padding-left: 10px; color: #475569; }
@media (max-width: 720px) { .page-header, .toolbar, .row-actions { flex-direction: column; } .form-grid { grid-template-columns: 1fr; } }
</style>
