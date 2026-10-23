import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';
import type { User, UserRole } from '@/types';

export type AdminProgram = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  modalidad?: string;
  duracion?: string;
  universidadId?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | string;
  creadoEn?: string;
  actualizadoPor?: string | null;
  fechaActualizacion?: string | null;
  fechaAprobacion?: string | null;
  rechazoMotivo?: string | null;
  fechaRechazo?: string | null;
  fuenteUrl?: string | null;
  fuenteNombre?: string | null;
  fechaImportacion?: string | null;
  dynamicFields?: DynamicFieldValue[];
};

export type ProgramModerationHistoryItem = {
  id: string;
  programaId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  accion: string;
  motivo?: string | null;
  actorRol?: string | null;
  fecha: string;
};

export type AdminUniversity = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  userId?: string;
  estado?: 'pendiente' | 'aprobado' | string;
  fuenteUrl?: string | null;
  fuenteNombre?: string | null;
  fechaImportacion?: string | null;
  creadoEn?: string;
  dynamicFields?: DynamicFieldValue[];
};

export type DynamicFieldValue = {
  fieldId: string;
  nombreInterno?: string;
  etiqueta?: string;
  tipo?: string;
  value: string | string[] | boolean | null;
  orden?: number;
};

type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

type UpdateUserPayload = {
  name: string;
  email: string;
  role?: UserRole;
  password?: string;
};

type CreateUniversityPayload = {
  nombre: string;
  descripcion: string;
  ciudad: string;
  userId?: string;
  estado?: string;
  fuenteUrl?: string;
  fuenteNombre?: string;
  dynamicFields?: DynamicFieldValue[];
};

type CreateProgramPayload = {
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  estado?: string;
  rechazoMotivo?: string;
  fuenteUrl?: string;
  fuenteNombre?: string;
  dynamicFields?: DynamicFieldValue[];
};

const unwrap = <T>(payload: unknown, keys: string[]): T => {
  const value = payload as Record<string, unknown>;
  const nested = value?.data as Record<string, unknown> | undefined;

  for (const key of keys) {
    if (value?.[key]) return value[key] as T;
    if (nested?.[key]) return nested[key] as T;
  }

  return payload as T;
};

