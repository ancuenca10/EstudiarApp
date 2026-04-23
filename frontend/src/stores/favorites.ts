// src/stores/favorites.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Program } from '@/types';

export interface FavoriteItem {
  type: 'university' | 'program';
  id: string;
  item: any;
  addedAt: Date;
}

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([]);
  const loading = ref(false);

  // ============ CARGAR/GRABAR ============
  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('estudiarapp_favorites_v2');
      if (saved) {
        const data = JSON.parse(saved);
        favorites.value = data.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          item: item.item || null
        }));
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      favorites.value = [];
    }
  };

  const saveFavorites = () => {
    try {
      localStorage.setItem('estudiarapp_favorites_v2', 
        JSON.stringify(favorites.value.map(item => ({
          ...item,
          addedAt: item.addedAt.toISOString()
        })))
      );
    } catch (error) {
      console.error('Error guardando favoritos:', error);
    }
  };

  // ============ UNIVERSIDADES ============
  const addUniversityToFavorites = (university: any) => {
    const universityId = university.id || university._id;
    if (!universityId) {
      throw new Error('Universidad no tiene ID válido');
    }

    // Verificar si ya existe
    if (isUniversityFavorite(universityId)) {
      return false;
    }

    favorites.value.push({
      type: 'university',
      id: universityId,
      item: {
        ...university,
        id: universityId
      },
      addedAt: new Date()
    });

    saveFavorites();
    return true;
  };

  const removeUniversityFromFavorites = (universityId: string) => {
    const initialLength = favorites.value.length;
    favorites.value = favorites.value.filter(fav => 
      !(fav.type === 'university' && fav.id === universityId)
    );
    
    if (favorites.value.length < initialLength) {
      saveFavorites();
    }
  };

  const isUniversityFavorite = (universityId: string): boolean => {
    return favorites.value.some(fav => 
      fav.type === 'university' && fav.id === universityId
    );
  };

  // ============ PROGRAMAS ============
  const addProgramToFavorites = (program: any, university: any) => {
    const programId = program._id || program.id;
    const universityId = university.id || university._id;
    
    if (!programId || !universityId) {
      throw new Error('Programa o universidad sin ID válido');
    }

    // Verificar si ya existe
    if (isProgramFavorite(programId, universityId)) {
      return false;
    }

    // Agregar programa
    favorites.value.push({
      type: 'program',
      id: `${universityId}_${programId}`,
      item: {
        program: { ...program, id: programId },
        university: { ...university, id: universityId },
        combinedId: `${universityId}_${programId}`
      },
      addedAt: new Date()
    });

    // Asegurar que la universidad también sea favorita
    if (!isUniversityFavorite(universityId)) {
      addUniversityToFavorites(university);
    }

    saveFavorites();
    return true;
  };

  const removeProgramFromFavorites = (programId: string, universityId: string) => {
    const initialLength = favorites.value.length;
    favorites.value = favorites.value.filter(fav => 
      !(fav.type === 'program' && fav.id === `${universityId}_${programId}`)
    );
    
    if (favorites.value.length < initialLength) {
      saveFavorites();
    }
  };

  const isProgramFavorite = (programId: string, universityId: string): boolean => {
    return favorites.value.some(fav => 
      fav.type === 'program' && fav.id === `${universityId}_${programId}`
    );
  };

  // ============ MÉTODOS GENERALES ============
  const toggleUniversityFavorite = (university: any) => {
    const universityId = university.id || university._id;
    if (!universityId) return false;

    if (isUniversityFavorite(universityId)) {
      removeUniversityFromFavorites(universityId);
      return false;
    } else {
      return addUniversityToFavorites(university);
    }
  };

  const toggleProgramFavorite = (program: any, university: any) => {
    const programId = program._id || program.id;
    const universityId = university.id || university._id;
    
    if (!programId || !universityId) return false;

    if (isProgramFavorite(programId, universityId)) {
      removeProgramFromFavorites(programId, universityId);
      return false;
    } else {
      return addProgramToFavorites(program, university);
    }
  };

  // ============ GETTERS ============
  const universityFavorites = computed(() => 
    favorites.value.filter(fav => fav.type === 'university').map(fav => fav.item)
  );

  const programFavorites = computed(() => 
    favorites.value.filter(fav => fav.type === 'program').map(fav => fav.item)
  );

  const favoritesCount = computed(() => favorites.value.length);
  const universityFavoritesCount = computed(() => universityFavorites.value.length);
  const programFavoritesCount = computed(() => programFavorites.value.length);

  // ============ BÚSQUEDA ============
  const getFavoriteProgramsByUniversity = (universityId: string) => {
    return programFavorites.value
      .filter(item => item.university.id === universityId)
      .map(item => item.program);
  };

  // Inicializar
  loadFavorites();

  return {
    // Estado
    favorites,
    loading,

    // Getters
    universityFavorites,
    programFavorites,
    favoritesCount,
    universityFavoritesCount,
    programFavoritesCount,

    // Métodos de universidad
    addUniversityToFavorites,
    removeUniversityFromFavorites,
    isUniversityFavorite,
    toggleUniversityFavorite,

    // Métodos de programa
    addProgramToFavorites,
    removeProgramFromFavorites,
    isProgramFavorite,
    toggleProgramFavorite,

    // Métodos generales
    getFavoriteProgramsByUniversity,
    loadFavorites,
    saveFavorites
  };
});