<template>
  <div class="not-found">
    <div class="container">
      <div class="not-found-content">
        <div class="emoji">😕</div>
        <div class="error-code">404</div>
        <h1>¡Ups! Página No Encontrada</h1>
        <p class="message">
          La página que estás buscando no existe o ha sido movida.
        </p>
        
        <div class="suggestions">
          <p><strong>Puedes intentar:</strong></p>
          <ul>
            <li>Verificar la URL escrita</li>
            <li>Usar la barra de búsqueda</li>
            <li>Navegar desde el inicio</li>
          </ul>
        </div>
        
        <div class="actions">
          <!-- Botón principal - Inicio -->
          <button @click="goToHome" class="btn-home">
            <span class="icon">🏠</span>
            <span>Ir al Inicio</span>
          </button>
          
          <!-- Botones secundarios -->
          <div class="secondary-actions">
            <button @click="goToDashboard" class="btn-secondary">
              <span class="icon">📊</span>
              <span>Dashboard</span>
            </button>
            
            <button @click="goToFavorites" class="btn-secondary">
              <span class="icon">⭐</span>
              <span>Favoritos</span>
            </button>
            
            <button @click="goBack" class="btn-secondary">
              <span class="icon">↩️</span>
              <span>Volver</span>
            </button>
          </div>
        </div>
        
        <div class="search-box" v-if="showSearch">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Buscar universidades, programas..."
            @keyup.enter="performSearch"
            class="search-input"
          >
          <button @click="performSearch" class="search-btn">
            🔍
          </button>
        </div>
        
        <button @click="toggleSearch" class="toggle-search-btn">
          {{ showSearch ? 'Ocultar búsqueda' : '🔍 Buscar algo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const showSearch = ref(false)

const goToHome = () => {
  router.push('/')
}

const goToDashboard = () => {
  router.push('/admin')
}

const goToFavorites = () => {
  router.push('/favorites')
}

const goBack = () => {
  router.back()
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    // Redirigir a home con parámetro de búsqueda
    router.push({ path: '/', query: { search: searchQuery.value } })
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
}

.not-found-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 24px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  line-height: 1;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.not-found-content h1 {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: white;
}

.message {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.suggestions {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.suggestions ul {
  list-style: none;
  padding-left: 0;
  margin: 1rem 0 0 0;
}

.suggestions li {
  padding: 0.5rem 0;
  position: relative;
  padding-left: 1.5rem;
}

.suggestions li:before {
  content: "•";
  color: #ffd700;
  position: absolute;
  left: 0;
  font-size: 1.5rem;
}

/* Botones principales */
.actions {
  margin-top: 2rem;
}

.btn-home {
  background: #ffd700;
  color: #333;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  transition: all 0.3s;
  min-width: 200px;
}

.btn-home:hover {
  background: #ffed4a;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.secondary-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  flex: 1;
  min-width: 140px;
  justify-content: center;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.icon {
  font-size: 1.2rem;
}

/* Búsqueda */
.search-box {
  margin-top: 2rem;
  display: flex;
  gap: 10px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #ffd700;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-btn {
  padding: 12px 20px;
  background: #ffd700;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.search-btn:hover {
  background: #ffed4a;
  transform: scale(1.05);
}

.toggle-search-btn {
  margin-top: 1rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.toggle-search-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .not-found-content {
    padding: 2rem 1.5rem;
  }
  
  .error-code {
    font-size: 5rem;
  }
  
  .not-found-content h1 {
    font-size: 1.8rem;
  }
  
  .secondary-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-secondary {
    width: 100%;
  }
  
  .search-box {
    flex-direction: column;
  }
}
</style>