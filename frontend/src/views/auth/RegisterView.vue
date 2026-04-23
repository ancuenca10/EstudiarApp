<template>
  <div class="register-page">
    <div class="container">
      <h1>📝 Crear Cuenta</h1>
      <div class="card">
        <form @submit.prevent="handleRegister" class="form">
          <div class="form-group">
            <label for="name">Nombre Completo</label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Tu nombre completo"
              required
            />
          </div>
          
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
          
          <div class="form-row">
            <div class="form-group">
              <label for="password">Contraseña</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="role">Tipo de Cuenta</label>
            <select id="role" v-model="role" required>
              <option value="" disabled>Selecciona un tipo</option>
              <option value="user">Estudiante</option>
              <option value="editor">Editor / Universidad</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <div class="form-check">
            <input
              id="terms"
              v-model="acceptTerms"
              type="checkbox"
              required
            />
            <label for="terms">
              Acepto los <a href="#" @click.prevent="showTerms">Términos y Condiciones</a>
            </label>
          </div>
          
          <button type="submit" class="btn-register" :disabled="!acceptTerms">
            Crear Cuenta
          </button>
          
          <div class="login-link">
            <p>¿Ya tienes una cuenta? <router-link to="/auth/login">Inicia sesión</router-link></p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref<'user' | 'editor' | 'admin'>('user');
const acceptTerms = ref(false);

const showTerms = () => {
  alert('Términos y condiciones de EstudiarApp\n\n1. Uso responsable\n2. Protección de datos\n3. Conducta apropiada');
};

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Las contraseñas no coinciden');
    return;
  }
  
  if (!acceptTerms.value) {
    alert('Debes aceptar los términos y condiciones');
    return;
  }
  
  try {
    // Aquí iría la llamada real al backend
    alert('Cuenta creada exitosamente (demo)');
    router.push('/auth/login');
  } catch (error) {
    alert('Error al crear la cuenta');
  }
};
</script>

<style scoped>
.register-page {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 25px 0;
}

.form-check input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.form-check label {
  color: #666;
  font-size: 14px;
}

.form-check a {
  color: #667eea;
  text-decoration: none;
}

.form-check a:hover {
  text-decoration: underline;
}

.btn-register {
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
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.btn-register:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-link p {
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .card {
    padding: 20px;
  }
}
</style>