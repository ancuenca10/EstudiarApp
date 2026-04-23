<template>
  <div class="verify-email-page">
    <div class="container">
      <div v-if="verifying" class="verifying">
        <div class="spinner">⏳</div>
        <h1>Verificando tu email...</h1>
        <p>Por favor espera un momento.</p>
      </div>
      
      <div v-else-if="verified" class="success">
        <div class="success-icon">✅</div>
        <h1>¡Email Verificado!</h1>
        <p>Tu dirección de email ha sido verificada exitosamente.</p>
        <div class="actions">
          <router-link to="/" class="btn-home">🏠 Ir al Inicio</router-link>
          <router-link v-if="!isAuthenticated" to="/auth/login" class="btn-login">
            🔐 Iniciar Sesión
          </router-link>
        </div>
      </div>
      
      <div v-else class="error">
        <div class="error-icon">❌</div>
        <h1>Error de Verificación</h1>
        <p>El enlace de verificación es inválido o ha expirado.</p>
        <div class="actions">
          <router-link to="/" class="btn-home">🏠 Ir al Inicio</router-link>
          <button @click="resendVerification" class="btn-resend">
            📧 Reenviar Email de Verificación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const verifying = ref(true);
const verified = ref(false);
const error = ref('');

const isAuthenticated = ref(false);

const verifyToken = async () => {
  try {
    const token = route.params.token as string;
    
    // Simular verificación
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock: Siempre éxito para demo
    verified.value = true;
    
    // Si el usuario está autenticado, actualizar estado
    if (authStore.isAuthenticated && authStore.user) {
      // En una app real, actualizarías el usuario en el store
      isAuthenticated.value = true;
    }
    
  } catch (err) {
    error.value = 'Error al verificar el email';
    console.error('Verification error:', err);
  } finally {
    verifying.value = false;
  }
};

const resendVerification = () => {
  alert('Email de verificación reenviado (demo)');
  router.push('/auth/login');
};

onMounted(() => {
  verifyToken();
});
</script>

<style scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.verifying .spinner {
  font-size: 60px;
  margin-bottom: 20px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success .success-icon,
.error .error-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success .success-icon {
  color: #28a745;
}

.error .error-icon {
  color: #dc3545;
}

.container h1 {
  color: #333;
  margin-bottom: 15px;
}

.container p {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.btn-home,
.btn-login,
.btn-resend {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s;
  text-decoration: none;
  display: block;
}

.btn-home {
  background: #667eea;
  color: white;
}

.btn-login {
  background: #28a745;
  color: white;
}

.btn-resend {
  background: #fd7e14;
  color: white;
}

.btn-home:hover,
.btn-login:hover,
.btn-resend:hover {
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .container {
    padding: 30px 20px;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>