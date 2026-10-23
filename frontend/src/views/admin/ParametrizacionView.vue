<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SUPERADMIN</p>
        <h1>Parametrización</h1>
        <p>Administra campos dinámicos para formularios de universidades, programas y becas.</p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="router.push('/admin')">Volver al panel</button>
        <button class="ghost-btn" type="button" @click="store.fetchFields(selectedModule)">Refrescar</button>
        <button class="primary-btn" type="button" @click="openCreateModal">Crear campo</button>
      </div>
    </header>

    <section class="toolbar">
      <div class="segmented">
        <button type="button" :class="{ active: selectedModule === 'universidad' }" @click="changeModule('universidad')">
          Universidades
        </button>
        <button type="button" :class="{ active: selectedModule === 'programa' }" @click="changeModule('programa')">
          Programas
        </button>
        <button type="button" :class="{ active: selectedModule === 'beca' }" @click="changeModule('beca')">
          Becas
        </button>
      </div>
      <input v-model="search" type="search" placeholder="Buscar por etiqueta o nombre interno" />
    </section>

    <p v-if="store.error" class="feedback error">{{ store.error }}</p>
    <p v-if="store.loading" class="feedback">Cargando campos...</p>

    <section class="table-panel">
      <table v-if="filteredFields.length">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Reglas</th>
            <th>Visibilidad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in filteredFields" :key="field.id">
            <td>
              <input class="order-input" type="number" :value="field.orden" @change="updateOrder(field, $event)" />
            </td>
            <td>
              <strong>{{ field.etiqueta }}</strong>
              <small>{{ field.nombreInterno }}</small>
              <small v-if="field.placeholder">Placeholder: {{ field.placeholder }}</small>
            </td>
            <td>
              <span class="tag type">{{ typeLabel(field.tipo) }}</span>
              <span v-if="field.tipo === 'select' || field.tipo === 'multi_select'" class="tag">
                {{ field.opciones?.length || 0 }} opciones
              </span>
            </td>
            <td>
              <span v-if="field.requerido" class="tag required">Requerido</span>
              <span v-if="field.defaultValue" class="tag">Default</span>
            </td>
            <td>
              <span v-if="field.visibleInCard" class="badge-icon" title="Visible en tarjeta">📇</span>
              <span v-if="field.visibleInDetail" class="badge-icon" title="Visible en detalle">📄</span>
              <span v-if="field.searchable" class="badge-icon" title="Buscable">🔍</span>
              <span v-if="field.filterable" class="badge-icon" title="Filtrable">⚙️</span>
              <span v-if="field.editableByUniversity === false" class="badge-icon" title="No editable por universidad">🔒</span>
            </td>
            <td>
              <span class="status" :class="{ active: field.activo }">
                {{ field.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" @click="openEditModal(field)">Editar</button>
                <button type="button" @click="store.toggleField(field.id)">
                  {{ field.activo ? 'Desactivar' : 'Activar' }}
                </button>
                <button class="danger" type="button" @click="deleteField(field.id)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <h3>No hay campos configurados</h3>
        <p>Crea el primer campo dinámico para {{ selectedModuleLabel }}.</p>
      </div>
    </section>

    <!-- Modal de Crear/Editar Campo -->
    <section v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal field-modal" @submit.prevent="saveField">
        <header>
          <h2>{{ editingFieldId ? 'Editar campo' : 'Crear campo' }}</h2>
          <button class="icon-btn" type="button" @click="closeModal">×</button>
        </header>

        <div class="modal-tabs">
          <button type="button" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
            Básico
          </button>
          <button type="button" :class="{ active: activeTab === 'behavior' }" @click="activeTab = 'behavior'">
            Comportamiento
          </button>
          <button type="button" :class="{ active: activeTab === 'visibility' }" @click="activeTab = 'visibility'">
            Visibilidad
          </button>
          <button type="button" :class="{ active: activeTab === 'options' }" @click="activeTab = 'options'">
            Opciones
          </button>
          <button type="button" :class="{ active: activeTab === 'validation' }" @click="activeTab = 'validation'">
            Validación
          </button>
        </div>

        <div class="modal-body">
          <!-- Sección 1: Información básica -->
          <div v-show="activeTab === 'basic'" class="tab-content">
            <label>
              Etiqueta *
              <input v-model.trim="form.etiqueta" required placeholder="Ej: Acreditación institucional" />
            </label>

            <label>
              Nombre interno *
              <div class="name-internal-wrapper">
                <input
                  v-model.trim="form.nombreInterno"
                  required
                  placeholder="Ej: acreditacion_institucional"
                  @input="autoNormalizeName"
                />
                <button type="button" class="auto-btn" @click="autoNormalizeName" title="Normalizar nombre">
                  🔄
                </button>
              </div>
              <small>Se normaliza automáticamente: minúsculas, sin espacios, snake_case</small>
            </label>

            <label>
              Tipo *
              <select v-model="form.tipo" required>
                <option value="text">Texto corto</option>
                <option value="textarea">Texto largo</option>
                <option value="number">Número</option>
                <option value="currency">Moneda</option>
                <option value="percentage">Porcentaje</option>
                <option value="date">Fecha</option>
                <option value="url">URL</option>
                <option value="email">Email</option>
                <option value="phone">Teléfono</option>
                <option value="select">Lista desplegable (select)</option>
                <option value="multi_select">Selección múltiple</option>
                <option value="checkbox">Checkbox booleano</option>
              </select>
            </label>

            <label>
              Placeholder
              <input v-model.trim="form.placeholder" placeholder="Texto de ayuda dentro del campo" />
            </label>

            <label>
              Ayuda
              <textarea v-model.trim="form.ayuda" rows="3" placeholder="Texto explicativo para el usuario" />
            </label>
          </div>

          <!-- Sección 2: Comportamiento -->
          <div v-show="activeTab === 'behavior'" class="tab-content">
            <div class="checks-grid">
              <label class="checkbox-label">
                <input v-model="form.requerido" type="checkbox" />
                <span>Requerido</span>
                <small>El usuario debe completar este campo</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.activo" type="checkbox" />
                <span>Activo</span>
                <small>El campo se muestra en formularios</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.editableByUniversity" type="checkbox" />
                <span>Editable por Universidad</span>
                <small>Las universidades pueden editar este campo</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.editableByAdmin" type="checkbox" />
                <span>Editable por Admin</span>
                <small>Los administradores pueden editar este campo</small>
              </label>
            </div>

            <label>
              Orden
              <input v-model.number="form.orden" type="number" min="0" />
              <small>Orden de aparición en el formulario</small>
            </label>

            <label>
              Valor por defecto
              <input v-model.trim="form.defaultValue" placeholder="Valor predeterminado" />
              <small>Valor que se muestra inicialmente</small>
            </label>
          </div>

          <!-- Sección 3: Visibilidad -->
          <div v-show="activeTab === 'visibility'" class="tab-content">
            <div class="checks-grid">
              <label class="checkbox-label">
                <input v-model="form.visibleInCard" type="checkbox" />
                <span>Mostrar en tarjeta</span>
                <small>Appears in list cards</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.visibleInDetail" type="checkbox" />
                <span>Mostrar en detalle</span>
                <small>Appears in detail view</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.searchable" type="checkbox" />
                <span>Usar en búsqueda</span>
                <small>Incluido en búsqueda global</small>
              </label>

              <label class="checkbox-label">
                <input v-model="form.filterable" type="checkbox" />
                <span>Usar como filtro</span>
                <small>Disponible como filtro en listas</small>
              </label>
            </div>
          </div>

          <!-- Sección 4: Opciones (solo para select/multi_select) -->
          <div v-show="activeTab === 'options'" class="tab-content">
            <div v-if="!isSelectType" class="info-box">
              Las opciones solo aplican para campos de tipo "Lista desplegable" o "Selección múltiple".
            </div>

            <div v-else>
              <p class="section-hint">Agrega las opciones que aparecerán en el dropdown:</p>

              <div class="options-list">
                <div v-for="(option, index) in form.opciones" :key="index" class="option-item">
                  <input
                    v-model="option.label"
                    placeholder="Etiqueta (visible)"
                    @input="syncOptionValue(index)"
                  />
                  <input
                    v-model="option.value"
                    placeholder="Valor (interno)"
                  />
                  <button type="button" class="icon-btn danger" @click="removeOption(index)">×</button>
                </div>
              </div>

              <button type="button" class="ghost-btn" @click="addOption">
                + Agregar opción
              </button>
            </div>
          </div>

          <!-- Sección 5: Validaciones -->
          <div v-show="activeTab === 'validation'" class="tab-content">
            <p class="section-hint">Define reglas de validación para este campo:</p>

            <div class="validation-rules">
              <label v-if="showMinLength">
                Longitud mínima
                <input v-model.number="form.validationRules.minLength" type="number" min="0" placeholder="Mínimo de caracteres" />
              </label>

              <label v-if="showMaxLength">
                Longitud máxima
                <input v-model.number="form.validationRules.maxLength" type="number" min="0" placeholder="Máximo de caracteres" />
              </label>

              <label v-if="showMin">
                Valor mínimo
                <input v-model.number="form.validationRules.min" type="number" placeholder="Valor mínimo" />
              </label>

              <label v-if="showMax">
                Valor máximo
                <input v-model.number="form.validationRules.max" type="number" placeholder="Valor máximo" />
              </label>

              <label v-if="showPattern">
                Patrón regex
                <input v-model.trim="form.validationRules.pattern" placeholder="^[A-Za-z0-9 ]+$" />
              </label>

              <label v-if="showPattern">
                Mensaje de error
                <input v-model.trim="form.validationRules.message" placeholder="El formato no es válido" />
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit">{{ editingFieldId ? 'Guardar cambios' : 'Crear campo' }}</button>
        </div>
      </form>
    </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import {
  useParametrizacionStore,
  type FieldModule,
  type FieldPayload,
  type FieldType,
  type FormField,
} from '@/stores/parametrizacion';

const router = useRouter();
const store = useParametrizacionStore();

const selectedModule = ref<FieldModule>('universidad');
const search = ref('');
const showModal = ref(false);
const editingFieldId = ref('');
const activeTab = ref<'basic' | 'behavior' | 'visibility' | 'options' | 'validation'>('basic');

const getDefaultPayload = (): FieldPayload => ({
  nombreInterno: '',
  etiqueta: '',
  tipo: 'text',
  requerido: false,
  activo: true,
  orden: 0,
  placeholder: '',
  opciones: null,
  ayuda: '',
  validationRules: {},
  defaultValue: '',
  visibleInCard: false,
  visibleInDetail: true,
  searchable: false,
  filterable: false,
  editableByUniversity: true,
  editableByAdmin: true,
});

const form = reactive<FieldPayload & { validationRules: Record<string, unknown> }>({
  ...getDefaultPayload(),
  validationRules: {},
});

const selectedModuleLabel = computed(() =>
  selectedModule.value === 'universidad' ? 'universidades' :
  selectedModule.value === 'programa' ? 'programas' : 'becas'
);

const filteredFields = computed(() => {
  const query = search.value.trim().toLowerCase();
  return store.fields.filter((field) => {
    if (!query) return true;
    return field.etiqueta.toLowerCase().includes(query) ||
      field.nombreInterno.toLowerCase().includes(query);
  });
});

const isSelectType = computed(() =>
  form.tipo === 'select' || form.tipo === 'multi_select'
);

const showMinLength = computed(() =>
  ['text', 'textarea', 'url', 'email', 'phone'].includes(form.tipo)
);

const showMaxLength = computed(() =>
  ['text', 'textarea', 'url', 'email', 'phone'].includes(form.tipo)
);

const showMin = computed(() =>
  ['number', 'currency', 'percentage'].includes(form.tipo)
);

const showMax = computed(() =>
  ['number', 'currency', 'percentage'].includes(form.tipo)
);

const showPattern = computed(() =>
  ['text', 'textarea', 'url', 'email', 'phone'].includes(form.tipo)
);

const changeModule = async (modulo: FieldModule) => {
  selectedModule.value = modulo;
  await store.fetchFields(modulo);
};

const resetForm = () => {
  editingFieldId.value = '';
  Object.assign(form, {
    ...getDefaultPayload(),
    orden: store.fields.length + 1,
  });
};

const openCreateModal = () => {
  resetForm();
  showModal.value = true;
  activeTab.value = 'basic';
};

const openEditModal = (field: FormField) => {
  editingFieldId.value = field.id;

  // Parse opciones desde el formato {label, value}
  let opciones: Array<{ label: string; value: string }> | null = null;
  if (field.opciones && Array.isArray(field.opciones)) {
    opciones = field.opciones.map((opt: any) => ({
      label: opt.label || opt,
      value: opt.value || opt,
    }));
  }

  Object.assign(form, {
    nombreInterno: field.nombreInterno,
    etiqueta: field.etiqueta,
    tipo: field.tipo,
    requerido: field.requerido,
    activo: field.activo,
    orden: field.orden,
    placeholder: field.placeholder || '',
    opciones,
    ayuda: field.ayuda || '',
    validationRules: (field.validationRules as Record<string, unknown>) || {},
    defaultValue: field.defaultValue || '',
    visibleInCard: field.visibleInCard ?? false,
    visibleInDetail: field.visibleInDetail ?? true,
    searchable: field.searchable ?? false,
    filterable: field.filterable ?? false,
    editableByUniversity: field.editableByUniversity ?? true,
    editableByAdmin: field.editableByAdmin ?? true,
  });

  showModal.value = true;
  activeTab.value = 'basic';
};

const closeModal = () => {
  showModal.value = false;
};

const autoNormalizeName = () => {
  if (form.etiqueta && !editingFieldId.value) {
    form.nombreInterno = form.etiqueta
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  } else if (form.nombreInterno) {
    form.nombreInterno = form.nombreInterno
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
};

const addOption = () => {
  if (!form.opciones) {
    form.opciones = [];
  }
  form.opciones.push({ label: '', value: '' });
};

const removeOption = (index: number) => {
  if (form.opciones) {
    form.opciones.splice(index, 1);
  }
};

const syncOptionValue = (index: number) => {
  if (form.opciones && form.opciones[index]) {
    form.opciones[index].value = form.opciones[index].label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
};

const saveField = async () => {
  // Limpiar reglas de validación vacías
  const cleanedRules: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form.validationRules)) {
    if (value !== undefined && value !== '' && value !== null) {
      cleanedRules[key] = value;
    }
  }

  const payload: FieldPayload = {
    ...form,
    opciones: isSelectType.value ? form.opciones : null,
    validationRules: Object.keys(cleanedRules).length > 0 ? cleanedRules : undefined,
  };

  if (editingFieldId.value) {
    await store.updateField(editingFieldId.value, payload);
  } else {
    await store.createField(selectedModule.value, payload);
  }

  closeModal();
};

const deleteField = async (fieldId: string) => {
  if (!confirm('¿Eliminar este campo dinámico? Si tiene valores asociados, se desactivará en lugar de eliminarse.')) return;
  await store.deleteField(fieldId);
};

const updateOrder = async (field: FormField, event: Event) => {
  const input = event.target as HTMLInputElement;
  const orden = Number(input.value);
  if (!Number.isInteger(orden)) return;
  await store.updateOrder(field.id, orden);
};

const typeLabel = (tipo: FieldType) => {
  const labels: Record<FieldType, string> = {
    text: 'Texto corto',
    textarea: 'Texto largo',
    number: 'Número',
    select: 'Lista',
    multi_select: 'Multi-selección',
    checkbox: 'Checkbox',
    date: 'Fecha',
    url: 'URL',
    email: 'Email',
    phone: 'Teléfono',
    currency: 'Moneda',
    percentage: 'Porcentaje',
  };
  return labels[tipo] || tipo;
};

onMounted(() => {
  store.fetchFields(selectedModule.value);
});
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.page-header,
.header-actions,
.toolbar,
.row-actions,
.modal-actions,
.checks {
  display: flex;
  gap: 12px;
}

.page-header {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
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

.toolbar {
  align-items: center;
  margin-bottom: 16px;
}

.toolbar input {
  flex: 1;
}

.segmented {
  background: #e2e8f0;
  border-radius: 8px;
  display: flex;
  padding: 4px;
}

.segmented button {
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 800;
  padding: 9px 12px;
}

.segmented button.active {
  background: #fff;
  color: #2563eb;
}

.toolbar input,
.modal input,
.modal select,
.modal textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 12px;
}

.table-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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

.order-input {
  max-width: 76px;
}

.tag,
.status,
.badge-icon {
  border-radius: 999px;
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 800;
  margin-right: 6px;
  padding: 4px 8px;
}

.tag {
  background: #e0f2fe;
  color: #075985;
}

.tag.type {
  background: #f0f9ff;
  color: #0369a1;
}

.tag.required {
  background: #fef3c7;
  color: #92400e;
}

.status {
  background: #fee2e2;
  color: #991b1b;
}

.status.active {
  background: #dcfce7;
  color: #166534;
}

.badge-icon {
  background: transparent;
  padding: 2px 4px;
  font-size: 1rem;
}

.ghost-btn,
.primary-btn,
.row-actions button,
.icon-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 12px;
}

.ghost-btn,
.row-actions button,
.icon-btn {
  background: #e2e8f0;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.row-actions {
  flex-wrap: wrap;
}

.row-actions .danger {
  background: #fee2e2;
  color: #991b1b;
}

.feedback,
.empty-state {
  padding: 16px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
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
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  width: 100%;
}

.modal header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.modal label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

.modal-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
  padding-bottom: 8px;
}

.modal-tabs button {
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 12px;
  color: #64748b;
}

.modal-tabs button.active {
  background: #e0f2fe;
  color: #0369a1;
}

.modal-body {
  max-height: 60vh;
  overflow-y: auto;
}

.tab-content {
  display: grid;
  gap: 16px;
}

.checks-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
}

.checkbox-label {
  align-items: flex-start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
}

.checkbox-label input {
  margin-top: 2px;
}

.checkbox-label span {
  font-weight: 600;
}

.checkbox-label small {
  color: #64748b;
  font-size: 0.8rem;
  margin: 0;
}

.name-internal-wrapper {
  display: flex;
  gap: 8px;
}

.name-internal-wrapper input {
  flex: 1;
}

.auto-btn {
  background: #e2e8f0;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 8px 12px;
}

.options-list {
  display: grid;
  gap: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-item input {
  flex: 1;
}

.info-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  padding: 12px 16px;
}

.section-hint {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 12px;
}

.validation-rules {
  display: grid;
  gap: 12px;
}

.validation-rules label {
  font-weight: 500;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 860px) {
  .page-header,
  .header-actions,
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .segmented {
    width: 100%;
  }

  .segmented button {
    flex: 1;
  }

  .checks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
