<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="ea-container header">
      <div>
        <p class="eyebrow">{{ authStore.isAuthenticated ? 'Cuenta personal' : 'Favoritos temporales' }}</p>
        <h1>Mis favoritos</h1>
        <p class="subtitle">
          {{ authStore.isAuthenticated
            ? 'Estos favoritos estan vinculados a tu cuenta.'
            : 'Estos favoritos se guardan solo en este navegador. Inicia sesion para guardarlos en tu cuenta.' }}
        </p>
      </div>
      <div class="header-actions">
        <button v-if="!authStore.isAuthenticated" type="button" class="ea-btn ea-btn-secondary" @click="favoritesStore.clearGuestFavorites">
          Limpiar temporales
        </button>
        <button type="button" class="ea-btn ea-btn-primary" @click="favoritesStore.fetchFavorites">
          Actualizar
        </button>
      </div>
    </section>

    <section v-if="favoritesStore.loading" class="ea-container state-card ea-card">
      Cargando favoritos...
    </section>

    <section v-else-if="favoritesStore.error" class="ea-container state-card error">
      <h2>No pudimos cargar tus favoritos</h2>
      <p>{{ favoritesStore.error }}</p>
    </section>

    <section v-else-if="favoritesStore.favoritesCount === 0" class="ea-container state-card ea-card">
      <h2>No tienes favoritos guardados</h2>
      <p>Explora programas y universidades para guardarlos aqui.</p>
      <div class="empty-actions">
        <button type="button" class="ea-btn ea-btn-primary" @click="router.push('/universities')">
          Ver universidades
        </button>
        <button type="button" class="ea-btn ea-btn-secondary" @click="router.push('/programs')">
          Explorar programas
        </button>
      </div>
    </section>

    <section v-else class="ea-container content">
      <div class="tabs">
        <button
          type="button"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          Todos ({{ favoritesStore.favoritesCount }})
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'universidad' }"
          @click="activeTab = 'universidad'"
        >
          Universidades ({{ favoritesStore.universityFavoritesCount }})
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'programa' }"
          @click="activeTab = 'programa'"
        >
          Programas ({{ favoritesStore.programFavoritesCount }})
        </button>
      </div>

      <div class="favorites-grid">
        <article
          v-for="favorite in visibleFavorites"
          :key="favorite.id"
          class="favorite-card"
          @click="goToFavorite(favorite)"
        >
          <div class="card-header">
            <span class="badge">{{ favorite.tipo }}</span>
            <button
              type="button"
              class="remove-btn"
              :disabled="removingId === favorite.id"
              @click.stop="removeFavorite(favorite.id)"
            >
              Quitar
            </button>
          </div>

          <h2>{{ favorite.item.name }}</h2>
          <p>{{ favorite.item.description || 'Sin descripcion disponible.' }}</p>
          <small>Guardado: {{ formatDate(favorite.addedAt) }}</small>
          <button type="button" class="open-btn" @click.stop="goToFavorite(favorite)">
            Abrir
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { useAuthStore } from '@/stores/auth';
import { useFavoritesStore, type FavoriteItem } from '@/stores/favorites';

const router = useRouter();
const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();
const activeTab = ref<'all' | 'universidad' | 'programa'>('all');
const removingId = ref<string | null>(null);

const visibleFavorites = computed(() => {
  if (activeTab.value === 'all') {
    return favoritesStore.favorites;
  }

  return favoritesStore.favorites.filter((favorite) => favorite.tipo === activeTab.value);
});

const removeFavorite = async (favoriteId: string) => {
  try {
    removingId.value = favoriteId;
    await favoritesStore.removeFavoriteById(favoriteId);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'No se pudo eliminar favorito');
  } finally {
    removingId.value = null;
  }
};

const goToFavorite = (favorite: FavoriteItem) => {
  if (favorite.tipo === 'universidad') {
    router.push(`/university/${favorite.referenciaId}`);
    return;
  }

  router.push('/programs');
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);

onMounted(() => {
  authStore.checkAuth();
  favoritesStore.fetchFavorites();
});
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  margin-bottom: 24px;
}

.header-actions,
.empty-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--ea-primary);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.subtitle {
  color: #64748b;
  margin: 8px 0 0;
}

h1,
h2 {
  margin: 0;
  color: #111827;
}

.open-btn,
.tabs button,
.remove-btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.state-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 28px;
}

.state-card.error {
  color: #991b1b;
  background: #fff7f7;
  border-color: #fecaca;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 10px 14px;
}

.tabs button.active {
  background: #ffe4e6;
  color: #be123c;
  border-color: #fecdd3;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.favorite-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--ea-shadow-sm);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.favorite-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.badge {
  background: #fff1f2;
  color: #be123c;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
}

.remove-btn {
  background: #f3f4f6;
  color: #374151;
  padding: 8px 10px;
}

.open-btn {
  background: #2563eb;
  color: white;
  margin-top: 16px;
  padding: 9px 12px;
}

.remove-btn:disabled {
  cursor: wait;
  opacity: 0.6;
}

.favorite-card h2 {
  margin-bottom: 10px;
  font-size: 1.15rem;
}

.favorite-card p {
  color: #4b5563;
  line-height: 1.5;
}

.favorite-card small {
  color: #6b7280;
}

@media (max-width: 640px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
