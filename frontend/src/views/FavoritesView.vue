<template>
  <main class="favorites-view">
    <section class="header">
      <div>
        <p class="eyebrow">Cuenta personal</p>
        <h1>Mis favoritos</h1>
      </div>
      <button type="button" class="refresh-btn" @click="favoritesStore.fetchFavorites">
        Actualizar
      </button>
    </section>

    <section v-if="favoritesStore.loading" class="state-card">
      Cargando favoritos...
    </section>

    <section v-else-if="favoritesStore.error" class="state-card error">
      <h2>No pudimos cargar tus favoritos</h2>
      <p>{{ favoritesStore.error }}</p>
    </section>

    <section v-else-if="favoritesStore.favoritesCount === 0" class="state-card">
      <h2>No tienes favoritos guardados</h2>
      <p>Explora programas y universidades para guardarlos aqui.</p>
      <button type="button" class="refresh-btn" @click="router.push('/programs')">
        Explorar programas
      </button>
    </section>

    <section v-else class="content">
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
        >
          <div class="card-header">
            <span class="badge">{{ favorite.tipo }}</span>
            <button
              type="button"
              class="remove-btn"
              :disabled="removingId === favorite.id"
              @click="removeFavorite(favorite.id)"
            >
              Quitar
            </button>
          </div>

          <h2>{{ favorite.item.name }}</h2>
          <p>{{ favorite.item.description || 'Sin descripcion disponible.' }}</p>
          <small>Guardado: {{ formatDate(favorite.addedAt) }}</small>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore } from '@/stores/favorites';

const router = useRouter();
const favoritesStore = useFavoritesStore();
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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);

onMounted(() => {
  favoritesStore.fetchFavorites();
});
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px;
}

.header,
.content,
.state-card {
  max-width: 1180px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #e11d48;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1,
h2 {
  margin: 0;
  color: #111827;
}

.refresh-btn,
.tabs button,
.remove-btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.refresh-btn {
  background: #e11d48;
  color: white;
  padding: 10px 16px;
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
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
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
  .favorites-view {
    padding: 20px;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
