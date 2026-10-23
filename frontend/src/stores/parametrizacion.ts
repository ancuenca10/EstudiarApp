import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';

export type FieldModule = 'universidad' | 'programa' | 'beca';
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'date'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'percentage';

export type FormField = {
  id: string;
  modulo: FieldModule;
  nombreInterno: string;
  nombre_interno: string;
  etiqueta: string;
  tipo: FieldType;
  requerido: boolean;
  activo: boolean;
  orden: number;
  placeholder?: string | null;
  opciones?: Array<{ label: string; value: string }> | null;
  ayuda?: string | null;
  validationRules?: Record<string, unknown> | null;
  defaultValue?: string | null;
  visibleInCard?: boolean;
  visibleInDetail?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editableByUniversity?: boolean;
  editableByAdmin?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FieldPayload = {
  nombreInterno: string;
  etiqueta: string;
  tipo: FieldType;
  requerido: boolean;
  activo: boolean;
  orden: number;
  placeholder?: string | null;
  opciones?: Array<{ label: string; value: string }> | null;
  ayuda?: string | null;
  validationRules?: Record<string, unknown> | null;
  defaultValue?: string | null;
  visibleInCard?: boolean;
  visibleInDetail?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editableByUniversity?: boolean;
  editableByAdmin?: boolean;
};

const unwrapFields = (payload: unknown): FormField[] => {
  const data = payload as Record<string, any>;
  const raw = Array.isArray(data) ? data : data.data || data.fields || [];

  return raw.map((field: any) => ({
    id: field.id,
    modulo: field.modulo,
    nombreInterno: field.nombreInterno || field.nombre_interno,
    nombre_interno: field.nombre_interno || field.nombreInterno,
    etiqueta: field.etiqueta,
    tipo: field.tipo,
    requerido: Boolean(field.requerido),
    activo: Boolean(field.activo),
    orden: Number(field.orden || 0),
    placeholder: field.placeholder,
    opciones: field.opciones || null,
    ayuda: field.ayuda,
    validationRules: field.validationRules || field.validation_rules || null,
    defaultValue: field.defaultValue || field.default_value || null,
    visibleInCard: field.visibleInCard ?? field.visible_in_card ?? false,
    visibleInDetail: field.visibleInDetail ?? field.visible_in_detail ?? true,
    searchable: field.searchable ?? false,
    filterable: field.filterable ?? false,
    editableByUniversity: field.editableByUniversity ?? field.editable_by_university ?? true,
    editableByAdmin: field.editableByAdmin ?? field.editable_by_admin ?? true,
    createdBy: field.createdBy || field.created_by || null,
    updatedBy: field.updatedBy || field.updated_by || null,
    createdAt: field.createdAt || field.created_at,
    updatedAt: field.updatedAt || field.updated_at,
  }));
};

const unwrapField = (payload: unknown): FormField => {
  const data = payload as Record<string, any>;
  const field = unwrapFields([data.data || data.field || data])[0];
  if (!field) {
    throw new Error('Campo de parametrizacion invalido');
  }
  return field;
};

export const useParametrizacionStore = defineStore('parametrizacion', () => {
  const fields = ref<FormField[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentModule = ref<FieldModule>('universidad');

  const activeFields = computed(() => fields.value.filter((field) => field.activo));

  const run = async <T>(task: () => Promise<T>, fallbackMessage: string) => {
    try {
      loading.value = true;
      error.value = null;
      return await task();
    } catch (err) {
      error.value = err instanceof Error ? err.message : fallbackMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchFields = async (modulo: FieldModule = currentModule.value) => {
    currentModule.value = modulo;
    return run(async () => {
      const response = await api.get(`/parametrizacion/${modulo}`);
      fields.value = unwrapFields(response.data);
      return fields.value;
    }, 'Error al cargar campos');
  };

  const createField = async (modulo: FieldModule, payload: FieldPayload) => {
    return run(async () => {
      const response = await api.post(`/parametrizacion/${modulo}`, payload);
      const field = unwrapField(response.data);
      fields.value = [field, ...fields.value.filter((item) => item.id !== field.id)]
        .sort((a, b) => a.orden - b.orden);
      return field;
    }, 'Error al crear campo');
  };

  const updateField = async (fieldId: string, payload: FieldPayload) => {
    return run(async () => {
      const response = await api.put(`/parametrizacion/${fieldId}`, payload);
      const field = unwrapField(response.data);
      fields.value = fields.value.map((item) => (item.id === field.id ? field : item))
        .sort((a, b) => a.orden - b.orden);
      return field;
    }, 'Error al actualizar campo');
  };

  const deleteField = async (fieldId: string) => {
    return run(async () => {
      await api.delete(`/parametrizacion/${fieldId}`);
      fields.value = fields.value.filter((field) => field.id !== fieldId);
    }, 'Error al eliminar campo');
  };

  const toggleField = async (fieldId: string) => {
    return run(async () => {
      const response = await api.patch(`/parametrizacion/${fieldId}/toggle`);
      const field = unwrapField(response.data);
      fields.value = fields.value.map((item) => (item.id === field.id ? field : item));
      return field;
    }, 'Error al activar o desactivar campo');
  };

  const updateOrder = async (fieldId: string, orden: number) => {
    return run(async () => {
      const response = await api.patch(`/parametrizacion/${fieldId}/order`, { orden });
      const field = unwrapField(response.data);
      fields.value = fields.value.map((item) => (item.id === field.id ? field : item))
        .sort((a, b) => a.orden - b.orden);
      return field;
    }, 'Error al actualizar orden');
  };

  return {
    fields,
    activeFields,
    loading,
    error,
    currentModule,
    fetchFields,
    createField,
    updateField,
    deleteField,
    toggleField,
    updateOrder,
  };
});
