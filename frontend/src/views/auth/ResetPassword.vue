<template>
  <div class="reset-password-page">
    <div class="container">
      <h1>🔄 Restablecer Contraseña</h1>
      <div class="card">
        <div v-if="!passwordReset" class="reset-form">
          <p>Ingresa tu nueva contraseña para restablecer tu acceso.</p>
          
          <form @submit.prevent="handleReset" class="form">
            <div class="form-group">
              <label for="newPassword">Nueva Contraseña</label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <small class="hint">Mínimo 6 caracteres</small>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button type="submit" class="btn-reset" :disabled="loading">
              <span v-if="loading">⏳ Procesando...</span>
              <span v-else>🔄 Restablecer Contraseña</span>
            </button>
          </form>
        </div>
        
        <div v-else class="success-message">
          <div class="success-icon">✅</div>
          <h3>¡Contraseña restablecida!</h3>
          <p>Tu contraseña ha sido cambiada exitosamente.</p>
          <router-link to="/auth/login" class="btn-login">
            🔐 Ir al Login
          </router-link>
        </div>
        
        <div class="links">
          <router-link to="/auth/login">← Volver al Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const passwordReset = ref(false);

// Obtener el token de la ruta
const resetToken = computed(() => route.params.token as string);

const handleReset = async () => {
  // Validar que las contraseñas coincidan
  if (newPassword.value !== confirmPassword.value) {
    alert('Las contraseñas no coinciden');
    return;
  }
  
  // Validar longitud mínima
  if (newPassword.value.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  try {
    loading.value = true;
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Token recibido:', resetToken.value);
    console.log('Nueva contraseña:', newPassword.value);
    
    // Marcar como restablecida
    passwordReset.value = true;
    
    // Opcional: Mostrar mensaje de éxito
    alert('Contraseña restablecida exitosamente');
    
  } catch (error) {
    alert('Error al restablecer la contraseña. Intenta nuevamente.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 400px;
}

.container h1 {
  color: white;
  text-align: center;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card p {
  color: #666;
  text-align: center;
  margin-bottom: 25px;
  line-height: 1.5;
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
}

.btn-reset {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  margin-top: 10px;
}

.btn-reset:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-message h3 {
  color: #28a745;
  margin-bottom: 15px;
}

.success-message p {
  color: #666;
  margin-bottom: 25px;
}

.btn-login {
  display: inline-block;
  padding: 12px 30px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: transform 0.3s;
}

.btn-login:hover {
  transform: translateY(-2px);
}

.links {
  margin-top: 25px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.links a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.links a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .card {
    padding: 20px;
  }
  
  .container h1 {
    font-size: 24px;
  }
}
</style>