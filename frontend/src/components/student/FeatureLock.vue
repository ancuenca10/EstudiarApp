<template>
  <span class="feature-lock" :title="locked ? tooltip : undefined" @click.capture="handleClick">
    <slot :locked="locked" :label="label">
      <button type="button" :disabled="locked">
        <span v-if="locked" aria-hidden="true">🔒</span>
        {{ label }}
      </button>
    </slot>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  locked: boolean;
  label: string;
  tooltip: string;
}>();

const emit = defineEmits<{
  lockedClick: [];
}>();

const handleClick = () => {
  if (props.locked) emit('lockedClick');
};
</script>

<style scoped>
.feature-lock {
  display: inline-flex;
}

:deep(button:disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}
</style>
