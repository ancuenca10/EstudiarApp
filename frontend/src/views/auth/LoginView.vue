<template>
  <div class="login-page">
    <div class="container">
      <h1>🔐 Iniciar Sesión</h1>
      <div class="card">
        <form @submit.prevent="handleLogin" class="form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="usuario@ejemplo.com"
              required
            />
            <small class="hint">Usa las credenciales registradas en el backend</small>
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
            />
            <small class="hint">La contrasena debe coincidir con tu cuenta</small>
          </div>
          
          <div class="form-options">
            <label class="checkbox">
              <input type="checkbox" v-model="form.rememberMe" />
              <span>Recordarme</span>
            </label>
            <router-link to="/auth/forgot-password" class="forgot-link">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>
          
          <button type="submit" class="btn-login" :disabled="isLoading">
            <span v-if="isLoading">⏳ Iniciando sesión...</span>
            <span v-else>🚀 Iniciar Sesión</span>
          </button>
          
          <!-- Mensaje de error -->
          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>
          
          <div class="divider">
            <span>o</span>
          </div>
          
          <div class="register-link">
            <p>¿No tienes una cuenta?</p>
            <router-link to="/auth/register" class="btn-register">
              📝 Crear una cuenta
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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
    // Resetear error
    error.value = '';
    isLoading.value = true;
    
    // Validación básica
    if (!form.email.trim()) {
      error.value = 'Por favor ingresa tu email';
      return;
    }
    
    if (!form.password.trim()) {
      error.value = 'Por favor ingresa tu contraseña';
      return;
    }
    
    // Llamar al store
    const result = await authStore.login({
      email: form.email.trim(),
      password: form.password.trim(),
      rememberMe: form.rememberMe
    });
    
    if (result.success) {
      // Redirigir según rol o a la página anterior
      const redirect = route.query.redirect as string;
      
      if (redirect) {
        router.push(redirect);
      } else if (authStore.isAdmin) {
        router.push('/admin');
      } else if (authStore.isEditor) {
        router.push('/editor/dashboard');
      } else {
        router.push('/');
      }
    } else {
      error.value = result.error || 'Error en el inicio de sesión';
    }
  } catch (err: any) {
    error.value = err.message || 'Error en el inicio de sesión';
    console.error('Error en handleLogin:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 450px;
}

.container h1 {
  color: white;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

.card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  display: block;
  margin-top: 5px;
  color: #888;
  font-size: 12px;
  font-style: italic;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  margin-bottom: 15px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #dc3545;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #fcc;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #999;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  padding: 0 15px;
  font-size: 14px;
}

.demo-credentials {
  margin: 25px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #667eea;
}

.demo-credentials h4 {
  color: #667eea;
  margin-bottom: 15px;
  text-align: center;
  font-size: 16px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.demo-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.demo-item strong {
  color: #333;
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
}

.demo-item p {
  color: #666;
  margin: 2px 0;
  font-size: 11px;
  line-height: 1.3;
}

.register-link {
  text-align: center;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 1px solid #eee;
}

.register-link p {
  color: #666;
  margin-bottom: 15px;
}

.btn-register {
  display: inline-block;
  padding: 12px 30px;
  background: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: transform 0.3s;
}

.btn-register:hover {
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .container {
    padding: 0 10px;
  }
  
  .card {
    padding: 20px;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
