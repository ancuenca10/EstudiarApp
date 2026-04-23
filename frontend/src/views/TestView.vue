<template>
  <div style="padding: 40px; text-align: center;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">🎓 EstudiarApp</h1>
    <p style="color: #666; margin-bottom: 30px;">Sistema de Gestión Universitaria</p>
    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #27ae60; margin-bottom: 20px;">✅ Frontend Funcionando</h2>
      <p style="margin-bottom: 20px;">El frontend de Vue se está renderizando correctamente.</p>
      <button 
        @click="testBackend" 
        style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;"
      >
        Probar Conexión Backend
      </button>
      <p v-if="backendStatus" style="margin-top: 20px; padding: 10px; border-radius: 4px;" :style="{ background: backendStatus.includes('✅') ? '#d4edda' : '#f8d7da', color: backendStatus.includes('✅') ? '#155724' : '#721c24' }">
        {{ backendStatus }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const backendStatus = ref('')

const testBackend = async () => {
  try {
    backendStatus.value = '🔄 Probando conexión...'
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    backendStatus.value = `✅ Backend conectado: ${data.message}`
  } catch (error) {
    backendStatus.value = '❌ Error conectando al backend'
    console.error('Backend connection error:', error)
  }
}

// Probar automáticamente al cargar
testBackend()
</script>
