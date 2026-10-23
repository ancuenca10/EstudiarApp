<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="ea-container hero">
      <div>
        <p class="eyebrow">Busqueda global</p>
        <h1>Encuentra universidades y programas</h1>
        <p>Busca por nombre, descripcion, ciudad, modalidad o cualquier valor dinamico visible.</p>
      </div>
      <router-link class="ea-btn ea-btn-secondary" to="/">Volver al inicio</router-link>
    </section>

    <form class="ea-container search-panel" @submit.prevent="submitSearch">
      <input
        v-model.trim="form.q"
        type="search"
        placeholder="Ej: sistemas, salud, virtual, Neiva, bilingue..."
      />
      <input v-model.trim="form.ciudad" type="text" placeholder="Ciudad" />
      <select v-model="form.modalidad">
        <option value="">Todas las modalidades</option>
        <option value="Presencial">Presencial</option>
        <option value="Virtual">Virtual</option>
        <option value="Hibrido">Hibrido</option>
        <option value="Híbrido">Hibrido</option>
      </select>
      <select v-model="form.tipo">
        <option value="all">Todo</option>
        <option value="universidad">Universidades</option>
        <option value="programa">Programas</option>
      </select>
      <button class="ea-btn ea-btn-primary" type="submit" :disabled="searchStore.loading">
        {{ searchStore.loading ? 'Buscando...' : 'Buscar' }}
      </button>
    </form>

    <div class="ea-container summary-row">
      <p v-if="searchStore.error" class="state error">{{ searchStore.error }}</p>
      <p v-else-if="searchStore.loading" class="state">Buscando resultados...</p>
      <p v-else class="results-count">
        {{ searchStore.totalResults }} resultado{{ searchStore.totalResults === 1 ? '' : 's' }}
      </p>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="ea-btn ea-btn-secondary"
        @click="resetSearch"
      >
        Limpiar busqueda
      </button>
    </div>

    <section v-if="searchStore.universities.length" class="ea-container results-section">
      <div class="section-header">
        <h2>Universidades</h2>
        <span>{{ searchStore.universities.length }}</span>
      </div>
      <div class="cards-grid">
        <UniversityCard
          v-for="university in searchStore.universities"
          :key="university.id"
          :university="university"
        />
      </div>
    </section>

    <section v-if="searchStore.programs.length" class="ea-container results-section">
      <div class="section-header">
        <h2>Programas</h2>
        <span>{{ searchStore.programs.length }}</span>
      </div>
      <div class="cards-grid">
        <ProgramCard
          v-for="program in searchStore.programs"
          :key="program.id"
          :program="program"
        />
      </div>
    </section>

    <section v-if="!searchStore.loading && !searchStore.totalResults" class="ea-container empty">
      <h2>No encontramos resultados</h2>
      <p>Prueba con otra palabra, ciudad o modalidad.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import ProgramCard from '@/components/ProgramCard.vue';
import UniversityCard from '@/components/UniversityCard.vue';
import { useSearchStore, type SearchType } from '@/stores/search';

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();

const form = reactive({
  q: '',
  ciudad: '',
  modalidad: '',
  tipo: 'all' as SearchType,
});

let debounceTimer: number | undefined;
let syncingFromRoute = false;

const hasActiveFilters = computed(
  () => Boolean(form.q || form.ciudad || form.modalidad || form.tipo !== 'all')
);

const parseType = (value: unknown): SearchType => {
  return value === 'universidad' || value === 'programa' || value === 'all' ? value : 'all';
};

const syncFormFromRoute = () => {
  syncingFromRoute = true;
  form.q = typeof route.query.q === 'string' ? route.query.q : '';
  form.ciudad = typeof route.query.ciudad === 'string' ? route.query.ciudad : '';
  form.modalidad = typeof route.query.modalidad === 'string' ? route.query.modalidad : '';
  form.tipo = parseType(route.query.tipo);
  searchStore.query = form.q;
  searchStore.filters.ciudad = form.ciudad;
  searchStore.filters.modalidad = form.modalidad;
  searchStore.filters.tipo = form.tipo;
  syncingFromRoute = false;
};

const replaceRoute = async () => {
  await router.replace({
    path: '/search',
    query: {
      q: form.q || undefined,
      ciudad: form.ciudad || undefined,
      modalidad: form.modalidad || undefined,
      tipo: form.tipo !== 'all' ? form.tipo : undefined,
    },
  });
};

const executeSearch = async () => {
  await searchStore.search({
    q: form.q,
    ciudad: form.ciudad,
    modalidad: form.modalidad,
    tipo: form.tipo,
  });
};

const submitSearch = async () => {
  await replaceRoute();
  await executeSearch();
};

const resetSearch = async () => {
  searchStore.clearSearch();
  form.q = '';
  form.ciudad = '';
  form.modalidad = '';
  form.tipo = 'all';
  await router.replace({ path: '/search' });
  await executeSearch();
};

watch(
  () => route.query,
  async () => {
    syncFormFromRoute();
    await executeSearch();
  },
  { immediate: true }
);

watch(
  () => ({ ...form }),
  () => {
    if (syncingFromRoute) return;
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      await replaceRoute();
    }, 350);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }
});
</script>

<style scoped>
.hero {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: 32px;
  margin-bottom: 24px;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

.search-panel {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(140px, 1fr)) auto;
  padding: 16px;
}

.search-panel input,
.search-panel select {
  border: 1px solid #cbd5e1;
  border-radius: var(--ea-radius-sm);
  padding: 10px 12px;
}

.summary-row {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 0;
}

.state.error {
  color: #991b1b;
}

.results-section {
  margin-top: 24px;
}

.section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cards-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.empty {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  margin-top: 24px;
  padding: 24px;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
  }

  .search-panel {
    grid-template-columns: 1fr;
  }

  .summary-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
