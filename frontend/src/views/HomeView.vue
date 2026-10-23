<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="home-hero">
      <div class="ea-container hero-layout">
        <div class="hero-copy">
          <p class="ea-kicker">Portal academico del Huila</p>
          <h1>Encuentra tu universidad ideal</h1>
          <p>
            Compara instituciones, programas y becas con una experiencia clara, moderna y pensada
            para tomar mejores decisiones.
          </p>

          <form class="hero-search" @submit.prevent="goToSearch">
            <input
              v-model="search"
              type="search"
              placeholder="Busca por universidad, programa, ciudad o beca"
            />
            <button class="ea-btn ea-btn-primary" type="submit">Buscar</button>
          </form>

          <div class="quick-filters">
            <button type="button" @click="router.push('/universities')">Universidades</button>
            <button type="button" @click="router.push('/programs')">Programas</button>
            <button type="button" @click="router.push('/becas')">Becas</button>
          </div>
        </div>

        <aside class="hero-panel ea-card">
          <span class="panel-icon">ED</span>
          <h2>Explora opciones verificadas</h2>
          <p>Guarda favoritos, arma comparaciones y revisa informacion clave antes de postularte.</p>
          <div class="panel-metrics">
            <span>
              <strong>{{ publicStats.stats.universidadesTotal }}</strong>
              Universidades
            </span>
            <span>
              <strong>{{ programsStore.approvedPrograms.length }}</strong>
              Programas
            </span>
          </div>
        </aside>
      </div>
    </section>

    <section class="ea-container stats-strip ea-grid ea-grid-4">
      <StatsCard label="Universidades" :value="publicStats.stats.universidadesTotal" icon="U" />
      <StatsCard label="Ciudades" :value="publicStats.stats.ciudadesTotal" icon="C" />
      <StatsCard label="Programas aprobados" :value="programsStore.approvedPrograms.length" icon="P" />
      <StatsCard label="Reseñas" :value="publicStats.stats.resenasTotal" icon="R" />
    </section>

    <section class="ea-container home-section">
      <div class="ea-section-heading">
        <div>
          <p class="ea-kicker">Instituciones</p>
          <h2>Universidades destacadas</h2>
          <p>Una seleccion inicial para explorar y comparar rapidamente.</p>
        </div>
        <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/universities')">
          Ver todas
        </button>
      </div>

      <div v-if="universitiesStore.isLoading" class="ea-card ea-loading">Cargando universidades...</div>
      <div v-else-if="universitiesStore.error" class="ea-card ea-error">{{ universitiesStore.error }}</div>
      <div v-else-if="featuredUniversities.length === 0" class="ea-card ea-empty">
        Aun no hay universidades para mostrar.
      </div>
      <div v-else class="ea-grid ea-grid-3">
        <CardUniversity
          v-for="university in featuredUniversities"
          :key="university.id"
          :university="university"
          :is-compared="comparisonStore.isUniversityInComparison(university.id)"
          :is-favorite="favoritesStore.isUniversityFavorite(university.id)"
          @view="router.push(`/university/${university.id}`)"
          @compare="toggleUniversityComparison(university)"
          @favorite="favoritesStore.toggleUniversityFavorite(university)"
        />
      </div>
    </section>

    <section class="ea-container home-section">
      <div class="ea-section-heading">
        <div>
          <p class="ea-kicker">Programas</p>
          <h2>Programas destacados</h2>
          <p>Compara por duracion, modalidad y costo desde el primer vistazo.</p>
        </div>
        <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/programs')">
          Explorar programas
        </button>
      </div>

      <div v-if="programsStore.isLoading" class="ea-card ea-loading">Cargando programas...</div>
      <div v-else-if="programsStore.error" class="ea-card ea-error">{{ programsStore.error }}</div>
      <div v-else-if="featuredPrograms.length === 0" class="ea-card ea-empty">
        Aun no hay programas aprobados publicados.
      </div>
      <div v-else class="ea-grid ea-grid-3">
        <CardProgram
          v-for="program in featuredPrograms"
          :key="program.id"
          :program="program"
          :is-compared="comparisonStore.isProgramInComparison(program.id, program.universidadId)"
          :is-favorite="favoritesStore.isProgramFavorite(program.id)"
          @view="goToProgram"
          @compare="toggleProgramComparison"
          @favorite="favoritesStore.toggleProgramFavorite(program)"
        />
      </div>
    </section>

    <section class="ea-container home-section">
      <div class="ea-section-heading">
        <div>
          <p class="ea-kicker">Financiacion</p>
          <h2>Becas disponibles</h2>
          <p>Oportunidades aprobadas para apoyar tu acceso a educacion superior.</p>
        </div>
        <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/becas')">
          Ver becas
        </button>
      </div>

      <div v-if="becasStore.loading" class="ea-card ea-loading">Cargando becas...</div>
      <div v-else-if="becasStore.error" class="ea-card ea-error">{{ becasStore.error }}</div>
      <div v-else-if="featuredBecas.length === 0" class="ea-card ea-empty">
        Aun no hay becas disponibles.
      </div>
      <div v-else class="ea-grid ea-grid-3">
        <CardScholarship
          v-for="beca in featuredBecas"
          :key="beca.id"
          :beca="beca"
          @view="router.push(`/becas/${beca.id}`)"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import CardProgram from '@/components/CardProgram.vue';
