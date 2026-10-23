<template>
  <main class="becas-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Panel Universidad</p>
        <h1>Mis becas</h1>
        <p>Gestiona becas de tu universidad. Todo cambio vuelve a revision.</p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="router.push('/universidad')">Dashboard</button>
        <button class="primary-btn" type="button" @click="openCreate">Crear beca</button>
      </div>
    </header>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <section v-if="becasStore.error" class="empty-panel">
      <h2>No se pudieron cargar tus becas</h2>
      <p>{{ becasStore.error }}</p>
    </section>

    <section v-else class="panel">
      <div v-if="becasStore.loading && becasStore.misBecas.length === 0" class="state">Cargando becas...</div>
      <div v-else-if="becasStore.misBecas.length === 0" class="state">Todavia no tienes becas registradas.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Beca</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="beca in becasStore.misBecas" :key="beca.id">
              <td>
                <strong>{{ beca.nombre }}</strong>
                <small>{{ beca.descripcion }}</small>
                <div v-if="beca.estado === 'rechazado' && beca.rechazoMotivo" class="rejection-alert">
                  <strong>Esta beca fue rechazada por las siguientes razones:</strong>
                  <p>{{ beca.rechazoMotivo }}</p>
                  <small v-if="beca.fechaRechazo">Fecha: {{ formatDate(beca.fechaRechazo) }}</small>
                </div>
                <div v-if="beca.estado === 'aprobado'" class="approved-note">
                  Si editas esta beca aprobada, volvera a revision.
                </div>
              </td>
              <td>{{ beca.fechaCierre ? formatDate(beca.fechaCierre) : '-' }}</td>
              <td><span class="badge" :class="beca.estado">{{ beca.estado }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="ghost-btn" type="button" @click="openEdit(beca)">Editar</button>
                  <button class="ghost-btn" type="button" @click="openHistory(beca)">Historial</button>
                  <button class="danger-btn" type="button" :disabled="beca.estado === 'aprobado'" @click="remove(beca)">Eliminar</button>
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
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit">Guardar y enviar a revision</button>
        </div>
      </form>
    </section>

    <section v-if="showHistoryModal" class="modal-backdrop" @click.self="closeHistory">
      <div class="modal">
        <div class="modal-title-row">
          <h2>Historial de beca</h2>
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
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBecasStore, type Beca, type BecaModerationHistoryItem } from '@/stores/becas';

const router = useRouter();
const becasStore = useBecasStore();
const showModal = ref(false);
const editingId = ref<string | null>(null);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const showHistoryModal = ref(false);
const selectedHistory = ref<BecaModerationHistoryItem[]>([]);

const form = reactive({
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
});

const setMessage = (text: string, type: 'success' | 'error' = 'success') => { message.value = text; messageType.value = type; };
const resetForm = () => {
  editingId.value = null; form.nombre = ''; form.descripcion = ''; form.requisitos = ''; form.beneficios = '';
  form.porcentajeCobertura = null; form.monto = null; form.moneda = 'COP'; form.fechaInicio = ''; form.fechaCierre = ''; form.enlace = '';
};
const openCreate = () => { resetForm(); showModal.value = true; };
const openEdit = (beca: Beca) => {
  if (beca.estado === 'aprobado' && !window.confirm('Si editas esta beca aprobada, volvera a revision. Continuar?')) return;
  resetForm(); editingId.value = beca.id; form.nombre = beca.nombre; form.descripcion = beca.descripcion; form.requisitos = beca.requisitos || '';
  form.beneficios = beca.beneficios || ''; form.porcentajeCobertura = beca.porcentajeCobertura ?? null; form.monto = beca.monto ?? null;
  form.moneda = beca.moneda || 'COP'; form.fechaInicio = beca.fechaInicio?.slice(0, 10) || ''; form.fechaCierre = beca.fechaCierre?.slice(0, 10) || ''; form.enlace = beca.enlace || ''; showModal.value = true;
};
const closeModal = () => { showModal.value = false; resetForm(); };
const payload = () => ({ ...form, fechaInicio: form.fechaInicio || null, fechaCierre: form.fechaCierre || null, enlace: form.enlace || null });
const submit = async () => {
  try {
    if (editingId.value) await becasStore.updateMyBeca(editingId.value, payload());
    else await becasStore.createMyBeca(payload());
    setMessage('Beca guardada y enviada a revision'); closeModal();
  } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo guardar', 'error'); }
};
const remove = async (beca: Beca) => {
  if (!beca.id || !window.confirm('Eliminar esta beca?')) return;
  try { await becasStore.deleteMyBeca(beca.id); setMessage('Beca eliminada'); } catch (err) { setMessage(err instanceof Error ? err.message : 'No se pudo eliminar', 'error'); }
};
const openHistory = async (beca: Beca) => { selectedHistory.value = await becasStore.fetchBecaModerationHistory(beca.id); showHistoryModal.value = true; };
const closeHistory = () => { showHistoryModal.value = false; selectedHistory.value = []; };
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO');
const formatDateTime = (value: string) => new Date(value).toLocaleString('es-CO');

onMounted(() => becasStore.fetchMyBecas());
</script>

<style scoped>
.becas-page { max-width: 1100px; margin: 0 auto; padding: 32px 20px 56px; }
.page-header, .header-actions, .row-actions, .modal-actions, .modal-title-row { display: flex; gap: 12px; }
.page-header, .modal-title-row { justify-content: space-between; align-items: flex-start; }
.eyebrow { color: #2563eb; font-weight: 800; margin: 0 0 6px; }
h1, h2, p { margin-top: 0; }
.panel, .modal, .empty-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.06); padding: 20px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; vertical-align: top; }
td small { display: block; color: #64748b; margin-top: 4px; }
input, textarea { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; }
label { display: grid; gap: 6px; font-weight: 700; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.primary-btn, .ghost-btn, .danger-btn { border: 0; border-radius: 6px; cursor: pointer; font-weight: 800; padding: 10px 14px; }
.primary-btn { background: #2563eb; color: #fff; }
.ghost-btn { background: #e2e8f0; }
.danger-btn { background: #dc2626; color: #fff; }
.danger-btn:disabled { opacity: .45; cursor: not-allowed; }
.badge { border-radius: 999px; padding: 4px 10px; background: #e2e8f0; font-weight: 800; }
.badge.aprobado { background: #dcfce7; color: #166534; }
.badge.rechazado { background: #fee2e2; color: #991b1b; }
.badge.pendiente { background: #f1f5f9; color: #334155; }
.feedback { padding: 12px; border-radius: 8px; background: #dcfce7; color: #166534; }
.feedback.error, .rejection-alert { background: #fee2e2; color: #991b1b; border-radius: 8px; padding: 10px; margin-top: 8px; }
.approved-note { background: #eff6ff; color: #1d4ed8; border-radius: 8px; padding: 10px; margin-top: 8px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; padding: 20px; z-index: 50; }
.modal { width: min(720px, 100%); max-height: 90vh; overflow: auto; display: grid; gap: 12px; }
.history-list { display: grid; gap: 10px; padding-left: 20px; }
blockquote { margin: 8px 0 0; border-left: 4px solid #cbd5e1; padding-left: 10px; color: #475569; }
@media (max-width: 720px) { .page-header, .header-actions, .row-actions { flex-direction: column; } .form-grid { grid-template-columns: 1fr; } }
</style>
