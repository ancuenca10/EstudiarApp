import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';
import type { DynamicFieldValue } from '@/types';

export type SearchType = 'all' | 'universidad' | 'programa';

export type SearchProgram = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  universidadNombre?: string;
  universidadCiudad?: string;
  estado: string;
  dynamicFields: DynamicFieldValue[];
};

export type SearchUniversity = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  estado: string;
  programasCount: number;
  programas: SearchProgram[];
  dynamicFields: DynamicFieldValue[];
};

export type SearchFilters = {
  ciudad: string;
  modalidad: string;
  tipo: SearchType;
  limit: number;
  offset: number;
};

export type SearchParams = Partial<SearchFilters> & {
  q?: string;
};

type SearchApiPayload = {
  universities?: SearchUniversity[];
  programs?: SearchProgram[];
};

const defaultFilters = (): SearchFilters => ({
  ciudad: '',
  modalidad: '',
  tipo: 'all',
  limit: 24,
  offset: 0,
});

const normalizeDynamicFields = (fields: unknown): DynamicFieldValue[] => {
  if (!Array.isArray(fields)) return [];

  return fields
    .filter((field): field is Record<string, unknown> => Boolean(field) && typeof field === 'object')
    .map((field) => ({
      fieldId: String(field.fieldId ?? field.field_id ?? ''),
      nombreInterno: String(field.nombreInterno ?? field.nombre_interno ?? ''),
      etiqueta: String(field.etiqueta ?? ''),
      tipo: String(field.tipo ?? 'text'),
      value:
        field.value === null || field.value === undefined ? null : String(field.value),
      orden: Number(field.orden ?? 0),
    }))
    .filter((field) => field.fieldId && field.etiqueta);
};

const normalizeProgram = (program: unknown): SearchProgram => {
  const item = (program ?? {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? ''),
    nombre: String(item.nombre ?? ''),
    descripcion: String(item.descripcion ?? ''),
    precio: Number(item.precio ?? 0),
    modalidad: String(item.modalidad ?? ''),
    duracion: String(item.duracion ?? ''),
    universidadId: String(item.universidadId ?? item.universidad_id ?? ''),
    universidadNombre:
      item.universidadNombre || item.universidad_nombre
        ? String(item.universidadNombre ?? item.universidad_nombre)
        : undefined,
    universidadCiudad:
      item.universidadCiudad || item.universidad_ciudad
        ? String(item.universidadCiudad ?? item.universidad_ciudad)
        : undefined,
    estado: String(item.estado ?? ''),
    dynamicFields: normalizeDynamicFields(item.dynamicFields ?? item.dynamic_fields),
  };
};

const normalizeUniversity = (university: unknown): SearchUniversity => {
  const item = (university ?? {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? ''),
    nombre: String(item.nombre ?? ''),
    descripcion: String(item.descripcion ?? ''),
    ciudad: String(item.ciudad ?? ''),
    estado: String(item.estado ?? ''),
    programasCount: Number(item.programasCount ?? item.programas_count ?? 0),
    programas: Array.isArray(item.programas) ? item.programas.map(normalizeProgram) : [],
    dynamicFields: normalizeDynamicFields(item.dynamicFields ?? item.dynamic_fields),
  };
};

const unwrap = (payload: unknown): SearchApiPayload => {
  const root = (payload ?? {}) as Record<string, unknown>;
  const nested = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;

  return {
    universities: Array.isArray(nested.universities)
      ? nested.universities.map(normalizeUniversity)
      : [],
    programs: Array.isArray(nested.programs) ? nested.programs.map(normalizeProgram) : [],
  };
};

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const filters = reactive<SearchFilters>(defaultFilters());
  const universities = ref<SearchUniversity[]>([]);
  const programs = ref<SearchProgram[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastParams = ref<SearchParams>({});

  const totalResults = computed(() => universities.value.length + programs.value.length);

  const search = async (params: SearchParams = {}) => {
    try {
      loading.value = true;
      error.value = null;

      query.value = typeof params.q === 'string' ? params.q : query.value;
      filters.ciudad = typeof params.ciudad === 'string' ? params.ciudad : filters.ciudad;
      filters.modalidad =
        typeof params.modalidad === 'string' ? params.modalidad : filters.modalidad;
      filters.tipo = params.tipo ?? filters.tipo;
      filters.limit = params.limit ?? filters.limit;
      filters.offset = params.offset ?? filters.offset;

      const normalizedParams = {
        q: query.value.trim(),
        ciudad: filters.ciudad.trim(),
        modalidad: filters.modalidad.trim(),
        tipo: filters.tipo,
        limit: filters.limit,
        offset: filters.offset,
      };

      lastParams.value = normalizedParams;

      const response = await api.get('/search', {
        params: {
          q: normalizedParams.q || undefined,
          ciudad: normalizedParams.ciudad || undefined,
          modalidad: normalizedParams.modalidad || undefined,
          tipo: normalizedParams.tipo !== 'all' ? normalizedParams.tipo : 'all',
          limit: normalizedParams.limit,
          offset: normalizedParams.offset,
        },
      });

      const data = unwrap(response.data);
      universities.value = data.universities ?? [];
      programs.value = data.programs ?? [];

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error realizando busqueda';
      universities.value = [];
      programs.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearSearch = () => {
    query.value = '';
    Object.assign(filters, defaultFilters());
    universities.value = [];
    programs.value = [];
    loading.value = false;
    error.value = null;
    lastParams.value = {};
  };

  const clear = clearSearch;

  return {
    query,
    filters,
    universities,
    programs,
    loading,
    error,
    lastParams,
    totalResults,
    search,
    clearSearch,
    clear,
  };
});
