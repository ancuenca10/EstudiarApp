<template>
  <main class="catalog-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Programas aprobados</p>
        <h1>Explora la oferta academica disponible</h1>
      </div>
      <button class="refresh-btn" type="button" @click="programsStore.fetchPrograms">
        Actualizar
      </button>
    </section>

    <section v-if="programsStore.isLoading" class="state-panel">
      Cargando programas...
    </section>

    <section v-else-if="programsStore.error" class="state-panel error">
      {{ programsStore.error }}
    </section>

    <section v-else-if="programsStore.approvedPrograms.length === 0" class="state-panel">
      No hay programas aprobados publicados todavia.
    </section>

    <section v-else class="cards-grid">
      <article
        v-for="program in programsStore.approvedPrograms"
        :key="program.id"
        class="program-card"
      >
        <div class="card-header">
          <span class="badge">{{ program.modalidad }}</span>
          <strong>{{ formatPrice(program.precio) }}</strong>
        </div>
        <h2>{{ program.nombre }}</h2>
        <p>{{ program.descripcion }}</p>
        <dl>
          <div>
            <dt>Duracion</dt>
            <dd>{{ program.duracion }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{{ program.estado }}</dd>
          </div>
        </dl>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProgramsStore } from '@/stores/programs';

const programsStore = useProgramsStore();

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
};

onMounted(() => {
  programsStore.fetchPrograms();
});
</script>

<style scoped>
.catalog-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 32px;
}

.hero {
  max-width: 1180px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #5164d9;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1 {
  margin: 0;
  color: #1f2937;
  font-size: 2rem;
}

.refresh-btn {
  border: 0;
  border-radius: 8px;
  background: #5164d9;
  color: white;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}

.cards-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.program-card,
.state-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.program-card {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.badge {
  background: #eef2ff;
  color: #3949ab;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

h2 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 1.2rem;
}

p {
  color: #4b5563;
  line-height: 1.5;
}

dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 18px 0 0;
}

dt {
  color: #6b7280;
  font-size: 0.78rem;
}

dd {
  margin: 2px 0 0;
  color: #111827;
  font-weight: 700;
}

.state-panel {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px;
  color: #374151;
}

.state-panel.error {
  color: #b42318;
  border-color: #fecaca;
  background: #fff7f7;
}

@media (max-width: 640px) {
  .catalog-page {
    padding: 20px;
  }

  .hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
