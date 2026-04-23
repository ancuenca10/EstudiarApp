<!-- src/components/shared/AddToComparison.vue -->
<template>
  <button 
    @click="toggleComparison"
    :class="[
      'comparison-btn',
      isInComparison ? 'active' : '',
      disabled ? 'disabled' : ''
    ]"
    :disabled="disabled"
    :title="buttonTitle"
  >
    <span class="btn-icon">
      {{ isInComparison ? '−' : '+' }}
    </span>
    <span class="btn-text">
      {{ buttonText }}
    </span>
    <span v-if="showCounter && comparisonCount > 0" class="counter-badge">
      {{ comparisonCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useComparisonStore } from '@/stores/comparison';

interface Props {
  programId: string;
  programName: string;
  universityId: string;
  universityName: string;
  disabled?: boolean;
  showCounter?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showCounter: true,
  size: 'medium',
});

const comparisonStore = useComparisonStore();

const isInComparison = computed(() => 
  comparisonStore.isInComparison(props.programId, props.universityId)
);

const comparisonCount = computed(() => comparisonStore.getItemCount);

const buttonText = computed(() => 
  isInComparison.value ? 'En comparación' : 'Comparar'
);

const buttonTitle = computed(() => {
  if (props.disabled) return 'Máximo de programas alcanzado';
  if (isInComparison.value) return 'Quitar de la comparación';
  return 'Añadir para comparar';
});

const toggleComparison = () => {
  if (props.disabled && !isInComparison.value) return;
  
  try {
    if (isInComparison.value) {
      comparisonStore.removeFromComparison(props.programId, props.universityId);
    } else {
      comparisonStore.addToComparison(
        props.programId,
        props.universityId,
        props.programName,
        props.universityName
      );
    }
  } catch (error: any) {
    alert(error.message);
  }
};
</script>

<style scoped>
.comparison-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.comparison-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.comparison-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.comparison-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.comparison-btn.small {
  padding: 4px 12px;
  font-size: 12px;
}

.comparison-btn.large {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-icon {
  font-weight: bold;
  font-size: 16px;
}

.counter-badge {
  background: white;
  color: #764ba2;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-left: 4px;
}
</style>