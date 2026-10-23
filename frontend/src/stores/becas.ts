import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';

export type BecaEstado = 'pendiente' | 'aprobado' | 'rechazado' | string;

export type Beca = {
  id: string;
  universidadId?: string | null;
  universidadNombre?: string | null;
  nombre: string;
  descripcion: string;
  requisitos?: string | null;
  beneficios?: string | null;
  porcentajeCobertura?: number | null;
  monto?: number | null;
  moneda?: string | null;
  fechaInicio?: string | null;
  fechaCierre?: string | null;
  enlace?: string | null;
  estado: BecaEstado;
  rechazoMotivo?: string | null;
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
  fechaAprobacion?: string | null;
  fechaRechazo?: string | null;
  fuenteUrl?: string | null;
  fuenteNombre?: string | null;
};

export type BecaPayload = {
  universidadId?: string | null;
  nombre: string;
  descripcion: string;
  requisitos?: string | null;
  beneficios?: string | null;
  porcentajeCobertura?: number | null;
  monto?: number | null;
  moneda?: string | null;
  fechaInicio?: string | null;
  fechaCierre?: string | null;
  enlace?: string | null;
  estado?: BecaEstado;
  fuenteUrl?: string | null;
  fuenteNombre?: string | null;
};

export type BecaModerationHistoryItem = {
  id: string;
  becaId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  accion: string;
  motivo?: string | null;
  actorRol?: string | null;
  fecha: string;
};

const unwrapOne = <T>(payload: unknown, keys: string[]): T => {
  const data = payload as Record<string, unknown>;
  const nested = data?.data as Record<string, unknown> | undefined;
  for (const key of keys) {
    if (data?.[key]) return data[key] as T;
    if (nested?.[key]) return nested[key] as T;
  }
  return (data?.data || payload) as T;
};

const unwrapList = <T>(payload: unknown, keys: string[]): T[] => {
  const data = payload as Record<string, unknown>;
  const nested = data?.data as Record<string, unknown> | undefined;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as T[];
    if (Array.isArray(nested?.[key])) return nested[key] as T[];
  }
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
};

export const useBecasStore = defineStore('becas', () => {
  const becasPublicas = ref<Beca[]>([]);
  const becasAdmin = ref<Beca[]>([]);
  const misBecas = ref<Beca[]>([]);
  const selectedBeca = ref<Beca | null>(null);
  const moderationHistory = ref<Record<string, BecaModerationHistoryItem[]>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  const fetchPublicBecas = async (filters?: { search?: string; universidadId?: string; vigente?: boolean }) => {
    return run(async () => {
      const response = await api.get('/becas', { params: filters });
      becasPublicas.value = unwrapList<Beca>(response.data, ['becas']);
      return becasPublicas.value;
    }, 'No se pudieron cargar las becas');
  };

  const fetchBecaById = async (id: string) => {
    return run(async () => {
      const response = await api.get(`/becas/${id}`);
      selectedBeca.value = unwrapOne<Beca>(response.data, ['beca']);
      return selectedBeca.value;
    }, 'No se pudo cargar la beca');
  };

  const fetchAdminBecas = async () => {
    return run(async () => {
      const response = await api.get('/becas/admin/all');
      becasAdmin.value = unwrapList<Beca>(response.data, ['becas']);
      return becasAdmin.value;
    }, 'No se pudieron cargar las becas administrativas');
  };

  const createAdminBeca = async (payload: BecaPayload) => {
    return run(async () => {
      const response = await api.post('/becas/admin', payload);
      const beca = unwrapOne<Beca>(response.data, ['beca']);
      becasAdmin.value = [beca, ...becasAdmin.value.filter((item) => item.id !== beca.id)];
      return beca;
    }, 'No se pudo crear la beca');
  };

  const updateAdminBeca = async (id: string, payload: BecaPayload) => {
    return run(async () => {
      const response = await api.put(`/becas/admin/${id}`, payload);
      const beca = unwrapOne<Beca>(response.data, ['beca']);
      becasAdmin.value = becasAdmin.value.map((item) => (item.id === beca.id ? beca : item));
      return beca;
    }, 'No se pudo actualizar la beca');
  };

  const changeBecaStatus = async (id: string, estado: 'aprobado' | 'rechazado', rechazoMotivo?: string) => {
    return run(async () => {
      const response = await api.patch(`/becas/admin/${id}/status`, { estado, rechazoMotivo });
      const beca = unwrapOne<Beca>(response.data, ['beca']);
      becasAdmin.value = becasAdmin.value.map((item) => (item.id === beca.id ? beca : item));
      await fetchAdminBecas();
      return beca;
    }, 'No se pudo cambiar el estado de la beca');
  };

  const deleteAdminBeca = async (id: string) => {
    return run(async () => {
      await api.delete(`/becas/admin/${id}`);
      becasAdmin.value = becasAdmin.value.filter((item) => item.id !== id);
    }, 'No se pudo eliminar la beca');
  };

  const fetchMyBecas = async () => {
    return run(async () => {
      const response = await api.get('/becas/university/mis-becas');
      misBecas.value = unwrapList<Beca>(response.data, ['becas']);
      return misBecas.value;
    }, 'No se pudieron cargar tus becas');
  };

  const createMyBeca = async (payload: BecaPayload) => {
    return run(async () => {
      const response = await api.post('/becas/university', payload);
      const beca = unwrapOne<Beca>(response.data, ['beca']);
      misBecas.value = [beca, ...misBecas.value.filter((item) => item.id !== beca.id)];
      return beca;
    }, 'No se pudo crear la beca');
  };

  const updateMyBeca = async (id: string, payload: BecaPayload) => {
    return run(async () => {
      const response = await api.put(`/becas/university/${id}`, payload);
      const beca = unwrapOne<Beca>(response.data, ['beca']);
      misBecas.value = misBecas.value.map((item) => (item.id === beca.id ? beca : item));
      return beca;
    }, 'No se pudo actualizar la beca');
  };

  const deleteMyBeca = async (id: string) => {
    return run(async () => {
      await api.delete(`/becas/university/${id}`);
      misBecas.value = misBecas.value.filter((item) => item.id !== id);
    }, 'No se pudo eliminar la beca');
  };

  const fetchBecaModerationHistory = async (id: string) => {
    return run(async () => {
      const response = await api.get(`/becas/${id}/moderation-history`);
      const history = unwrapList<BecaModerationHistoryItem>(response.data, ['history', 'historial']);
      moderationHistory.value = { ...moderationHistory.value, [id]: history };
      return history;
    }, 'No se pudo cargar el historial de la beca');
  };

  return {
    becasPublicas,
    becasAdmin,
    misBecas,
    selectedBeca,
    moderationHistory,
    loading,
    error,
    fetchPublicBecas,
    fetchBecaById,
    fetchAdminBecas,
    createAdminBeca,
    updateAdminBeca,
    changeBecaStatus,
    deleteAdminBeca,
    fetchMyBecas,
    createMyBeca,
    updateMyBeca,
    deleteMyBeca,
    fetchBecaModerationHistory,
  };
});
