<template>
  <article class="stats-card">
    <span class="icon">{{ icon }}</span>
    <div>
      <p>{{ label }}</p>
      <strong>{{ value }}</strong>
      <small v-if="hint">{{ hint }}</small>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
}>();
</script>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 128px;
  padding: 18px;
  background: var(--ea-surface);
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
}

.icon {
  display: grid;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: var(--ea-radius-sm);
  background: #e0f2fe;
  color: #075985;
  font-weight: 900;
}

p,
small {
  color: var(--ea-muted);
}

p {
  margin: 0 0 4px;
  font-weight: 800;
}

strong {
  display: block;
  color: var(--ea-text);
  font-size: 2rem;
  line-height: 1;
}

small {
  display: block;
  margin-top: 8px;
}
</style>
