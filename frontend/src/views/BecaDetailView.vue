<template>
  <main class="detail-page">
    <button class="ghost-btn" type="button" @click="router.push('/becas')">Volver a becas</button>

    <section v-if="becasStore.loading" class="panel">Cargando beca...</section>
    <section v-else-if="becasStore.error" class="panel error">{{ becasStore.error }}</section>
    <article v-else-if="beca" class="panel">
      <p class="eyebrow">{{ beca.universidadNombre || 'Beca aprobada' }}</p>
      <h1>{{ beca.nombre }}</h1>
      <p>{{ beca.descripcion }}</p>

      <div class="facts">
        <span v-if="beca.porcentajeCobertura !== null && beca.porcentajeCobertura !== undefined">{{ beca.porcentajeCobertura }}% de cobertura</span>
        <span v-if="beca.monto !== null && beca.monto !== undefined">{{ formatMoney(beca.monto, beca.moneda || undefined) }}</span>
        <span v-if="beca.fechaCierre">Cierre: {{ formatDate(beca.fechaCierre) }}</span>
      </div>

      <h2 v-if="beca.requisitos">Requisitos</h2>
      <p v-if="beca.requisitos">{{ beca.requisitos }}</p>

      <h2 v-if="beca.beneficios">Beneficios</h2>
      <p v-if="beca.beneficios">{{ beca.beneficios }}</p>

      <a v-if="beca.enlace" class="primary-btn link-btn" :href="beca.enlace" target="_blank" rel="noreferrer">Abrir convocatoria</a>
    </article>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBecasStore } from '@/stores/becas';

const route = useRoute();
const router = useRouter();
const becasStore = useBecasStore();
const beca = computed(() => becasStore.selectedBeca);

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CO');
const formatMoney = (value: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(value);

onMounted(() => becasStore.fetchBecaById(String(route.params.id)));
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 0 auto; padding: 32px 20px 56px; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, .06); padding: 24px; margin-top: 16px; }
.eyebrow { color: #2563eb; font-weight: 800; margin: 0 0 6px; }
h1, h2, p { margin-top: 0; }
.facts { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0; }
.facts span { background: #eef2ff; color: #3730a3; border-radius: 999px; padding: 6px 12px; font-weight: 700; }
.primary-btn, .ghost-btn { border: 0; border-radius: 6px; cursor: pointer; font-weight: 800; padding: 10px 14px; }
.primary-btn { background: #2563eb; color: #fff; }
.ghost-btn { background: #e2e8f0; }
.link-btn { display: inline-block; text-decoration: none; }
.error { color: #991b1b; background: #fee2e2; }
</style>
