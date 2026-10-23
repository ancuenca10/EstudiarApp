import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { Program, University } from '@/types';

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

const GUEST_FAVORITES_KEY = 'guest_favorites';

const toUiType = (tipo: FavoriteKind): FavoriteItem['type'] =>
  tipo === 'programa' ? 'program' : 'university';

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

const getEntityId = (item: Partial<University | Program> & { id?: string; _id?: string }) =>
  item.id || item._id || '';

const getEntityName = (item: Partial<University | Program> & { nombre?: string; name?: string; title?: string }) =>
  item.name || item.nombre || item.title || 'Sin nombre';

const getEntityDescription = (
  item: Partial<University | Program> & { descripcion?: string; description?: string }
) => item.description || item.descripcion || '';

const readGuestFavorites = (): FavoriteItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<FavoriteItem, 'addedAt'> & { addedAt: string }>;
    return parsed.map((favorite) => ({
      ...favorite,
      addedAt: new Date(favorite.addedAt),
    }));
  } catch {
    localStorage.removeItem(GUEST_FAVORITES_KEY);
    return [];
  }
};

const writeGuestFavorites = (favorites: FavoriteItem[]) => {
  localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites));
};

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const source = ref<'account' | 'guest'>('guest');

  const isAccountMode = () => {
    const authStore = useAuthStore();
    authStore.checkAuth();
    return authStore.isAuthenticated;
  };

  const setGuestFavorites = () => {
    source.value = 'guest';
    favorites.value = readGuestFavorites();
  };

  const fetchFavorites = async () => {
    try {
      loading.value = true;
      error.value = null;

      if (!isAccountMode()) {
        setGuestFavorites();
        return;
      }

      source.value = 'account';
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
    if (!isAccountMode()) {
      throw new Error('Inicia sesion para guardar este favorito en tu cuenta');
    }

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
    if (source.value === 'guest' || favoriteId.startsWith('guest-')) {
      favorites.value = favorites.value.filter((favorite) => favorite.id !== favoriteId);
      writeGuestFavorites(favorites.value);
      return;
    }

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

  const optimisticAdd = (favorite: FavoriteItem) => {
    const index = favorites.value.findIndex((item) =>
      item.id === favorite.id ||
      (item.tipo === favorite.tipo && item.referenciaId === favorite.referenciaId)
    );
    if (index >= 0) {
      favorites.value[index] = favorite;
    } else {
      favorites.value.unshift(favorite);
    }
  };

  const optimisticRemove = (tipo: FavoriteKind, referenciaId: string) => {
    favorites.value = favorites.value.filter(
      (favorite) => !(favorite.tipo === tipo && favorite.referenciaId === referenciaId)
    );
  };

  const addUniversityToFavorites = async (university: Partial<University> & { id?: string; _id?: string }) => {
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

  const toggleUniversityFavorite = (university: Partial<University> & { id?: string; _id?: string }) => {
    const universityId = getEntityId(university);
    if (!universityId) {
      return false;
    }

    if (isUniversityFavorite(universityId)) {
      optimisticRemove('universidad', universityId);
      if (source.value === 'guest' || !isAccountMode()) {
        writeGuestFavorites(favorites.value);
      } else {
        void removeUniversityFromFavorites(universityId).catch((err) => {
          error.value = err instanceof Error ? err.message : 'No se pudo eliminar favorito';
          void fetchFavorites();
        });
      }
      return false;
    }

    const guestFavorite: FavoriteItem = {
      id: `guest-university-${universityId}`,
      type: 'university',
      tipo: 'universidad',
      referenciaId: universityId,
      item: {
        id: universityId,
        name: getEntityName(university),
        description: getEntityDescription(university),
      },
      addedAt: new Date(),
    };

    optimisticAdd({
      ...guestFavorite,
      id: isAccountMode() ? `optimistic-university-${universityId}` : guestFavorite.id,
    });

    if (!isAccountMode()) {
      source.value = 'guest';
      writeGuestFavorites(favorites.value);
      return true;
    }

    source.value = 'account';
    void addUniversityToFavorites(university).catch((err) => {
      error.value = err instanceof Error ? err.message : 'No se pudo guardar favorito';
      optimisticRemove('universidad', universityId);
    });
    return true;
  };

  const addProgramToFavorites = async (program: Partial<Program> & { id?: string; _id?: string }, _university?: Partial<University>) => {
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

  const toggleProgramFavorite = (
    program: Partial<Program> & { id?: string; _id?: string },
    _university?: Partial<University>
  ) => {
    const programId = getEntityId(program);
    if (!programId) {
      return false;
    }

    if (isProgramFavorite(programId)) {
      optimisticRemove('programa', programId);
      if (source.value === 'guest' || !isAccountMode()) {
        writeGuestFavorites(favorites.value);
      } else {
        void removeProgramFromFavorites(programId).catch((err) => {
          error.value = err instanceof Error ? err.message : 'No se pudo eliminar favorito';
          void fetchFavorites();
        });
      }
      return false;
    }

    const guestFavorite: FavoriteItem = {
      id: `guest-program-${programId}`,
      type: 'program',
      tipo: 'programa',
      referenciaId: programId,
      item: {
        id: programId,
        name: getEntityName(program),
        description: getEntityDescription(program),
      },
      addedAt: new Date(),
    };

    optimisticAdd({
      ...guestFavorite,
      id: isAccountMode() ? `optimistic-program-${programId}` : guestFavorite.id,
    });

    if (!isAccountMode()) {
      source.value = 'guest';
      writeGuestFavorites(favorites.value);
      return true;
    }

    source.value = 'account';
    void addProgramToFavorites(program).catch((err) => {
      error.value = err instanceof Error ? err.message : 'No se pudo guardar favorito';
      optimisticRemove('programa', programId);
    });
    return true;
  };

  const isFavorite = (referenciaId: string) =>
    favorites.value.some((favorite) => favorite.referenciaId === referenciaId);

  const addProgramFavorite = (program: Partial<Program> & { id?: string; _id?: string }) =>
    toggleProgramFavorite(program);

  const removeProgramFavorite = (programId: string, universityId?: string) =>
    void removeProgramFromFavorites(programId, universityId);

  const addFavorite = async (item: Partial<University> & { id?: string; _id?: string }) => addUniversityToFavorites(item);
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

  const clearGuestFavorites = () => {
    localStorage.removeItem(GUEST_FAVORITES_KEY);
    if (source.value === 'guest') {
      favorites.value = [];
    }
  };

  const getFavoriteProgramsByUniversity = () => [];

  return {
    favorites,
    loading,
    error,
    source,
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
    isFavorite,
    toggleUniversityFavorite,
    addProgramToFavorites,
    removeProgramFromFavorites,
    addProgramFavorite,
    removeProgramFavorite,
    isProgramFavorite,
    toggleProgramFavorite,
    getFavoriteProgramsByUniversity,
    clearGuestFavorites,
  };
});
