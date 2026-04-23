<template>
  <div class="settings-page">
    <div class="container">
      <h1>⚙️ Configuración</h1>
      
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="settings-content">
        <!-- Cuenta -->
        <div v-if="activeTab === 'account'" class="tab-content">
          <div class="section">
            <h3>📋 Información de la Cuenta</h3>
            <div class="form-group">
              <label>Email</label>
              <input type="email" :value="user?.email" disabled />
              <small class="hint">El email no se puede cambiar</small>
            </div>
          </div>
        </div>
        
        <!-- Notificaciones -->
        <div v-if="activeTab === 'notifications'" class="tab-content">
          <div class="section">
            <h3>🔔 Preferencias de Notificaciones</h3>
            
            <div class="toggle-group">
              <div class="toggle-item">
                <div class="toggle-info">
                  <h4>Notificaciones por Email</h4>
                  <p>Recibe actualizaciones por correo electrónico</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="notifications.email" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="toggle-item">
                <div class="toggle-info">
                  <h4>Notificaciones de Nuevos Programas</h4>
                  <p>Recibe notificaciones cuando se agreguen nuevos programas</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="notifications.newPrograms" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="toggle-item">
                <div class="toggle-info">
                  <h4>Recordatorios de Favoritos</h4>
                  <p>Recibe recordatorios sobre tus programas favoritos</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="notifications.favorites" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <button @click="saveNotifications" class="btn-save">
              💾 Guardar Preferencias
            </button>
          </div>
        </div>
        
        <!-- Privacidad -->
        <div v-if="activeTab === 'privacy'" class="tab-content">
          <div class="section">
            <h3>🔒 Configuración de Privacidad</h3>
            
            <div class="privacy-options">
              <div class="privacy-item">
                <div class="privacy-info">
                  <h4>Perfil Público</h4>
                  <p>Permitir que otros usuarios vean tu perfil</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="privacy.publicProfile" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="privacy-item">
                <div class="privacy-info">
                  <h4>Mostrar Favoritos</h4>
                  <p>Mostrar tus programas favoritos públicamente</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="privacy.showFavorites" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="privacy-item">
                <div class="privacy-info">
                  <h4>Mostrar Reseñas</h4>
                  <p>Mostrar tus reseñas públicamente</p>
                </div>
                <label class="toggle">
                  <input type="checkbox" v-model="privacy.showReviews" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="danger-zone">
              <h4>🚨 Zona de Peligro</h4>
              <p>Estas acciones son irreversibles</p>
              <button @click="deleteAccount" class="btn-danger">
                🗑️ Eliminar Mi Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const user = authStore.user;
const activeTab = ref('account');

const tabs = [
  { id: 'account', label: '📋 Cuenta' },
  { id: 'notifications', label: '🔔 Notificaciones' },
  { id: 'privacy', label: '🔒 Privacidad' },
];

const notifications = reactive({
  email: true,
  newPrograms: true,
  favorites: true,
});

const privacy = reactive({
  publicProfile: false,
  showFavorites: true,
  showReviews: true,
});

const saveNotifications = () => {
  alert('Preferencias guardadas (demo)');
  // Aquí iría la llamada a la API
};

const deleteAccount = () => {
  const confirmed = confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.');
  if (confirmed) {
    alert('Cuenta eliminada (demo)');
    authStore.logout();
  }
};
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.container h1 {
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.settings-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 20px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.tab-btn:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

.settings-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
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

.form-group input:disabled {
  background: #f8f9fa;
  color: #666;
}

.hint {
  display: block;
  margin-top: 5px;
  color: #888;
  font-size: 12px;
}

.toggle-group,
.privacy-options {
  margin-bottom: 30px;
}

.toggle-item,
.privacy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: border-color 0.3s;
}

.toggle-item:hover,
.privacy-item:hover {
  border-color: #667eea;
}

.toggle-info h4,
.privacy-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.toggle-info p,
.privacy-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #28a745;
}

input:checked + .toggle-slider:before {
  transform: translateX(30px);
}

.btn-save {
  padding: 12px 25px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-save:hover {
  transform: translateY(-2px);
}

.danger-zone {
  margin-top: 40px;
  padding: 20px;
  background: #fff5f5;
  border: 2px solid #dc3545;
  border-radius: 8px;
}

.danger-zone h4 {
  color: #dc3545;
  margin-bottom: 10px;
}

.danger-zone p {
  color: #666;
  margin-bottom: 20px;
}

.btn-danger {
  padding: 12px 25px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-danger:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .settings-tabs {
    flex-direction: column;
  }
  
  .toggle-item,
  .privacy-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .toggle {
    align-self: flex-end;
  }
}
</style>