import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/services/api';

export type FavoriteKind = 'programa' | 'universidad';

export interface FavoriteItem {
  id: string;
  type: 'program' | 'university';
  tipo: FavoriteKind;
  referenciaId: string;
  item: {
    id: string;
    name: string;
    description?: string;
  };
  addedAt: Date;
}

type ApiFavorite = {
  id: string;
  tipo: FavoriteKind;
  referenciaId: string;
  creadoEn: string;
  referencia: {
    id: string;
    nombre: string | null;
    descripcion: string | null;
  };
};

const toUiType = (tipo: FavoriteKind): FavoriteItem['type'] =>
  tipo === 'programa' ? 'program' : 'university';

const toApiType = (type: string): FavoriteKind =>
  type === 'program' || type === 'programa' ? 'programa' : 'universidad';

const mapFavorite = (favorite: ApiFavorite): FavoriteItem => ({
  id: favorite.id,
  type: toUiType(favorite.tipo),
  tipo: favorite.tipo,
  referenciaId: favorite.referenciaId,
  item: {
    id: favorite.referencia.id,
    name: favorite.referencia.nombre || 'Sin nombre',
    description: favorite.referencia.descripcion || '',
  },
  addedAt: new Date(favorite.creadoEn),
});

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchFavorites = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await api.get<{ favoritos: ApiFavorite[] }>('/favoritos');
      favorites.value = response.data.favoritos.map(mapFavorite);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error cargando favoritos';
      favorites.value = [];
    } finally {
      loading.value = false;
    }
  };

  const addFavoriteByReference = async (tipo: FavoriteKind, referenciaId: string) => {
    const response = await api.post<{ favorito: ApiFavorite }>('/favoritos', {
      tipo,
      referencia_id: referenciaId,
    });

    const favorite = mapFavorite(response.data.favorito);
    const index = favorites.value.findIndex((item) => item.id === favorite.id);

    if (index >= 0) {
      favorites.value[index] = favorite;
    } else {
      favorites.value.unshift(favorite);
    }

    return favorite;
  };

  const removeFavoriteById = async (favoriteId: string) => {
    await api.delete(`/favoritos/${favoriteId}`);
    favorites.value = favorites.value.filter((favorite) => favorite.id !== favoriteId);
  };

  const findFavorite = (tipo: FavoriteKind, referenciaId: string) => {
    return favorites.value.find(
      (favorite) => favorite.tipo === tipo && favorite.referenciaId === referenciaId
    );
  };

  const removeByReference = async (tipo: FavoriteKind, referenciaId: string) => {
    const favorite = findFavorite(tipo, referenciaId);
    if (!favorite) {
      return false;
    }

    await removeFavoriteById(favorite.id);
    return true;
  };

  const isUniversityFavorite = (universityId: string): boolean =>
    Boolean(findFavorite('universidad', universityId));

  const isProgramFavorite = (programId: string, _universityId?: string): boolean =>
    Boolean(findFavorite('programa', programId));

  const addUniversityToFavorites = async (university: any) => {
    const universityId = university.id || university._id;
    if (!universityId) {
      throw new Error('Universidad no tiene ID valido');
    }

    await addFavoriteByReference('universidad', universityId);
    return true;
  };

  const removeUniversityFromFavorites = async (universityId: string) => {
    await removeByReference('universidad', universityId);
  };

  const toggleUniversityFavorite = async (university: any) => {
    const universityId = university.id || university._id;
    if (!universityId) {
      return false;
    }

    if (isUniversityFavorite(universityId)) {
      await removeUniversityFromFavorites(universityId);
      return false;
    }

    await addUniversityToFavorites(university);
    return true;
  };

  const addProgramToFavorites = async (program: any, _university?: any) => {
    const programId = program.id || program._id;
    if (!programId) {
      throw new Error('Programa no tiene ID valido');
    }

    await addFavoriteByReference('programa', programId);
    return true;
  };

  const removeProgramFromFavorites = async (programId: string, _universityId?: string) => {
    await removeByReference('programa', programId);
  };

  const toggleProgramFavorite = async (program: any, _university?: any) => {
    const programId = program.id || program._id;
    if (!programId) {
      return false;
    }

    if (isProgramFavorite(programId)) {
      await removeProgramFromFavorites(programId);
      return false;
    }

    await addProgramToFavorites(program);
    return true;
  };

  const addFavorite = async (item: any) => addUniversityToFavorites(item);
  const removeFavorite = async (id: string) => removeUniversityFromFavorites(id);

  const universityFavorites = computed(() =>
    favorites.value.filter((favorite) => favorite.type === 'university')
  );

  const programFavorites = computed(() =>
    favorites.value.filter((favorite) => favorite.type === 'program')
  );

  const favoritesCount = computed(() => favorites.value.length);
  const universityFavoritesCount = computed(() => universityFavorites.value.length);
  const programFavoritesCount = computed(() => programFavorites.value.length);

  const loadFavorites = fetchFavorites;
  const saveFavorites = () => undefined;

  const getFavoriteProgramsByUniversity = () => [];

  return {
    favorites,
    loading,
    error,
    universityFavorites,
    programFavorites,
    favoritesCount,
    universityFavoritesCount,
    programFavoritesCount,
    fetchFavorites,
    loadFavorites,
    saveFavorites,
    addFavoriteByReference,
    removeFavoriteById,
    addFavorite,
    removeFavorite,
    addUniversityToFavorites,
    removeUniversityFromFavorites,
    isUniversityFavorite,
    toggleUniversityFavorite,
    addProgramToFavorites,
    removeProgramFromFavorites,
    isProgramFavorite,
    toggleProgramFavorite,
    getFavoriteProgramsByUniversity,
  };
});
