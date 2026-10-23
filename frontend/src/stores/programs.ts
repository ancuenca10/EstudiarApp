import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/services/api';

export interface ProgramCardData {
  id: string;
  _id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  universityId?: string;
  universityName?: string;
  name?: string;
  description?: string;
  price?: number;
  modality?: string;
  duration?: string;
  type?: string;
  currency?: string;
  cost?: number;
  estado: string;
}

type ApiProgram = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
  estado: string;
  universityName?: string;
};

const mapProgram = (program: ApiProgram): ProgramCardData => ({
  id: program.id,
  _id: program.id,
  nombre: program.nombre,
  name: program.nombre,
  descripcion: program.descripcion,
  description: program.descripcion,
  precio: Number(program.precio),
  price: Number(program.precio),
  modalidad: program.modalidad,
  modality: program.modalidad,
  duracion: program.duracion,
  duration: program.duracion,
  universidadId: program.universidadId,
  universityId: program.universidadId,
  universityName: program.universityName,
  currency: 'COP',
  cost: Number(program.precio),
  estado: program.estado,
});

export const useProgramsStore = defineStore('programs', () => {
  const programs = ref<ProgramCardData[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const approvedPrograms = computed(() =>
    programs.value.filter((program) => program.estado === 'aprobado')
  );

  const fetchPrograms = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.get<{ programas: ApiProgram[] }>('/programas');
      programs.value = response.data.programas.map(mapProgram);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando programas';
      programs.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const getProgramById = (programId: string) =>
    programs.value.find((program) => program.id === programId || program._id === programId);

  const fetchProgramById = async (programId: string) => {
    const existing = getProgramById(programId);
    if (existing) {
      return existing;
    }

    await fetchPrograms();
    return getProgramById(programId) || null;
  };

  return {
    programs,
    approvedPrograms,
    isLoading,
    error,
    fetchPrograms,
    getProgramById,
    fetchProgramById,
  };
});
