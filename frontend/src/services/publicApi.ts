import api from './api';
import type { ApiProgram, ApiUniversity, Program, University } from '@/types';

type ProgramsResponse = {
  programas: ApiProgram[];
};

type UniversitiesResponse = {
  universidades: ApiUniversity[];
};

const mapProgram = (program: ApiProgram): Program => ({
  _id: program.id,
  id: program.id,
  name: program.nombre,
  level: 'Pregrado',
  duration: program.duracion,
  price: program.precio,
  modality: program.modalidad as Program['modality'],
  schedule: '',
  description: program.descripcion,
  requirements: [],
  universityId: program.universidadId,
  status: program.estado,
  approvedAt: program.fechaAprobacion,
});

const mapUniversity = (university: ApiUniversity): University => ({
  _id: university.id,
  id: university.id,
  name: university.nombre,
  country: 'Colombia',
  state: '',
  city: university.ciudad,
  type: 'Privada',
  accreditation: university.estado === 'aprobado' ? 'Aprobada' : 'Pendiente',
  contact: {
    email: '',
    phone: '',
    address: '',
    website: '',
  },
  programs: [],
  description: university.descripcion,
  status: university.estado,
  createdBy: university.userId,
  createdAt: new Date(university.creadoEn),
  updatedAt: new Date(university.actualizadoEn),
});

export const publicApi = {
  async getPrograms(): Promise<Program[]> {
    const response = await api.get<ProgramsResponse>('/programas');
    return response.data.programas.map(mapProgram);
  },

  async getUniversities(): Promise<University[]> {
    const response = await api.get<UniversitiesResponse>('/universidades');
    return response.data.universidades.map(mapUniversity);
  },
};
