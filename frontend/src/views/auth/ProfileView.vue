<template>
  <div class="profile-page">
    <div class="container">
      <h1>👤 Mi Perfil</h1>
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="profile-info">
            <h2>{{ user?.name || 'Usuario' }}</h2>
            <p class="email">{{ user?.email || 'usuario@ejemplo.com' }}</p>
            <span class="role-badge" :class="userRole">
              {{ userRoleLabel }}
            </span>
          </div>
        </div>
        
        <div class="profile-content">
          <div class="section">
            <h3>📋 Información Personal</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Nombre:</label>
                <span>{{ user?.name || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <label>Email:</label>
                <span>{{ user?.email || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <label>Rol:</label>
                <span>{{ userRoleLabel }}</span>
              </div>
              <div class="info-item">
                <label>Estado:</label>
                <span class="status active">Activo</span>
              </div>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn-primary" @click="editProfile">
              ✏️ Editar Perfil
            </button>
            <button class="btn-secondary" @click="changePassword">
              🔑 Cambiar Contraseña
            </button>
            <button class="btn-danger" @click="logout">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
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

const user = computed(() => authStore.user);

const userInitials = computed(() => {
  if (!user.value?.name) return 'U';
  return user.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const userRole = computed(() => authStore.userRole);
const userRoleLabel = computed(() => {
  const roles: Record<string, string> = {
    'user': 'Estudiante',
    'editor': 'Editor',
    'admin': 'Administrador',
    'super_admin': 'Super Administrador'
  };
  return roles[userRole.value] || 'Usuario';
});

const editProfile = () => {
  alert('Funcionalidad en desarrollo');
};

const changePassword = () => {
  router.push('/auth/forgot-password');
};

const logout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.profile-page {
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

.profile-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  color: white;
  display: flex;
  align-items: center;
  gap: 25px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.profile-info h2 {
  margin: 0 0 5px 0;
  font-size: 24px;
}

.profile-info .email {
  margin: 0 0 10px 0;
  opacity: 0.9;
}

.role-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.user {
  background: #28a745;
}

.role-badge.editor {
  background: #fd7e14;
}

.role-badge.admin {
  background: #dc3545;
}

.role-badge.super_admin {
  background: #6f42c1;
}

.profile-content {
  padding: 30px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item label {
  display: block;
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.info-item span {
  color: #333;
  font-weight: 600;
}

.status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.3);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>