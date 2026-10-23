// src/stores/comparison.ts - Versión completa con ambos métodos
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { ComparisonItem, ProgramComparisonData } from '@/types';

export interface ComparisonUniversity {
  id: string;
  _id?: string;
  name: string;
  city?: string;
  country?: string;
  type?: string | null;
  description?: string;
  programs: unknown[];
  rating: number | null;
  addedAt?: Date;
}

export interface ComparisonProgramItem extends ComparisonItem {
  id: string;
  type: 'program';
}

export const useComparisonStore = defineStore('comparison', () => {
  // Estado - DOS tipos de comparación
  const universities = ref<ComparisonUniversity[]>([]);
  const programs = ref<ComparisonProgramItem[]>([]);
  
  const maxUniversities = ref(3);
  const maxPrograms = ref(4);
  const isComparing = ref(false);
  const viewMode = ref<'universities' | 'programs'>('universities');
  const storageScope = ref<'account' | 'guest'>('guest');

  // ============ COMPUTED PROPERTIES ============

  const universityItems = computed(() => universities.value);
  const universityCount = computed(() => universities.value.length);
  const canAddMoreUniversities = computed(() => universities.value.length < maxUniversities.value);
  const isUniversitiesFull = computed(() => universities.value.length >= maxUniversities.value);

  const programItems = computed(() => programs.value);
  const programCount = computed(() => programs.value.length);
  const canAddMorePrograms = computed(() => programs.value.length < maxPrograms.value);
  const isProgramsFull = computed(() => programs.value.length >= maxPrograms.value);

  const comparisonItems = computed(() => universities.value);
  const programComparisonItems = computed(() => programs.value);
  const itemCount = computed(() => universityCount.value + programCount.value);
  const getItemCount = computed(() => programs.value.length);
  const canAddMore = computed(() => canAddMorePrograms.value);
  const isFull = computed(() => isProgramsFull.value);
  const hasItems = computed(() => itemCount.value > 0);

  // ============ MÉTODOS PARA UNIVERSIDADES ============

  const isUniversityInComparison = (universityId: string): boolean => {
    return universities.value.some(item => 
      item.id === universityId || item._id === universityId
    );
  };

  const isProgramInComparison = (programId: string, universityId: string): boolean => {
    return programs.value.some(item =>
      item.programId === programId && item.universityId === universityId
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

  const addProgramToComparison = (
    programIdOrItem: string | {
      id?: string;
      _id?: string;
      name?: string;
      universityId?: string;
      universidadId?: string;
      universityName?: string;
      universidadNombre?: string;
      nombre?: string;
      level?: string;
      duration?: string;
      duracion?: string;
      modality?: string;
      modalidad?: string;
      price?: number | string;
      precio?: number | string;
      schedule?: string;
      quality_rating?: number;
      weekly_hours?: number;
      requires_exam?: boolean;
      requires_interview?: boolean;
      cost?: number | string;
    },
    universityId?: string,
    programName?: string,
    universityName?: string,
    programData?: Partial<ProgramComparisonData>
  ) => {
    if (typeof programIdOrItem !== 'string') {
      const item = programIdOrItem;
      const resolvedProgramId = item.id || item._id;
      const resolvedUniversityId = item.universityId || item.universidadId;

      if (!resolvedProgramId || !resolvedUniversityId) {
        throw new Error('Datos del programa incompletos para comparar');
      }

      return addProgramToComparison(
        resolvedProgramId,
        resolvedUniversityId,
        item.name || item.nombre || 'Programa',
        item.universityName || item.universidadNombre || 'Universidad',
        {
          level: item.level || '',
          duration: item.duration || item.duracion || '',
          price: Number(item.price ?? item.precio ?? item.cost ?? 0),
          modality: item.modality || item.modalidad || '',
          schedule: item.schedule || '',
          quality_rating: item.quality_rating,
          weekly_hours: item.weekly_hours,
          requires_exam: item.requires_exam,
          requires_interview: item.requires_interview,
        }
      );
    }

    if (!universityId || !programName || !universityName) {
      throw new Error('Datos del programa incompletos para comparar');
    }

    if (isProgramsFull.value) {
      throw new Error(`No puedes comparar más de ${maxPrograms.value} programas`);
    }

    const exists = programs.value.find(item => 
      item.programId === programIdOrItem && item.universityId === universityId
    );
    
    if (exists) {
      throw new Error('Este programa ya está en la comparación');
    }

    const newItem: ComparisonProgramItem = {
      id: `${programIdOrItem}:${universityId}`,
      type: 'program',
      programId: programIdOrItem,
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
  const isInComparison = (primaryId: string, secondaryId?: string): boolean => {
    if (secondaryId) {
      return isProgramInComparison(primaryId, secondaryId);
    }

    return isUniversityInComparison(primaryId);
  };

  const removeFromComparison = (id: string, secondaryId?: string) => {
    if (secondaryId) {
      return removeProgramFromComparison(id, secondaryId);
    }
    return removeUniversityFromComparison(id);
  };

  const addToComparison = (...args: [ComparisonUniversity] | [string, string, string, string, Partial<ProgramComparisonData>?]) => {
    if (typeof args[0] === 'string') {
      const [programId, universityId, programName, universityName, programData] = args;
      return addProgramToComparison(programId, universityId, programName, universityName, programData);
    }

    return addUniversityToComparison(args[0]);
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
    const authStore = useAuthStore();
    authStore.checkAuth();
    const key = getStorageKey();
    const data = {
      universities: universities.value.map(item => ({
        ...item,
        addedAt: (item.addedAt || new Date()).toISOString()
      })),
      programs: programs.value.map(item => ({
        ...item,
        addedAt: item.addedAt.toISOString()
      })),
      viewMode: viewMode.value,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getStorageKey = () => {
    const authStore = useAuthStore();
    authStore.checkAuth();
    const userId = authStore.user?.id || authStore.user?._id;

    if (authStore.isAuthenticated && userId) {
      storageScope.value = 'account';
      return `estudiarapp-comparison-v3-user-${userId}`;
    }

    storageScope.value = 'guest';
    return 'estudiarapp-comparison-v3-guest';
  };

  const loadFromLocalStorage = () => {
    const key = getStorageKey();
    const legacy = localStorage.getItem('estudiarapp-comparison-v3');
    const saved = localStorage.getItem(key) || legacy;

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
            id: item.id || `${item.programId}:${item.universityId}`,
            type: 'program',
            addedAt: new Date(item.addedAt)
          }));
        }
        
        if (data.viewMode) {
          viewMode.value = data.viewMode;
        }

        if (!localStorage.getItem(key)) {
          saveToLocalStorage();
        }
      } catch (error) {
        console.error('Error loading comparison from localStorage:', error);
        clearComparison();
      }
    } else {
      universities.value = [];
      programs.value = [];
    }
  };

  const refreshStorageScope = () => {
    loadFromLocalStorage();
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
    storageScope,

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
    programComparisonItems,
    itemCount,
    getItemCount,
    canAddMore,
    isFull,
    hasItems,

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
    refreshStorageScope,
  };
});
