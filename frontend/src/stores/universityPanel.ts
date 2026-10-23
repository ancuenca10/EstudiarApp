import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';
import type { DynamicFieldValue } from '@/stores/admin';

export type UniversityPanelUniversity = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  estado: string;
  dynamicFields?: DynamicFieldValue[];
};

export type UniversityPanelProgram = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | string;
  rechazoMotivo?: string | null;
  fechaRechazo?: string | null;
  dynamicFields?: DynamicFieldValue[];
  creadoEn?: string;
  actualizadoPor?: string | null;
  fechaActualizacion?: string | null;
  actualizadoEn?: string;
};

export type UniversityProgramModerationHistoryItem = {
  id: string;
  programaId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  accion: string;
  motivo?: string | null;
  actorRol?: string | null;
  fecha: string;
};

export type UniversityPanelProgramPayload = {
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  dynamicFields?: Array<{ fieldId: string; value: string | string[] | boolean | null }>;
};

const unwrapOne = <T>(payload: unknown, keys: string[]): T => {
  const data = payload as Record<string, unknown>;
  for (const key of keys) {
    if (data?.[key]) return data[key] as T;
  }
  return (data?.data || payload) as T;
};

const unwrapList = <T>(payload: unknown, keys: string[]): T[] => {
  const data = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as T[];
  }
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
};

export const useUniversityPanelStore = defineStore('universityPanel', () => {
  const university = ref<UniversityPanelUniversity | null>(null);
  const programs = ref<UniversityPanelProgram[]>([]);
  const programModerationHistory = ref<Record<string, UniversityProgramModerationHistoryItem[]>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pendingPrograms = computed(() => programs.value.filter((program) => program.estado === 'pendiente'));
  const approvedPrograms = computed(() => programs.value.filter((program) => program.estado === 'aprobado'));
  const rejectedPrograms = computed(() => programs.value.filter((program) => program.estado === 'rechazado'));

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

  const fetchMyUniversity = async () => {
    return run(async () => {
      const response = await api.get('/university-panel/me');
      university.value = unwrapOne<UniversityPanelUniversity>(response.data, ['university']);
      return university.value;
    }, 'No se pudo cargar la universidad asociada');
  };

  const fetchMyPrograms = async () => {
    return run(async () => {
      const response = await api.get('/university-panel/programas');
      university.value = unwrapOne<UniversityPanelUniversity>(response.data, ['university']) || university.value;
      programs.value = unwrapList<UniversityPanelProgram>(response.data, ['programas', 'programs']);
      return programs.value;
    }, 'No se pudieron cargar los programas');
  };

  const createMyProgram = async (payload: UniversityPanelProgramPayload) => {
    return run(async () => {
      const response = await api.post('/university-panel/programas', payload);
      const program = unwrapOne<UniversityPanelProgram>(response.data, ['programa', 'program']);
      programs.value = [program, ...programs.value.filter((item) => item.id !== program.id)];
      return program;
    }, 'No se pudo crear el programa');
  };

  const updateMyProgram = async (programId: string, payload: UniversityPanelProgramPayload) => {
    return run(async () => {
      const response = await api.put(`/university-panel/programas/${programId}`, payload);
      const program = unwrapOne<UniversityPanelProgram>(response.data, ['programa', 'program']);
      programs.value = programs.value.map((item) => (item.id === program.id ? program : item));
      return program;
    }, 'No se pudo actualizar el programa');
  };

  const deleteMyProgram = async (programId: string) => {
    return run(async () => {
      if (!programId) {
        throw new Error('id de programa requerido');
      }

      await api.delete(`/university-panel/programas/${programId}`);
      programs.value = programs.value.filter((item) => item.id !== programId);
    }, 'No se pudo eliminar el programa');
  };

  const fetchMyProgramModerationHistory = async (programId: string) => {
    return run(async () => {
      if (!programId) {
        throw new Error('id de programa requerido');
      }

      const response = await api.get(`/programas/${programId}/moderation-history`);
      const history = unwrapList<UniversityProgramModerationHistoryItem>(response.data, ['history', 'historial']);
      programModerationHistory.value = {
        ...programModerationHistory.value,
        [programId]: history,
      };
      return history;
    }, 'No se pudo cargar el historial del programa');
  };

  return {
    university,
    programs,
    programModerationHistory,
    loading,
    error,
    pendingPrograms,
    approvedPrograms,
    rejectedPrograms,
    fetchMyUniversity,
    fetchMyPrograms,
    createMyProgram,
    updateMyProgram,
    deleteMyProgram,
    fetchMyProgramModerationHistory,
  };
});
