import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/services/api';

export interface ProgramCardData {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  modalidad: string;
  duracion: string;
  universidadId: string;
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
};

const mapProgram = (program: ApiProgram): ProgramCardData => ({
  id: program.id,
  nombre: program.nombre,
  descripcion: program.descripcion,
  precio: Number(program.precio),
  modalidad: program.modalidad,
  duracion: program.duracion,
  universidadId: program.universidadId,
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

  return {
    programs,
    approvedPrograms,
    isLoading,
    error,
    fetchPrograms,
  };
});
