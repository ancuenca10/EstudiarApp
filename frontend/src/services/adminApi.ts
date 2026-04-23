// Mock API service for universities - localStorage persistence
import type { University, Program } from '@/types';

// Default mock data
const defaultUniversities: University[] = [
  {
    _id: '1',
    name: 'Universidad Surcolombiana',
    country: 'Colombia',
    state: 'Huila',
    city: 'Neiva',
    type: 'Pública',
    accreditation: 'Alta Calidad',
    contact: {
      email: 'info@usco.edu.co',
      phone: '+57 8 8754753',
      address: 'Avenida Pastrana Borrero - Carrera 1',
      website: 'https://www.usco.edu.co'
    },
    programs: [
      {
        _id: '1-1',
        name: 'Ingeniería de Sistemas',
        level: 'Pregrado',
        duration: '10 semestres',
        price: 1500000,
        modality: 'Presencial',
        schedule: 'Diurna',
        description: 'Formación en desarrollo de software y tecnologías de la información',
        requirements: ['Pruebas ICFES', 'Examen de admisión', 'Documento de identidad']
      },
      {
        _id: '1-2',
        name: 'Medicina',
        level: 'Pregrado',
        duration: '12 semestres',
        price: 2500000,
        modality: 'Presencial',
        schedule: 'Diurna',
        description: 'Formación médica integral con enfoque en atención primaria',
        requirements: ['Pruebas ICFES', 'Examen de admisión', 'Entrevista personal']
      }
    ]
  },
  {
    _id: '2',
    name: 'Universidad Corhuila',
    country: 'Colombia',
    state: 'Huila',
    city: 'Neiva',
    type: 'Privada',
    accreditation: 'Acreditada',
    contact: {
      email: 'admisiones@corhuila.com',
      phone: '+57 8 8713131',
      address: 'Calle 19 # 21-40',
      website: 'https://www.corhuila.com'
    },
    programs: [
      {
        _id: '2-1',
        name: 'Administración de Empresas',
        level: 'Pregrado',
        duration: '8 semestres',
        price: 1800000,
        modality: 'Presencial',
        schedule: 'Nocturna',
        description: 'Formación en gestión empresarial y emprendimiento',
        requirements: ['Pruebas ICFES', 'Documento de identidad', 'Fotos']
      }
    ]
  },
  {
    _id: '3',
    name: 'UNINAVARRA',
    country: 'Colombia',
    state: 'Huila',
    city: 'Neiva',
    type: 'Privada',
    accreditation: 'Acreditada',
    contact: {
      email: 'info@uninavarra.edu.co',
      phone: '+57 8 8723535',
      address: 'Carrera 5 # 3-40',
      website: 'https://www.uninavarra.edu.co'
    },
    programs: [
      {
        _id: '3-1',
        name: 'Derecho',
        level: 'Pregrado',
        duration: '10 semestres',
        price: 1600000,
        modality: 'Presencial',
        schedule: 'Diurna/Nocturna',
        description: 'Formación en ciencias jurídicas y litigio',
        requirements: ['Pruebas ICFES', 'Entrevista', 'Documento de identidad']
      }
    ]
  },
  {
    _id: '4',
    name: 'SENA Regional Huila',
    country: 'Colombia',
    state: 'Huila',
    city: 'Neiva',
    type: 'Pública',
    accreditation: 'Alta Calidad',
    contact: {
      email: 'regionalhuila@sena.edu.co',
      phone: '+57 8 8754747',
      address: 'Carrera 9 # 17-33 Sur',
      website: 'https://www.sena.edu.co'
    },
    programs: [
      {
        _id: '4-1',
        name: 'Técnico en Programación',
        level: 'Técnico',
        duration: '4 semestres',
        price: 0,
        modality: 'Presencial',
        schedule: 'Diurna',
        description: 'Formación técnica en desarrollo de software',
        requirements: ['Bachiller', 'Documento de identidad', 'Prueba de aptitud']
      }
    ]
  }
];

// Storage key
const STORAGE_KEY = 'estudiarapp-universities';

// Helper functions for localStorage
const getStoredUniversities = (): University[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default data if nothing exists
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUniversities));
    return defaultUniversities;
  } catch (error) {
    console.error('Error loading universities from localStorage:', error);
    return defaultUniversities;
  }
};

const saveUniversities = (universities: University[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(universities));
  } catch (error) {
    console.error('Error saving universities to localStorage:', error);
  }
};

// Generate unique ID (compatible with MongoDB format)
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// API functions
export const getUniversities = async (): Promise<University[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return getStoredUniversities();
};

export const getUniversityById = async (id: string): Promise<University | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const universities = getStoredUniversities();
  return universities.find(uni => uni._id === id) || null;
};

export const createUniversity = async (universityData: Omit<University, '_id'>): Promise<University> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const newUniversity: University = {
    _id: generateId(),
    ...universityData
  };
  
  universities.push(newUniversity);
  saveUniversities(universities);
  return newUniversity;
};

export const updateUniversity = async (id: string, universityData: Partial<University>): Promise<University> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const index = universities.findIndex(uni => uni._id === id);
  
  if (index === -1) {
    throw new Error('University not found');
  }
  
  universities[index] = { ...universities[index], ...universityData };
  saveUniversities(universities);
  return universities[index];
};

export const deleteUniversity = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const filteredUniversities = universities.filter(uni => uni._id !== id);
  
  if (filteredUniversities.length === universities.length) {
    throw new Error('University not found');
  }
  
  saveUniversities(filteredUniversities);
};

// Program management functions
export const addProgram = async (universityId: string, programData: Omit<Program, '_id'>): Promise<Program> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const university = universities.find(uni => uni._id === universityId);
  
  if (!university) {
    throw new Error('University not found');
  }
  
  const newProgram: Program = {
    _id: generateId(),
    ...programData
  };
  
  university.programs.push(newProgram);
  saveUniversities(universities);
  return newProgram;
};

export const updateProgram = async (universityId: string, programId: string, programData: Partial<Program>): Promise<Program> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const university = universities.find(uni => uni._id === universityId);
  
  if (!university) {
    throw new Error('University not found');
  }
  
  const programIndex = university.programs.findIndex(prog => prog._id === programId);
  if (programIndex === -1) {
    throw new Error('Program not found');
  }
  
  university.programs[programIndex] = { ...university.programs[programIndex], ...programData };
  saveUniversities(universities);
  return university.programs[programIndex];
};

export const deleteProgram = async (universityId: string, programId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const universities = getStoredUniversities();
  const university = universities.find(uni => uni._id === universityId);
  
  if (!university) {
    throw new Error('University not found');
  }
  
  const initialLength = university.programs.length;
  university.programs = university.programs.filter(prog => prog._id !== programId);
  
  if (university.programs.length === initialLength) {
    throw new Error('Program not found');
  }
  
  saveUniversities(universities);
};

// Export all functions as default
export default {
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  addProgram,
  updateProgram,
  deleteProgram
};