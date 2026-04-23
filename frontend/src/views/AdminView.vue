<template>
  <div class="admin-view">
    <div class="container">
      <h1>👨‍💼 Panel de Administración</h1>
      
      <!-- Tabs de administración -->
      <div class="admin-tabs">
        <button 
          @click="activeTab = 'universities'"
          :class="{ active: activeTab === 'universities' }"
          class="tab-btn"
        >
          🏛️ Universidades
        </button>
        <button 
          @click="activeTab = 'reviews'"
          :class="{ active: activeTab === 'reviews' }"
          class="tab-btn"
        >
          ⭐ Reseñas
        </button>
        <button 
          @click="activeTab = 'users'"
          :class="{ active: activeTab === 'users' }"
          class="tab-btn"
        >
          👥 Usuarios
        </button>
      </div>

      <!-- Contenido de las tabs -->
      <div class="tab-content">
        <!-- Universidades -->
        <div v-if="activeTab === 'universities'" class="universities-admin">
          <div class="section-header">
            <h2>Gestión de Universidades</h2>
            <button @click="showUniversityForm = true" class="add-btn">
              ➕ Añadir Universidad
            </button>
          </div>

          <!-- Lista de universidades -->
          <div class="universities-list">
            <div v-for="university in universitiesStore.universities" :key="university.id" class="admin-university-card">
              <div class="card-header">
                <h3>{{ university.name }}</h3>
                <span class="status-badge" :class="university.status">
                  {{ getStatusText(university.status) }}
                </span>
              </div>
              
              <div class="card-body">
                <p>{{ university.description }}</p>
                <div class="meta-info">
                  <span>📍 {{ university.city }}, {{ university.state }}</span>
                  <span>🌐 {{ university.website }}</span>
                </div>
              </div>
              
              <div class="card-actions">
                <button @click="editUniversity(university)" class="edit-btn">
                  ✏️ Editar
                </button>
                <button 
                  v-if="university.status === 'pending_review'"
                  @click="approveUniversity(university.id)"
                  class="approve-btn"
                >
                  ✅ Aprobar
                </button>
                <button 
                  v-if="university.status === 'pending_review'"
                  @click="rejectUniversity(university.id)"
                  class="reject-btn"
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reseñas -->
        <div v-else-if="activeTab === 'reviews'" class="reviews-admin">
          <h2>Moderación de Reseñas</h2>
          <!-- Aquí iría la moderación de reseñas -->
        </div>

        <!-- Usuarios -->
        <div v-else class="users-admin">
          <h2>Gestión de Usuarios</h2>
          <!-- Aquí iría la gestión de usuarios -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUniversitiesStore } from '@/stores/universities';

const universitiesStore = useUniversitiesStore();
const activeTab = ref<'universities' | 'reviews' | 'users'>('universities');
const showUniversityForm = ref(false);

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'approved': '✅ Aprobada',
    'pending_review': '⏳ Pendiente',
    'rejected': '❌ Rechazada'
  };
  return statusMap[status] || status;
};

const editUniversity = (university: any) => {
  console.log('Editar universidad:', university);
};

const approveUniversity = async (universityId: string) => {
  if (confirm('¿Aprobar esta universidad?')) {
    // En una implementación real, esto vendría del store
    console.log('Aprobar universidad:', universityId);
  }
};

const rejectUniversity = async (universityId: string) => {
  const reason = prompt('Razón del rechazo:');
  if (reason) {
    console.log('Rechazar universidad:', universityId, 'Razón:', reason);
  }
};
</script>

<style scoped>
.admin-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.admin-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.tab-btn.active {
  color: #3b82f6;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.tab-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.admin-university-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending_review {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  margin-bottom: 1rem;
}

.card-body p {
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.card-actions button:hover {
  opacity: 0.8;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

@media (max-width: 768px) {
  .admin-tabs {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .card-actions {
    flex-wrap: wrap;
  }
}
</style>