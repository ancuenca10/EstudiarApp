<template>
  <div class="forbidden-page">
    <div class="error-container">
      <div class="error-icon">🚫</div>
      <h1>403 - Acceso Denegado</h1>
      <p class="error-message">
        Lo sentimos, no tienes permisos para acceder a esta página.
      </p>
      <p class="error-details">
        Si crees que esto es un error, por favor contacta al administrador del sistema.
      </p>
      <div class="actions">
        <button @click="goBack" class="btn-back">
          ← Volver atrás
        </button>
        <button @click="goHome" class="btn-home">
          🏠 Ir al Inicio
        </button>
        <button @click="goToLogin" class="btn-login" v-if="!isAuthenticated">
          🔐 Iniciar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const goHome = () => {
  router.push('/');
};

const goToLogin = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  padding: 20px;
}

.error-container {
  background: white;
  border-radius: 20px;
  padding: 50px 40px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.error-container h1 {
  color: #c92a2a;
  margin: 0 0 20px 0;
  font-size: 36px;
}

.error-message {
  color: #333;
  font-size: 18px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.error-details {
  color: #666;
  margin-bottom: 40px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-back,
.btn-home,
.btn-login {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  min-width: 150px;
}

.btn-back {
  background: #6c757d;
  color: white;
}

.btn-home {
  background: #667eea;
  color: white;
}

.btn-login {
  background: #28a745;
  color: white;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.3);
}

.btn-home:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
}

@media (max-width: 600px) {
  .error-container {
    padding: 30px 20px;
  }
  
  .error-icon {
    font-size: 60px;
  }
  
  .error-container h1 {
    font-size: 28px;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-back,
  .btn-home,
  .btn-login {
    width: 100%;
  }
}
</style>