export const useAdminStore = defineStore('admin', () => {
  const users = ref<User[]>([]);
  const universityUsers = ref<User[]>([]);
  const programs = ref<AdminProgram[]>([]);
  const programModerationHistory = ref<Record<string, ProgramModerationHistoryItem[]>>({});
  const universities = ref<AdminUniversity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const pendingPrograms = computed(() =>
    programs.value.filter((program) => program.estado === 'pendiente')
  );

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

  const fetchUsers = async () => {
    return run(async () => {
      const response = await api.get('/users');
      users.value = unwrap<User[]>(response.data, ['users']);
      return users.value;
    }, 'Error al cargar usuarios');
  };

  const fetchUniversityUsers = async () => {
    return run(async () => {
      const response = await api.get('/users/university-accounts');
      universityUsers.value = unwrap<User[]>(response.data, ['users']);
      return universityUsers.value;
    }, 'Error al cargar usuarios UNIVERSITY');
  };

  const createAdmin = async (payload: CreateUserPayload) => {
    return run(async () => {
      const response = await api.post('/users/admins', payload);
      const user = unwrap<User>(response.data, ['user']);
      users.value = [user, ...users.value.filter((item) => item.id !== user.id)];
      return user;
    }, 'Error al crear ADMIN');
  };

  const createAsesor = async (payload: CreateUserPayload) => {
    return run(async () => {
      const response = await api.post('/users/asesores', payload);
      const user = unwrap<User>(response.data, ['user']);
      users.value = [user, ...users.value.filter((item) => item.id !== user.id)];
      return user;
    }, 'Error al crear ASESOR');
  };

  const createUser = async (payload: CreateUserPayload & { role: UserRole }) => {
    return run(async () => {
      const response = await api.post('/users', payload);
      const user = unwrap<User>(response.data, ['user']);
      users.value = [user, ...users.value.filter((item) => item.id !== user.id)];
      return user;
    }, 'Error al crear usuario');
  };

  const changeUserRole = async (userId: string, role: UserRole) => {
    return run(async () => {
      const response = await api.patch(`/users/${userId}/role`, { role });
      const user = unwrap<User>(response.data, ['user']);
      users.value = users.value.map((item) => (item.id === user.id ? user : item));
      return user;
    }, 'Error al cambiar rol');
  };

  const updateUser = async (userId: string, payload: UpdateUserPayload) => {
    return run(async () => {
      const response = await api.patch(`/users/${userId}`, payload);
      const user = unwrap<User>(response.data, ['user']);
      users.value = users.value.map((item) => (item.id === user.id ? user : item));
      return user;
    }, 'Error al actualizar usuario');
  };

  const deleteUser = async (userId: string) => {
    return run(async () => {
      await api.delete(`/users/${userId}`);
      users.value = users.value.filter((item) => item.id !== userId);
    }, 'Error al eliminar usuario');
  };

  const fetchPrograms = async () => {
    return run(async () => {
      const response = await api.get('/programas/admin/todos');
      programs.value = unwrap<AdminProgram[]>(response.data, ['programas', 'programs']);
      return programs.value;
    }, 'Error al cargar programas');
  };

  const createProgram = async (payload: CreateProgramPayload) => {
    return run(async () => {
      const response = await api.post('/programas', {
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        precio: payload.precio,
        modalidad: payload.modalidad,
        duracion: payload.duracion,
        universidadId: payload.universidadId,
        fuenteUrl: payload.fuenteUrl,
        fuenteNombre: payload.fuenteNombre,
        dynamicFields: payload.dynamicFields,
      });
      const program = unwrap<AdminProgram>(response.data, ['programa', 'program']);
      programs.value = [program, ...programs.value.filter((item) => item.id !== program.id)];
      return program;
    }, 'Error al crear programa');
  };

  const approveProgram = async (programId: string) => {
    return run(async () => {
      const response = await api.put(`/programas/${programId}/aprobar`);
      const program = unwrap<AdminProgram>(response.data, ['programa', 'program']);
      programs.value = programs.value.map((item) => (item.id === program.id ? program : item));
      await fetchPrograms();
      return program;
    }, 'Error al aprobar programa');
  };

  const changeProgramStatus = async (
    programId: string,
    estado: 'aprobado' | 'rechazado',
    rechazoMotivo?: string
  ) => {
    return run(async () => {
      const response = await api.patch(`/programas/${programId}/status`, {
        estado,
        rechazoMotivo,
      });
      const program = unwrap<AdminProgram>(response.data, ['programa', 'program']);
      programs.value = programs.value.map((item) => (item.id === program.id ? program : item));
      await fetchPrograms();
      return program;
    }, 'Error al cambiar estado del programa');
  };

  const updateProgram = async (programId: string, payload: CreateProgramPayload) => {
    return run(async () => {
      const response = await api.put(`/programas/${programId}`, {
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        precio: payload.precio,
        modalidad: payload.modalidad,
        duracion: payload.duracion,
        universidadId: payload.universidadId,
        estado: payload.estado,
        rechazoMotivo: payload.rechazoMotivo,
        fuenteUrl: payload.fuenteUrl,
        fuenteNombre: payload.fuenteNombre,
        dynamicFields: payload.dynamicFields,
      });
      const program = unwrap<AdminProgram>(response.data, ['programa', 'program']);
      programs.value = programs.value.map((item) => (item.id === program.id ? program : item));
      return program;
    }, 'Error al actualizar programa');
  };

  const deleteProgram = async (programId: string) => {
    return run(async () => {
      await api.delete(`/programas/${programId}`);
      programs.value = programs.value.filter((item) => item.id !== programId);
    }, 'Error al eliminar programa');
  };

  const fetchProgramModerationHistory = async (programId: string) => {
    return run(async () => {
      const response = await api.get(`/programas/${programId}/moderation-history`);
      const history = unwrap<ProgramModerationHistoryItem[]>(response.data, ['history', 'historial']);
      programModerationHistory.value = {
        ...programModerationHistory.value,
        [programId]: history,
      };
      return history;
    }, 'Error al cargar historial de moderacion');
  };

  const fetchUniversities = async () => {
    return run(async () => {
      const response = await api.get('/universidades');
      universities.value = unwrap<AdminUniversity[]>(response.data, ['universidades', 'universities']);
      return universities.value;
    }, 'Error al cargar universidades');
  };

  const createUniversity = async (payload: CreateUniversityPayload) => {
    return run(async () => {
      const response = await api.post('/universidades', payload);
      const university = unwrap<AdminUniversity>(response.data, ['universidad', 'university']);
      universities.value = [university, ...universities.value.filter((item) => item.id !== university.id)];
      return university;
    }, 'Error al crear universidad');
  };

  const deleteUniversity = async (universityId: string) => {
    return run(async () => {
      await api.delete(`/universidades/${universityId}`);
      universities.value = universities.value.filter((item) => item.id !== universityId);
    }, 'Error al eliminar universidad');
  };

  const updateUniversity = async (universityId: string, payload: CreateUniversityPayload) => {
    return run(async () => {
      const response = await api.put(`/universidades/${universityId}`, payload);
      const university = unwrap<AdminUniversity>(response.data, ['universidad', 'university']);
      universities.value = universities.value.map((item) =>
        item.id === university.id ? university : item
      );
      return university;
    }, 'Error al actualizar universidad');
  };

  return {
    users,
    universityUsers,
    programs,
    programModerationHistory,
    universities,
    loading,
    error,
    pendingPrograms,
    fetchUsers,
    fetchUniversityUsers,
    createAdmin,
    createAsesor,
    createUser,
    changeUserRole,
    updateUser,
    deleteUser,
    fetchPrograms,
    createProgram,
    approveProgram,
    changeProgramStatus,
    updateProgram,
    deleteProgram,
    fetchProgramModerationHistory,
    fetchUniversities,
    createUniversity,
    updateUniversity,
    deleteUniversity,
  };
});
