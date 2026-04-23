<template>
  <div class="forgot-password-page">
    <div class="container">
      <h1>🔑 Recuperar Contraseña</h1>
      <div class="card">
        <p>Ingresa tu email para recibir instrucciones para recuperar tu contraseña.</p>
        
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? '⏳ Enviando...' : 'Enviar Instrucciones' }}
          </button>
          
          <div v-if="message" class="success-message">
            ✅ {{ message }}
          </div>
        </form>
        
        <div class="links">
          <router-link to="/auth/login">← Volver al Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const isLoading = ref(false);
const message = ref('');

const handleSubmit = () => {
  if (!email.value.trim()) {
    alert('Por favor ingresa tu email');
    return;
  }
  
  isLoading.value = true;
  message.value = '';
  
  // Simular envío
  setTimeout(() => {
    isLoading.value = false;
    message.value = `Se han enviado instrucciones a: ${email.value}`;
    email.value = '';
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  }, 1500);
};
</script>

<style scoped>
.forgot-password-page {
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

.btn-primary {
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
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #c3e6cb;
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