import CardScholarship from '@/components/CardScholarship.vue';
import CardUniversity from '@/components/CardUniversity.vue';
import StatsCard from '@/components/StatsCard.vue';
import { useBecasStore } from '@/stores/becas';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';
import { useProgramsStore, type ProgramCardData } from '@/stores/programs';
import { usePublicStatsStore } from '@/stores/publicStats';
import { useUniversitiesStore } from '@/stores/universities';
import type { University } from '@/types/university';

const router = useRouter();
const search = ref('');
const universitiesStore = useUniversitiesStore();
const programsStore = useProgramsStore();
const becasStore = useBecasStore();
const publicStats = usePublicStatsStore();
const favoritesStore = useFavoritesStore();
const comparisonStore = useComparisonStore();

const featuredUniversities = computed(() => universitiesStore.universities.slice(0, 6));
const featuredPrograms = computed(() => programsStore.approvedPrograms.slice(0, 6));
const featuredBecas = computed(() => becasStore.becasPublicas.slice(0, 3));

const goToSearch = () => {
  router.push({ path: '/search', query: search.value ? { q: search.value } : undefined });
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

const toggleProgramComparison = (program: Partial<ProgramCardData>) => {
  const typedProgram = program as ProgramCardData;
  const universityId = typedProgram.universidadId || typedProgram.universityId;
  if (!typedProgram.id || !universityId) return;

  if (comparisonStore.isProgramInComparison(typedProgram.id, universityId)) {
    comparisonStore.removeProgramFromComparison(typedProgram.id, universityId);
    return;
  }

  try {
    comparisonStore.addProgramToComparison(
      typedProgram.id,
      universityId,
      typedProgram.nombre,
      typedProgram.universityName || 'Universidad no especificada',
      {
        duration: typedProgram.duracion,
        modality: typedProgram.modalidad,
        price: typedProgram.precio,
      }
    );
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
  void Promise.allSettled([
    universitiesStore.fetchUniversities(),
    programsStore.fetchPrograms(),
    becasStore.fetchPublicBecas(),
    favoritesStore.fetchFavorites(),
    publicStats.fetchStats(),
  ]);
});
</script>

<style scoped>
.home-hero {
  padding: 56px 0 30px;
  border-bottom: 1px solid var(--ea-border);
  background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
}

.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 32px;
  align-items: center;
}

.hero-copy h1 {
  max-width: 800px;
  margin: 0;
  color: var(--ea-text);
  font-size: clamp(2.35rem, 5vw, 4.4rem);
  line-height: 1.02;
}

.hero-copy > p:not(.ea-kicker) {
  max-width: 680px;
  margin: 20px 0 0;
  color: var(--ea-muted);
  font-size: 1.15rem;
}

.hero-search {
  display: flex;
  gap: 12px;
  max-width: 760px;
  margin-top: 28px;
  padding: 10px;
  background: var(--ea-surface);
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-md);
}

.hero-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  padding: 0 16px;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.quick-filters button {
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  color: var(--ea-text);
  cursor: pointer;
  font-weight: 800;
  padding: 10px 16px;
}

.hero-panel {
  padding: 28px;
}

.panel-icon {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: var(--ea-radius-lg);
  background: var(--ea-accent);
  color: #fff;
  font-weight: 900;
}

.hero-panel h2 {
  margin: 22px 0 10px;
  font-size: 1.6rem;
}

.hero-panel p {
  color: var(--ea-muted);
}

.panel-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 22px;
}

.panel-metrics span {
  border-radius: var(--ea-radius-md);
  background: var(--ea-surface-muted);
  color: var(--ea-muted);
  padding: 14px;
}

.panel-metrics strong {
  display: block;
  color: var(--ea-text);
  font-size: 1.7rem;
}

.stats-strip,
.home-section {
  margin-top: 30px;
}

.home-section {
  padding-bottom: 26px;
}

.home-section h2 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

@media (max-width: 900px) {
  .hero-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-search {
    flex-direction: column;
  }
}
</style>
