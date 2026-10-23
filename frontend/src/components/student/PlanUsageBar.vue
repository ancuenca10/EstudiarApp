<template>
  <section class="usage-bar" :class="status">
    <div class="usage-head">
      <span>{{ label }}</span>
      <strong>{{ displayValue }}</strong>
    </div>
    <div class="track" :aria-label="`${label}: ${displayValue}`">
      <span :style="{ width: `${percent}%` }"></span>
    </div>
    <p v-if="hint">{{ hint }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  used: number;
  limit: number | null;
  hint?: string;
}>();

const percent = computed(() => {
  if (props.limit === null) return 18;
  if (props.limit <= 0) return 100;
  return Math.min(100, Math.round((props.used / props.limit) * 100));
});

const status = computed(() => {
  if (props.limit === null) return 'open';
  if (props.used >= props.limit) return 'danger';
  if (percent.value >= 75) return 'warning';
  return 'healthy';
});

const displayValue = computed(() =>
  props.limit === null ? `${props.used} / Ilimitado` : `${props.used} / ${props.limit}`
);
</script>

<style scoped>
.usage-bar {
  display: grid;
  gap: 8px;
}

.usage-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.usage-head span {
  color: #334155;
  font-weight: 900;
}

.usage-head strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.track {
  background: #e2e8f0;
  border-radius: 999px;
  height: 11px;
  overflow: hidden;
}

.track span {
  background: #16a34a;
  display: block;
  height: 100%;
  transition: width 0.25s ease;
}

.warning .track span {
  background: #f59e0b;
}

.danger .track span {
  background: #dc2626;
}

.open .track span {
  background: linear-gradient(90deg, #d97706, #facc15);
}

p {
  color: #64748b;
  font-size: 0.84rem;
  margin: 0;
}
</style>
