import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/services/api';
import type { Program, University } from '@/types/university';

type DynamicFieldValue = {
  fieldId: string;
  nombreInterno: string;
  etiqueta: string;
  tipo: string;
  value: string | null;
  orden: number;
};

type ApiUniversity = {
  id: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  userId: string;
  estado: string;
  dynamicFields?: DynamicFieldValue[];
  programas?: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    precio?: number | string;
    modalidad?: string;
    duracion?: string;
    estado?: string;
    dynamicFields?: DynamicFieldValue[];
  }>;
  programasCount?: number;
  creadoEn: string;
  actualizadoEn: string;
};

const mapUniversity = (university: ApiUniversity): University => ({
  id: university.id,
  _id: university.id,
  name: university.nombre,
  country: 'Colombia',
  state: '',
  city: university.ciudad,
  website: '',
  description: university.descripcion,
  accreditation: undefined,
  dynamicFields: university.dynamicFields || [],
  status: university.estado === 'aprobado' ? 'approved' : 'pending_review',
  createdBy: university.userId,
  createdAt: new Date(university.creadoEn),
  updatedAt: new Date(university.actualizadoEn),
  version: 1,
  programs: (university.programas || []).map((program) => ({
    id: program.id,
    _id: program.id,
    name: program.nombre,
    description: program.descripcion,
    duration: program.duracion,
    price:
      program.precio !== undefined && program.precio !== null
        ? Number(program.precio)
        : undefined,
    modality: program.modalidad,
    cost: program.precio !== undefined ? String(program.precio) : undefined,
    dynamicFields: program.dynamicFields || [],
    status: program.estado === 'aprobado' ? 'approved' : 'pending_review',
    createdAt: new Date(university.creadoEn),
  })),
});

export const useUniversitiesStore = defineStore('universities', () => {
  const universities = ref<University[]>([]);
  const programs = ref<Program[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentUniversity = ref<University | null>(null);

  const fetchUniversities = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await api.get<{ universidades: ApiUniversity[] }>('/universidades');
      universities.value = response.data.universidades.map(mapUniversity);
      if (currentUniversity.value) {
        currentUniversity.value =
          universities.value.find((item) => item.id === currentUniversity.value?.id) || null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando universidades';
      universities.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const getUniversityById = (id: string): University | undefined => {
    return universities.value.find((university) => university.id === id || university._id === id);
  };

  const loadUniversityById = async (id: string): Promise<University | null> => {
    const existing = getUniversityById(id);
    if (existing) {
      currentUniversity.value = existing;
      return existing;
    }

    await fetchUniversities();
    currentUniversity.value = getUniversityById(id) || null;
    return currentUniversity.value;
  };

  const createUniversity = async (universityData: Partial<University>) => {
    const response = await api.post<{ universidad: ApiUniversity }>('/universidades', {
      nombre: universityData.name,
      descripcion: universityData.description,
      ciudad: universityData.city,
    });

    const university = mapUniversity(response.data.universidad);
    universities.value.unshift(university);
    currentUniversity.value = university;
    return university;
  };

  const updateUniversity = async (universityData: University) => {
    const index = universities.value.findIndex((university) => university.id === universityData.id);
    if (index !== -1) {
      universities.value[index] = { ...universityData, updatedAt: new Date() };
    }
  };

  const approveUniversity = async (universityId: string, approvedBy: string) => {
    const university = getUniversityById(universityId);
    if (university) {
      university.status = 'approved';
      university.approvedBy = approvedBy;
      university.approvedAt = new Date();
      university.updatedAt = new Date();
    }
  };

  const rejectUniversity = async (universityId: string, reason: string, rejectedBy: string) => {
    const university = getUniversityById(universityId);
    if (university) {
      university.status = 'rejected';
      university.rejectionReason = reason;
      university.approvedBy = rejectedBy;
      university.approvedAt = new Date();
      university.updatedAt = new Date();
    }
  };

  const deleteUniversity = async (universityId: string) => {
    await api.delete(`/universidades/${universityId}`);
    universities.value = universities.value.filter((university) => university.id !== universityId);
  };

  const createProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'status'>) => {
    const newProgram: Program = {
      ...programData,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'pending_review',
    };

    programs.value.push(newProgram);
    return newProgram;
  };

  const approvedUniversities = computed(() =>
    universities.value.filter((university) => university.status === 'approved')
  );

  const pendingUniversities = computed(() =>
    universities.value.filter((university) => university.status === 'pending_review')
  );

  const publicUniversities = computed(() =>
    universities.value.filter((university) => university.type === 'public')
  );

  const privateUniversities = computed(() =>
    universities.value.filter((university) => university.type === 'private')
  );

  const loadUniversities = fetchUniversities;
  const fetchUniversityById = loadUniversityById;

  return {
    universities,
    programs,
    isLoading,
    error,
    currentUniversity,
    approvedUniversities,
    pendingUniversities,
    publicUniversities,
    privateUniversities,
    fetchUniversities,
    loadUniversities,
    getUniversityById,
    loadUniversityById,
    fetchUniversityById,
    createUniversity,
    updateUniversity,
    approveUniversity,
    rejectUniversity,
    deleteUniversity,
    createProgram,
  };
});
