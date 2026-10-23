<template>
  <article class="scholarship-card">
    <span class="ea-badge">{{ beca.universidadNombre || 'Beca abierta' }}</span>
    <h3>{{ beca.nombre }}</h3>
    <p>{{ beca.descripcion }}</p>

    <div class="scholarship-meta">
      <span>
        <small>Cobertura</small>
        <strong>{{ coverage }}</strong>
      </span>
      <span>
        <small>Cierre</small>
        <strong>{{ closeDate }}</strong>
      </span>
    </div>

    <button class="ea-btn ea-btn-primary" type="button" @click="$emit('view', beca)">
      Ver beca
    </button>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Beca } from '@/stores/becas';

const props = defineProps<{ beca: Beca }>();
defineEmits<{ view: [beca: Beca] }>();

const coverage = computed(() => {
  if (props.beca.porcentajeCobertura !== null && props.beca.porcentajeCobertura !== undefined) {
    return `${props.beca.porcentajeCobertura}%`;
  }

  if (props.beca.monto) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: props.beca.moneda || 'COP',
      maximumFractionDigits: 0,
    }).format(props.beca.monto);
  }

  return 'Consultar';
});

const closeDate = computed(() => {
  if (!props.beca.fechaCierre) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(props.beca.fechaCierre));
});
</script>

<style scoped>
.scholarship-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  background: var(--ea-surface);
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.scholarship-card:hover {
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

h3 {
  margin: 0;
  color: var(--ea-text);
}

p {
  display: -webkit-box;
  min-height: 48px;
  margin: 0;
  overflow: hidden;
  color: var(--ea-muted);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.scholarship-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.scholarship-meta span {
  border-radius: var(--ea-radius-md);
  background: var(--ea-surface-muted);
  padding: 12px;
}

small {
  display: block;
  color: var(--ea-muted);
  font-weight: 800;
}
</style>
