<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="programs-hero">
      <div class="ea-container hero-grid">
        <div>
          <p class="ea-kicker">Marketplace academico</p>
          <h1>Encuentra programas listos para comparar</h1>
          <p>
            Explora carreras, modalidades y costos publicados por instituciones del Huila en una vista
            limpia y facil de revisar.
          </p>
        </div>

        <div class="hero-search ea-card">
          <label for="program-search">Buscar programa</label>
          <div>
            <input
              id="program-search"
              v-model="search"
              type="search"
              placeholder="Derecho, Medicina, Ingenieria..."
            />
            <button class="ea-btn ea-btn-primary" type="button">Buscar</button>
          </div>
        </div>
      </div>
    </section>

    <section class="ea-container toolbar">
      <div>
        <strong>{{ filteredPrograms.length }}</strong>
        <span>programas aprobados</span>
      </div>
      <div class="toolbar-actions">
        <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/comparison')">
          Comparar ({{ comparisonStore.programCount }})
        </button>
        <button class="ea-btn ea-btn-soft" type="button" @click="programsStore.fetchPrograms">
          Actualizar
        </button>
      </div>
    </section>

    <section class="ea-container content-layout">
      <aside class="filters-panel ea-card">
        <h2>Filtros</h2>
        <label>
          Modalidad
          <select v-model="modality">
            <option value="">Todas</option>
            <option v-for="item in modalities" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          Orden
          <select v-model="sortBy">
            <option value="name">Nombre</option>
            <option value="price">Menor precio</option>
          </select>
        </label>
      </aside>

      <div class="results">
        <section v-if="programsStore.isLoading" class="ea-card ea-loading">
          Cargando programas...
        </section>

        <section v-else-if="programsStore.error" class="ea-card ea-error">
          {{ programsStore.error }}
        </section>

        <section v-else-if="filteredPrograms.length === 0" class="ea-card ea-empty">
          No hay programas aprobados publicados todavia.
        </section>

        <section v-else class="ea-grid ea-grid-3">
          <CardProgram
            v-for="program in filteredPrograms"
            :key="program.id"
            :program="program"
            :is-compared="isProgramInComparison(program)"
            :is-favorite="favoritesStore.isProgramFavorite(program.id)"
            @view="goToProgram"
            @compare="toggleProgramComparison"
            @favorite="favoritesStore.toggleProgramFavorite(program)"
          />
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import CardProgram from '@/components/CardProgram.vue';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';
import { useProgramsStore, type ProgramCardData } from '@/stores/programs';

const router = useRouter();
const programsStore = useProgramsStore();
const comparisonStore = useComparisonStore();
const favoritesStore = useFavoritesStore();
const search = ref('');
const modality = ref('');
const sortBy = ref<'name' | 'price'>('name');

const modalities = computed(() =>
  Array.from(new Set(programsStore.approvedPrograms.map((program) => program.modalidad).filter(Boolean))).sort()
);

const filteredPrograms = computed(() => {
  const term = search.value.trim().toLowerCase();
  const items = programsStore.approvedPrograms.filter((program) => {
    const matchesTerm = !term ||
      program.nombre.toLowerCase().includes(term) ||
      (program.universityName || '').toLowerCase().includes(term);
    const matchesModality = !modality.value || program.modalidad === modality.value;
    return matchesTerm && matchesModality;
  });

  return [...items].sort((left, right) => {
    if (sortBy.value === 'price') return Number(left.precio || 0) - Number(right.precio || 0);
    return left.nombre.localeCompare(right.nombre);
  });
});

const getUniversityName = (program: ProgramCardData) =>
  program.universityName || 'Universidad no especificada';

const isProgramInComparison = (program: ProgramCardData) =>
  comparisonStore.isProgramInComparison(program.id, program.universidadId || program.universityId || '');

const toggleProgramComparison = (program: Partial<ProgramCardData>) => {
  const typedProgram = program as ProgramCardData;
  const universityId = typedProgram.universidadId || typedProgram.universityId;
  if (!typedProgram.id || !universityId) {
    alert('No se puede comparar este programa porque no tiene universidad asociada.');
    return;
  }

  if (isProgramInComparison(typedProgram)) {
    comparisonStore.removeProgramFromComparison(typedProgram.id, universityId);
    return;
  }

  try {
    comparisonStore.addProgramToComparison(typedProgram.id, universityId, typedProgram.nombre, getUniversityName(typedProgram), {
      duration: typedProgram.duracion,
      modality: typedProgram.modalidad,
      price: typedProgram.precio,
    });
  } catch (error) {
    alert(error instanceof Error ? error.message : 'No se pudo agregar a comparacion');
  }
};

const goToProgram = (program: Partial<ProgramCardData>) => {
  if (program.universidadId && program.id) {
    router.push(`/program/${program.universidadId}/${program.id}`);
  }
};

onMounted(() => {
  comparisonStore.refreshStorageScope();
  void favoritesStore.fetchFavorites();
  void programsStore.fetchPrograms();
});
</script>

<style scoped>
.programs-hero {
  padding: 56px 0 30px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 28px;
  align-items: center;
}

h1 {
  max-width: 760px;
  margin: 0;
  color: var(--ea-text);
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: 1.02;
}

.programs-hero p:not(.ea-kicker) {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--ea-muted);
  font-size: 1.08rem;
}

.hero-search {
  padding: 20px;
}

.hero-search label,
.filters-panel label {
  display: grid;
  gap: 8px;
  color: var(--ea-muted);
  font-weight: 800;
}

.hero-search div {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

input,
select {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  color: var(--ea-text);
  outline: 0;
  padding: 0 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.toolbar strong {
  display: block;
  font-size: 1.8rem;
}

.toolbar span {
  color: var(--ea-muted);
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.content-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 22px;
  padding-bottom: 56px;
}

.filters-panel {
  align-self: start;
  display: grid;
  gap: 16px;
  padding: 20px;
  position: sticky;
  top: 96px;
}

.filters-panel h2 {
  margin: 0;
  font-size: 1.1rem;
}

.results {
  min-width: 0;
}

@media (max-width: 920px) {
  .hero-grid,
  .content-layout {
    grid-template-columns: 1fr;
  }

  .filters-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .toolbar,
  .toolbar-actions,
  .hero-search div {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
