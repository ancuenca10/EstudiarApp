<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="ea-container header">
      <div>
        <p class="eyebrow">{{ comparisonStore.storageScope === 'account' ? 'Comparacion de cuenta' : 'Comparacion temporal' }}</p>
        <h1>Comparador</h1>
        <p>
          {{ comparisonStore.storageScope === 'account'
            ? 'Estos elementos se guardan para tu usuario en este navegador.'
            : 'Estos elementos se guardan temporalmente en este navegador.' }}
        </p>
      </div>
      <button v-if="comparisonStore.hasItems" class="danger-btn" type="button" @click="clearComparison">
        Limpiar comparacion
      </button>
    </section>

    <section class="ea-container tabs">
      <button
        type="button"
        :class="{ active: activeTab === 'universities' }"
        @click="activeTab = 'universities'"
      >
        Universidades ({{ universities.length }})
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'programs' }"
        @click="activeTab = 'programs'"
      >
        Programas ({{ programs.length }})
      </button>
    </section>

    <section v-if="!comparisonStore.hasItems" class="ea-container empty-state">
      <h2>No hay elementos en comparacion</h2>
      <p>Agrega universidades o programas desde sus tarjetas para compararlos aqui.</p>
      <div class="empty-actions">
        <button class="ea-btn ea-btn-primary" type="button" @click="router.push('/universities')">Explorar universidades</button>
        <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/programs')">Explorar programas</button>
      </div>
    </section>

    <section v-else-if="activeTab === 'universities'" class="ea-container content">
      <div v-if="universities.length === 0" class="empty-state inner">
        <h2>No hay universidades seleccionadas</h2>
        <p>Agrega universidades desde Inicio o Todas las universidades.</p>
      </div>
      <div v-else class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Campo</th>
              <th v-for="university in universities" :key="university.id">
                <div class="item-head">
                  <div>
                    <strong>{{ university.name }}</strong>
                    <p>{{ university.city || 'Ciudad no especificada' }}</p>
                  </div>
                  <button type="button" @click="comparisonStore.removeUniversityFromComparison(university.id)">x</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ciudad</td>
              <td v-for="university in universities" :key="`${university.id}-city`">{{ university.city || '-' }}</td>
            </tr>
            <tr>
              <td>Pais</td>
              <td v-for="university in universities" :key="`${university.id}-country`">{{ university.country || 'Colombia' }}</td>
            </tr>
            <tr>
              <td>Tipo</td>
              <td v-for="university in universities" :key="`${university.id}-type`">{{ university.type || 'No disponible' }}</td>
            </tr>
            <tr>
              <td>Programas cargados</td>
              <td v-for="university in universities" :key="`${university.id}-programs`">{{ university.programs?.length || 0 }}</td>
            </tr>
            <tr>
              <td>Calificacion</td>
              <td v-for="university in universities" :key="`${university.id}-rating`">{{ university.rating || 'Sin calificacion' }}</td>
            </tr>
            <tr>
              <td>Descripcion</td>
              <td v-for="university in universities" :key="`${university.id}-description`">{{ university.description || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="ea-container content">
      <div v-if="programs.length === 0" class="empty-state inner">
        <h2>No hay programas seleccionados</h2>
        <p>Agrega programas desde el catalogo o el detalle de universidad.</p>
      </div>
      <ComparisonTable v-else :programs="programs" @remove="removeProgram" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import ComparisonTable from '@/components/comparison/ComparisonTable.vue';
import { useComparisonStore } from '@/stores/comparison';

const router = useRouter();
const comparisonStore = useComparisonStore();
const activeTab = ref<'universities' | 'programs'>(comparisonStore.viewMode);

const universities = computed(() => comparisonStore.universityItems);
const programs = computed(() => comparisonStore.getProgramComparisonData());

watch(activeTab, (mode) => comparisonStore.setViewMode(mode));

const clearComparison = () => {
  if (window.confirm('Limpiar todos los elementos de la comparacion?')) {
    comparisonStore.clearComparison();
  }
};

const removeProgram = (programId: string, universityId: string) => {
  comparisonStore.removeFromComparison(programId, universityId);
};

onMounted(() => {
  comparisonStore.refreshStorageScope();
  if (comparisonStore.universityCount > 0 && comparisonStore.programCount === 0) {
    activeTab.value = 'universities';
  }
});
</script>

<style scoped>
.header,
.tabs,
.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header {
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 32px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

.header p,
.empty-state p,
.item-head p {
  color: #64748b;
}

.tabs {
  margin-bottom: 16px;
}

.tabs button,
.ghost-btn,
.danger-btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  padding: 10px 14px;
}

.tabs button,
.ghost-btn {
  background: #e2e8f0;
  color: #1f2937;
}

.tabs button.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.danger-btn {
  background: #dc2626;
  color: white;
}

.content,
.empty-state {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: var(--ea-radius-lg);
  background: white;
  box-shadow: var(--ea-shadow-sm);
}

.empty-state.inner {
  box-shadow: none;
  background: #f8fafc;
}

.comparison-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  min-width: 190px;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}

th:first-child,
td:first-child {
  min-width: 140px;
  color: #475569;
  font-weight: 800;
}

.item-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.item-head p {
  margin: 0.25rem 0 0;
  font-weight: 400;
}

.item-head button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  cursor: pointer;
  font-weight: 900;
}

@media (max-width: 720px) {
  .header {
    justify-content: flex-start;
  }
}
</style>
