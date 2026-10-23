<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="settings-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">SUPERADMIN</p>
          <h1>Configuracion IA</h1>
          <p>Configura la clave de OpenAI usada por el asistente de carga.</p>
        </div>
        <button class="ghost-btn" type="button" @click="router.push('/admin')">Volver</button>
      </header>

      <article class="panel">
        <div class="status-row">
          <div>
            <span class="status-pill" :class="{ active: settings.configured }">
              {{ settings.configured ? 'IA configurada' : 'IA no configurada' }}
            </span>
            <p v-if="settings.maskedApiKey" class="muted">Clave activa: {{ settings.maskedApiKey }}</p>
            <p v-if="settings.usingEnvFallback" class="muted">Usando OPENAI_API_KEY desde variables de entorno.</p>
            <p v-if="settings.storedInDatabase" class="muted">Usando clave guardada en base de datos.</p>
          </div>
        </div>

        <form class="settings-form" @submit.prevent="saveSettings">
          <label>
            OPENAI_API_KEY
            <input
              v-model.trim="form.apiKey"
              autocomplete="off"
              placeholder="sk-..."
              type="password"
            />
            <span class="field-hint">Deja este campo vacio para conservar la clave actual.</span>
          </label>

          <label>
            Modelo
            <input v-model.trim="form.model" placeholder="gpt-4.1-mini" type="text" />
          </label>

          <label class="checkbox-row">
            <input v-model="form.clearApiKey" type="checkbox" />
            <span>Eliminar clave guardada en base de datos</span>
          </label>

          <div class="actions">
            <button class="primary-btn" type="submit" :disabled="loading">
              {{ loading ? 'Guardando...' : 'Guardar configuracion' }}
            </button>
            <button class="ghost-btn" type="button" :disabled="loading" @click="fetchSettings">Recargar</button>
          </div>
        </form>

        <p v-if="error" class="feedback error">{{ error }}</p>
        <p v-if="success" class="feedback success">{{ success }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import api from '@/services/api';

type OpenAiSettings = {
  configured: boolean;
  storedInDatabase: boolean;
  usingEnvFallback: boolean;
  maskedApiKey: string | null;
  model: string;
};

const router = useRouter();
const loading = ref(false);
const error = ref('');
const success = ref('');
const settings = reactive<OpenAiSettings>({
  configured: false,
  storedInDatabase: false,
  usingEnvFallback: false,
  maskedApiKey: null,
  model: 'gpt-4.1-mini',
});
const form = reactive({
  apiKey: '',
  model: 'gpt-4.1-mini',
  clearApiKey: false,
});

const applySettings = (payload: Partial<OpenAiSettings>) => {
  settings.configured = Boolean(payload.configured);
  settings.storedInDatabase = Boolean(payload.storedInDatabase);
  settings.usingEnvFallback = Boolean(payload.usingEnvFallback);
  settings.maskedApiKey = payload.maskedApiKey || null;
  settings.model = payload.model || 'gpt-4.1-mini';
  form.model = settings.model;
  form.apiKey = '';
  form.clearApiKey = false;
};

const fetchSettings = async () => {
  try {
    loading.value = true;
    error.value = '';
    success.value = '';
    const response = await api.get('/system-settings/openai');
    applySettings(response.data?.data || {});
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la configuracion IA';
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  try {
    loading.value = true;
    error.value = '';
    success.value = '';
    const response = await api.put('/system-settings/openai', {
      apiKey: form.clearApiKey ? '' : form.apiKey,
      model: form.model,
      clearApiKey: form.clearApiKey,
    });
    applySettings(response.data?.data || {});
    success.value = 'Configuracion IA actualizada.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la configuracion IA';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSettings);
</script>

<style scoped>
.settings-page {
  margin: 0 auto;
  max-width: 920px;
  padding: 32px 20px 56px;
}

.page-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  color: var(--ea-primary);
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
p {
  margin-top: 0;
}

.panel {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  padding: 24px;
}

.status-row {
  border-bottom: 1px solid var(--ea-border);
  margin-bottom: 20px;
  padding-bottom: 16px;
}

.status-pill {
  background: #fee2e2;
  border-radius: 999px;
  color: #991b1b;
  display: inline-flex;
  font-weight: 800;
  padding: 7px 12px;
}

.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.muted,
.field-hint {
  color: var(--ea-muted);
}

.settings-form {
  display: grid;
  gap: 18px;
}

label {
  display: grid;
  font-weight: 800;
  gap: 7px;
}

input {
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  font: inherit;
  padding: 11px 12px;
}

.checkbox-row {
  align-items: center;
  display: flex;
  gap: 8px;
}

.checkbox-row input {
  width: auto;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-btn,
.ghost-btn {
  border-radius: var(--ea-radius-sm);
  cursor: pointer;
  font-weight: 800;
  padding: 10px 14px;
}

.primary-btn {
  background: var(--ea-primary);
  border: 0;
  color: #fff;
}

.ghost-btn {
  background: #fff;
  border: 1px solid var(--ea-border);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.feedback {
  border-radius: 8px;
  margin: 16px 0 0;
  padding: 12px 14px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
