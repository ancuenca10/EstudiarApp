<template>
  <div class="users-container">
    <div class="users-card">
      <h1>👥 Gestión de Usuarios</h1>
      <p>Esta funcionalidad está en desarrollo</p>
      <button @click="$router.push('/admin')" class="btn-back">
        ← Volver al dashboard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.users-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  padding: 2rem;
}

.users-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.users-card h1 {
  color: #333;
  margin-bottom: 1rem;
}

.users-card p {
  color: #666;
  margin-bottom: 2rem;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.3s;
}

.btn-back:hover {
  transform: translateY(-2px);
}
</style>