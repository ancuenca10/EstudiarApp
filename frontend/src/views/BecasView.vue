<template>
  <main class="ea-page">
    <AppNavbar />

    <header class="ea-container hero">
      <div>
        <p class="eyebrow">Becas</p>
        <h1>Encuentra apoyos para estudiar</h1>
        <p>Consulta becas aprobadas por universidades y el equipo de EstudiarApp.</p>
      </div>
      <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/')">Ir al inicio</button>
    </header>

    <section class="ea-container toolbar">
      <input v-model.trim="search" type="search" placeholder="Buscar por nombre o descripcion" @keyup.enter="loadBecas" />
      <label class="check">
        <input v-model="vigente" type="checkbox" @change="loadBecas" />
        Solo vigentes
      </label>
      <button class="ea-btn ea-btn-primary" type="button" @click="loadBecas">Buscar</button>
    </section>

    <p v-if="becasStore.error" class="ea-container feedback error">{{ becasStore.error }}</p>

    <section class="ea-container grid">
      <article v-if="becasStore.loading && becasStore.becasPublicas.length === 0" class="state">Cargando becas...</article>
      <article v-else-if="becasStore.becasPublicas.length === 0" class="state">Aun no hay becas disponibles.</article>
      <article v-for="beca in becasStore.becasPublicas" v-else :key="beca.id" class="beca-card">
        <div class="card-top">
          <span class="badge">Aprobada</span>
          <small v-if="beca.fechaCierre">Cierra: {{ formatDate(beca.fechaCierre) }}</small>
        </div>
        <h2>{{ beca.nombre }}</h2>
        <p class="university">{{ beca.universidadNombre || 'Institucion no especificada' }}</p>
        <p>{{ truncate(beca.descripcion, 180) }}</p>
        <div class="facts">
          <span v-if="beca.porcentajeCobertura !== null && beca.porcentajeCobertura !== undefined">
            {{ beca.porcentajeCobertura }}% cobertura
          </span>
          <span v-if="beca.monto !== null && beca.monto !== undefined">{{ formatMoney(beca.monto, beca.moneda || undefined) }}</span>
        </div>
        <button class="ea-btn ea-btn-primary" type="button" @click="router.push(`/becas/${beca.id}`)">Ver detalles</button>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { useBecasStore } from '@/stores/becas';

const router = useRouter();
const becasStore = useBecasStore();
const search = ref('');
const vigente = ref(false);

const loadBecas = () => becasStore.fetchPublicBecas({ search: search.value || undefined, vigente: vigente.value || undefined });
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length)}...` : value;
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO');
const formatMoney = (value: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(value);

onMounted(loadBecas);
</script>

<style scoped>
.hero, .toolbar, .beca-card, .state { background: #fff; border: 1px solid var(--ea-border); border-radius: var(--ea-radius-lg); box-shadow: var(--ea-shadow-sm); }
.hero { display: flex; justify-content: space-between; gap: 16px; padding: 24px; margin-top: 32px; margin-bottom: 18px; }
.eyebrow { color: #2563eb; font-weight: 800; margin: 0 0 6px; }
h1, h2, p { margin-top: 0; }
.toolbar { display: flex; gap: 12px; align-items: center; padding: 16px; margin-bottom: 18px; }
input[type="search"] { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; }
.check { display: flex; align-items: center; gap: 8px; color: #475569; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.beca-card, .state { padding: 20px; }
.card-top, .facts { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; }
.badge, .facts span { background: #dcfce7; color: #166534; border-radius: 999px; padding: 4px 10px; font-weight: 700; font-size: .82rem; }
.facts span { background: #eef2ff; color: #3730a3; }
.university { color: #64748b; font-weight: 700; }
.feedback.error { background: #fee2e2; color: #991b1b; border-radius: 8px; padding: 14px; }
@media (max-width: 720px) { .hero, .toolbar { flex-direction: column; align-items: stretch; } }
</style>
