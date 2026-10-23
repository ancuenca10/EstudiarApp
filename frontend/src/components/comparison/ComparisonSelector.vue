<template>
  <section class="comparison-selector">
    <div class="selector-header">
      <h3>Añadir programas</h3>
      <p>{{ selectedCount }}/4 seleccionados</p>
    </div>

    <div class="selector-controls">
      <input v-model.trim="searchQuery" type="search" placeholder="Buscar por programa o universidad" />
      <button type="button" @click="clearSearch">Limpiar</button>
    </div>

    <div v-if="searchResults.length > 0" class="results">
      <article v-for="item in searchResults" :key="item.id" class="result-item">
        <div>
          <h4>{{ item.programName }}</h4>
          <p>{{ item.universityName }}</p>
        </div>
        <button
          type="button"
          :disabled="!canAddMore && !isInComparison(item.programId, item.universityId)"
          @click="toggleProgram(item)"
        >
          {{ isInComparison(item.programId, item.universityId) ? 'Quitar' : 'Agregar' }}
        </button>
      </article>
    </div>

    <p v-else class="empty">No hay coincidencias para esa búsqueda.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useComparisonStore } from '@/stores/comparison';

interface SearchItem {
  id: string;
  programId: string;
  universityId: string;
  programName: string;
  universityName: string;
}

const props = defineProps<{
  programs?: SearchItem[];
}>();

const comparisonStore = useComparisonStore();
const searchQuery = ref('');

const selectedCount = computed(() => comparisonStore.programComparisonItems.length);
const canAddMore = computed(() => comparisonStore.canAddMore);

const searchResults = computed(() => {
  const source = props.programs || [];
  if (!searchQuery.value) return source;

  const query = searchQuery.value.toLowerCase();
  return source.filter((item) =>
    item.programName.toLowerCase().includes(query) ||
    item.universityName.toLowerCase().includes(query)
  );
});

const isInComparison = (programId: string, universityId: string) =>
  comparisonStore.isInComparison(programId, universityId);

const clearSearch = () => {
  searchQuery.value = '';
};

const toggleProgram = (item: SearchItem) => {
  if (isInComparison(item.programId, item.universityId)) {
    comparisonStore.removeFromComparison(item.programId, item.universityId);
    return;
  }

  comparisonStore.addToComparison(item.programId, item.universityId, item.programName, item.universityName);
};
</script>

<style scoped>
.comparison-selector {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.selector-header,
.selector-controls,
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.selector-controls input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
}

.results {
  display: grid;
  gap: 0.75rem;
}

.result-item {
  padding: 0.85rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.result-item h4,
.result-item p,
.selector-header h3,
.selector-header p {
  margin: 0;
}

.empty {
  margin: 0;
  color: #6b7280;
}
</style>
