// src/stores/comparison.ts - Versión completa con ambos métodos
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ComparisonItem, ProgramComparisonData } from '@/types';

export interface ComparisonUniversity {
  id: string;
  _id?: string;
  name: string;
  city: string;
  country: string;
  type: string;
  description?: string;
  programs: any[];
  rating: number | null;
  addedAt: Date;
}

export const useComparisonStore = defineStore('comparison', () => {
  // Estado - DOS tipos de comparación
  const universities = ref<ComparisonUniversity[]>([]);
  const programs = ref<ComparisonItem[]>([]);
  
  const maxUniversities = ref(3);
  const maxPrograms = ref(4);
  const isComparing = ref(false);
  const viewMode = ref<'universities' | 'programs'>('universities');

  // ============ COMPUTED PROPERTIES ============

  const universityItems = computed(() => universities.value);
  const universityCount = computed(() => universities.value.length);
  const canAddMoreUniversities = computed(() => universities.value.length < maxUniversities.value);
  const isUniversitiesFull = computed(() => universities.value.length >= maxUniversities.value);

  const programItems = computed(() => programs.value);
  const programCount = computed(() => programs.value.length);
  const canAddMorePrograms = computed(() => programs.value.length < maxPrograms.value);
  const isProgramsFull = computed(() => programs.value.length >= maxPrograms.value);

  const comparisonItems = computed(() => 
    viewMode.value === 'universities' ? universities.value : programs.value
  );
  const itemCount = computed(() => 
    viewMode.value === 'universities' ? universityCount.value : programCount.value
  );

  // ============ MÉTODOS PARA UNIVERSIDADES ============

  const isUniversityInComparison = (universityId: string): boolean => {
    return universities.value.some(item => 
      item.id === universityId || item._id === universityId
    );
  };

  const addUniversityToComparison = (university: ComparisonUniversity) => {
    if (isUniversitiesFull.value) {
      throw new Error(`No puedes comparar más de ${maxUniversities.value} universidades`);
    }

    const universityId = university.id || university._id;
    if (!universityId) {
      throw new Error('ID de universidad no válido');
    }

    const exists = universities.value.some(item => 
      item.id === universityId || item._id === universityId
    );
    
    if (exists) {
      throw new Error('Esta universidad ya está en la comparación');
    }

    universities.value.push({
      ...university,
      id: universityId,
      addedAt: new Date(),
    });

    saveToLocalStorage();
    return true;
  };

  const removeUniversityFromComparison = (universityId: string) => {
    universities.value = universities.value.filter(item => 
      item.id !== universityId && item._id !== universityId
    );
    saveToLocalStorage();
  };

  // ============ MÉTODOS PARA PROGRAMAS ============

  const isProgramInComparison = (programId: string, universityId: string): boolean => {
    return programs.value.some(item => 
      item.programId === programId && item.universityId === universityId
    );
  };

  const addProgramToComparison = (
    programId: string, 
    universityId: string, 
    programName: string, 
    universityName: string,
    programData?: any
  ) => {
    if (isProgramsFull.value) {
      throw new Error(`No puedes comparar más de ${maxPrograms.value} programas`);
    }

    const exists = programs.value.find(item => 
      item.programId === programId && item.universityId === universityId
    );
    
    if (exists) {
      throw new Error('Este programa ya está en la comparación');
    }

    const newItem: ComparisonItem = {
      programId,
      programName,
      universityId,
      universityName,
      addedAt: new Date(),
      ...(programData && { programData })
    };

    programs.value.push(newItem);
    saveToLocalStorage();
    return newItem;
  };

  const removeProgramFromComparison = (programId: string, universityId: string) => {
    programs.value = programs.value.filter(item => 
      !(item.programId === programId && item.universityId === universityId)
    );
    saveToLocalStorage();
  };

  // ============ MÉTODOS GENERALES ============

  const clearComparison = () => {
    universities.value = [];
    programs.value = [];
    saveToLocalStorage();
  };

  const setComparing = (value: boolean) => {
    isComparing.value = value;
  };

  const setViewMode = (mode: 'universities' | 'programs') => {
    viewMode.value = mode;
  };

  // ============ MÉTODOS DE AYUDA ============

  // Método de compatibilidad para HomeView
  const isInComparison = (universityId: string): boolean => {
    return isUniversityInComparison(universityId);
  };

  // Método de compatibilidad para HomeView
  const addToComparison = (university: ComparisonUniversity) => {
    return addUniversityToComparison(university);
  };

  // Método de compatibilidad para HomeView
  const removeFromComparison = (universityId: string) => {
    return removeUniversityFromComparison(universityId);
  };

  const getProgramComparisonData = (): ProgramComparisonData[] => {
    return programs.value.map(item => ({
      id: item.programId,
      name: item.programName,
      universityName: item.universityName,
      universityId: item.universityId,
      level: item.programData?.level || '',
      duration: item.programData?.duration || '',
      price: item.programData?.price || 0,
      modality: item.programData?.modality || '',
      schedule: item.programData?.schedule || '',
      quality_rating: item.programData?.quality_rating || 0,
      weekly_hours: item.programData?.weekly_hours || 0,
      requires_exam: item.programData?.requires_exam || false,
      requires_interview: item.programData?.requires_interview || false,
      addedAt: item.addedAt
    }));
  };

  // ============ PERSISTENCIA ============

  const saveToLocalStorage = () => {
    const data = {
      universities: universities.value.map(item => ({
        ...item,
        addedAt: item.addedAt.toISOString()
      })),
      programs: programs.value.map(item => ({
        ...item,
        addedAt: item.addedAt.toISOString()
      })),
      viewMode: viewMode.value,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('estudiarapp-comparison-v3', JSON.stringify(data));
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('estudiarapp-comparison-v3');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.universities) {
          universities.value = data.universities.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }));
        }
        
        if (data.programs) {
          programs.value = data.programs.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }));
        }
        
        if (data.viewMode) {
          viewMode.value = data.viewMode;
        }
      } catch (error) {
        console.error('Error loading comparison from localStorage:', error);
        clearComparison();
      }
    }
  };

  // Inicializar
  loadFromLocalStorage();

  return {
    // Estado
    universities,
    programs,
    maxUniversities,
    maxPrograms,
    isComparing,
    viewMode,

    // Computed properties
    universityItems,
    universityCount,
    canAddMoreUniversities,
    isUniversitiesFull,
    
    programItems,
    programCount,
    canAddMorePrograms,
    isProgramsFull,
    
    comparisonItems,
    itemCount,

    // Métodos para universidades
    isUniversityInComparison,
    addUniversityToComparison,
    removeUniversityFromComparison,

    // Métodos para programas
    isProgramInComparison,
    addProgramToComparison,
    removeProgramFromComparison,

    // Métodos generales
    clearComparison,
    setComparing,
    setViewMode,
    getProgramComparisonData,
    
    // Métodos de compatibilidad para HomeView
    isInComparison,
    addToComparison,
    removeFromComparison,
    
    // Métodos de persistencia
    loadFromLocalStorage,
    saveToLocalStorage,
  };
});