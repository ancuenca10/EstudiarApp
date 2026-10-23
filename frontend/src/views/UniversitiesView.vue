<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="catalog-hero">
      <div class="ea-container">
        <p class="ea-kicker">Universidades</p>
        <h1>Explora instituciones de educacion superior</h1>
        <p>Filtra por ciudad, compara alternativas y guarda tus favoritas en una experiencia limpia.</p>
      </div>
    </section>

    <section class="ea-container catalog-toolbar ea-card">
      <input v-model="search" type="search" placeholder="Buscar universidad o ciudad" />
      <select v-model="city">
        <option value="">Todas las ciudades</option>
        <option v-for="item in cities" :key="item" :value="item">{{ item }}</option>
      </select>
      <select v-model="sortBy">
        <option value="name">Nombre A-Z</option>
        <option value="programs">Mas programas</option>
      </select>
      <button class="ea-btn ea-btn-secondary" type="button" @click="clearFilters">Limpiar</button>
    </section>

    <section class="ea-container summary-row">
      <div>
        <strong>{{ filteredUniversities.length }}</strong>
        <span>universidades encontradas</span>
      </div>
      <button class="ea-btn ea-btn-primary" type="button" @click="router.push('/comparison')">
        Ver comparacion ({{ comparisonStore.itemCount }})
      </button>
    </section>

    <section class="ea-container content-layout">
      <aside class="side-panel">
        <StatsCard label="Universidades" :value="universitiesStore.universities.length" icon="UN" />
        <StatsCard label="Ciudades" :value="cities.length" icon="CI" />
        <div class="ea-card quick-actions">
          <h2>Acciones rapidas</h2>
          <button type="button" @click="router.push('/programs')">Explorar programas</button>
          <button type="button" @click="router.push('/becas')">Buscar becas</button>
          <button type="button" @click="router.push('/favorites')">Mis favoritos</button>
        </div>
      </aside>

      <div class="results">
        <div v-if="universitiesStore.isLoading" class="ea-card ea-loading">Cargando universidades...</div>
        <div v-else-if="universitiesStore.error" class="ea-card ea-error">{{ universitiesStore.error }}</div>
        <div v-else-if="filteredUniversities.length === 0" class="ea-card ea-empty">
          No hay universidades para mostrar con esos filtros.
        </div>
        <div v-else class="ea-grid ea-grid-3">
          <CardUniversity
            v-for="university in filteredUniversities"
            :key="university.id"
            :university="university"
            :is-compared="comparisonStore.isUniversityInComparison(university.id)"
            :is-favorite="favoritesStore.isUniversityFavorite(university.id)"
            @view="router.push(`/university/${university.id}`)"
            @compare="toggleUniversityComparison(university)"
            @favorite="favoritesStore.toggleUniversityFavorite(university)"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import CardUniversity from '@/components/CardUniversity.vue';
import StatsCard from '@/components/StatsCard.vue';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';
import { useUniversitiesStore } from '@/stores/universities';
import type { University } from '@/types/university';

const router = useRouter();
const universitiesStore = useUniversitiesStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();
const search = ref('');
const city = ref('');
const sortBy = ref<'name' | 'programs'>('name');

const cities = computed(() =>
  Array.from(
    new Set(
      universitiesStore.universities
        .map((university) => university.city?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort()
);

const filteredUniversities = computed(() => {
  const term = search.value.trim().toLowerCase();
  const items = universitiesStore.universities.filter((university) => {
    const matchesTerm = !term ||
      university.name.toLowerCase().includes(term) ||
      (university.city || '').toLowerCase().includes(term);
    const matchesCity = !city.value || university.city === city.value;
    return matchesTerm && matchesCity;
  });

  return [...items].sort((left, right) => {
    if (sortBy.value === 'programs') return (right.programs?.length || 0) - (left.programs?.length || 0);
    return left.name.localeCompare(right.name);
  });
});

const clearFilters = () => {
  search.value = '';
  city.value = '';
  sortBy.value = 'name';
};

const toggleUniversityComparison = (university: University) => {
  if (comparisonStore.isUniversityInComparison(university.id)) {
    comparisonStore.removeUniversityFromComparison(university.id);
    return;
  }

  try {
    comparisonStore.addUniversityToComparison({
      id: university.id,
      _id: university._id,
      name: university.name,
      city: university.city,
      country: university.country,
      type: university.type,
      description: university.description,
      programs: university.programs || [],
      rating: university.rating || null,
      addedAt: new Date(),
    });
  } catch (error) {
    alert(error instanceof Error ? error.message : 'No se pudo agregar a comparacion');
  }
};

onMounted(() => {
  comparisonStore.refreshStorageScope();
  void universitiesStore.fetchUniversities();
  void favoritesStore.fetchFavorites();
});
</script>

<style scoped>
.catalog-hero {
  padding: 54px 0 24px;
}

.catalog-hero h1 {
  max-width: 820px;
  margin: 0;
  color: var(--ea-text);
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  line-height: 1.02;
}

.catalog-hero p:not(.ea-kicker) {
  max-width: 660px;
  margin: 16px 0 0;
  color: var(--ea-muted);
  font-size: 1.08rem;
}

.catalog-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 220px 180px auto;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
}

input,
select {
  min-height: 46px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  outline: 0;
  padding: 0 16px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.summary-row strong {
  display: block;
  font-size: 1.8rem;
}

.summary-row span {
  color: var(--ea-muted);
}

.content-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 22px;
  padding-bottom: 56px;
}

.side-panel {
  display: grid;
  align-self: start;
  gap: 16px;
  position: sticky;
  top: 96px;
}

.quick-actions {
  display: grid;
  gap: 10px;
  padding: 20px;
}

.quick-actions h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}

.quick-actions button {
  min-height: 44px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-md);
  background: #fff;
  cursor: pointer;
  font-weight: 800;
  text-align: left;
  padding: 0 14px;
}

.results {
  min-width: 0;
}

@media (max-width: 980px) {
  .catalog-toolbar,
  .content-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .summary-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
