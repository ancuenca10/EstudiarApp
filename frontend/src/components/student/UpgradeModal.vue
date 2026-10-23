<template>
  <div v-if="modelValue" class="upgrade-modal" role="dialog" aria-modal="true">
    <article class="upgrade-card">
      <span>Mejora tu plan</span>
      <h2>{{ modelValue.message }}</h2>
      <p>{{ supportText }}</p>
      <div class="modal-actions">
        <RouterLink class="upgrade-link" to="/student/plans" @click="$emit('close')">
          Mejorar a {{ modelValue.recommendedPlan.toUpperCase() }}
        </RouterLink>
        <button type="button" @click="$emit('close')">Despues</button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { UpsellMessage } from '@/stores/student';

const props = defineProps<{
  modelValue: UpsellMessage | null;
}>();

defineEmits<{
  close: [];
}>();

const supportText = computed(() =>
  props.modelValue?.recommendedPlan === 'plus'
    ? 'Usuarios como tu mejoran sus opciones con PLUS, insights avanzados y recomendaciones priorizadas.'
    : 'Desbloquea mas favoritos, comparaciones, alertas y contacto asesor con BASIC.'
);
</script>

<style scoped>
.upgrade-modal {
  align-items: center;
  background: rgba(15, 23, 42, 0.46);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 20px;
  position: fixed;
  z-index: 90;
}

.upgrade-card {
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
  max-width: 480px;
  padding: 24px;
  width: 100%;
}

span {
  color: #b45309;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  color: #0f172a;
  margin: 8px 0;
}

p {
  color: #475569;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.upgrade-link,
button {
  border-radius: 8px;
  font-weight: 900;
  padding: 11px 14px;
}

.upgrade-link {
  animation: modalPulse 2.6s ease-in-out infinite;
  background: #0f766e;
  color: #fff;
  text-decoration: none;
}

button {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  cursor: pointer;
}

@keyframes modalPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
</style>
