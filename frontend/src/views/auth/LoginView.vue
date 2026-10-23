<template>
  <main class="login-page">
    <header class="auth-top">
      <button class="brand" type="button" @click="router.push('/')">
        <span class="brand-mark">EA</span>
        <span>
          <strong>EstudiarApp</strong>
          <small>Educacion superior en el Huila</small>
        </span>
      </button>

      <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/')">
        Volver al inicio
      </button>
    </header>

    <section class="login-shell">
      <div class="login-copy">
        <p class="ea-kicker">Acceso seguro</p>
        <h1>Inicia sesion en EstudiarApp</h1>
        <p>
          Entra para guardar favoritos, comparar opciones y gestionar el panel segun tu rol.
        </p>
      </div>

      <form class="login-card ea-card" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Correo electronico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="usuario@ejemplo.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contrasena</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Ingresa tu contrasena"
            required
          />
        </div>

        <div class="form-options">
          <label class="checkbox">
            <input v-model="form.rememberMe" type="checkbox" />
            <span>Recordarme</span>
          </label>
        </div>

        <button class="ea-btn ea-btn-primary submit-btn" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Iniciando sesion...' : 'Iniciar sesion' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="register-link">
          <span>No tienes una cuenta?</span>
          <button class="ea-btn ea-btn-secondary" type="button" @click="router.push('/register')">
            Crear cuenta
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { LoginCredentials } from '@/types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive<LoginCredentials>({
  email: '',
  password: '',
  rememberMe: false,
});

const isLoading = ref(false);
const error = ref('');

const handleLogin = async () => {
  try {
    error.value = '';
    isLoading.value = true;

    if (!form.email.trim()) {
      error.value = 'Por favor ingresa tu email';
      return;
    }

    if (!form.password.trim()) {
      error.value = 'Por favor ingresa tu contrasena';
      return;
    }

    const result = await authStore.login({
      email: form.email.trim(),
      password: form.password.trim(),
      rememberMe: form.rememberMe,
    });

    if (result.success) {
      const redirect = route.query.redirect as string | undefined;

      if (redirect) {
        router.push(redirect);
      } else if (authStore.user?.role?.toUpperCase() === 'UNIVERSITY') {
        router.push('/universidad');
      } else if (authStore.isStudent) {
        router.push('/student');
      } else if (authStore.canAccessAdminPanel) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      error.value = result.error || 'Error en el inicio de sesion';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error en el inicio de sesion';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  display: block !important;
  min-height: 100vh;
  padding: 0 !important;
  background:
    linear-gradient(90deg, #f6f8fb 0%, #f6f8fb 54%, #ffffff 54%, #ffffff 100%) !important;
  color: var(--ea-text);
}

.auth-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  min-height: 76px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: var(--ea-radius-lg);
  background: var(--ea-text);
  color: #fff;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 1.05rem;
}

.brand small {
  color: var(--ea-muted);
  font-size: 0.78rem;
}

.login-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 440px);
  gap: 56px;
  align-items: center;
  min-height: calc(100vh - 76px);
  padding: 36px 0 64px;
}

.login-copy h1 {
  max-width: 720px;
  margin: 0;
  color: var(--ea-text);
  font-size: clamp(2.25rem, 5vw, 4.25rem);
  line-height: 1.02;
}

.login-copy p:not(.ea-kicker) {
  max-width: 580px;
  margin: 18px 0 0;
  color: var(--ea-muted);
  font-size: 1.08rem;
}

.login-copy {
  border-left: 4px solid var(--ea-primary);
  padding-left: 24px;
}

.login-card {
  display: grid;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  background: #fff;
  box-shadow: var(--ea-shadow-md);
}

.form-group {
  display: grid;
  gap: 8px;
}

label {
  color: var(--ea-text);
  font-weight: 800;
}

input {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  outline: 0;
  padding: 0 14px;
}

input:focus {
  border-color: var(--ea-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-options,
.register-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ea-muted);
}

.checkbox input {
  width: auto;
  min-height: auto;
}

.submit-btn {
  width: 100%;
}

.error-message {
  border: 1px solid #fecaca;
  border-radius: var(--ea-radius-sm);
  background: #fff1f2;
  color: #991b1b;
  padding: 12px 14px;
}

.register-link {
  border-top: 1px solid var(--ea-border);
  color: var(--ea-muted);
  padding-top: 18px;
}

@media (max-width: 820px) {
  .login-page {
    background: var(--ea-background) !important;
  }

  .auth-top {
    align-items: stretch;
    flex-direction: column;
    padding: 16px 0;
  }

  .login-shell {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 24px;
  }
}
</style>
