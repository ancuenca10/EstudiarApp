<!-- src/views/admin/UniversitiesView.vue -->
<template>
  <div class="universities-view">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>🎓 Gestión de Universidades</h1>
        <p class="subtitle">Administra la información de universidades y programas</p>
        
        <div class="header-actions">
          <button @click="showCreateModal = true" class="btn-primary">
            <span>+</span> Crear Nueva Universidad
          </button>
          
          <div class="stats">
            <span class="stat-item">
              <span class="stat-number">{{ stats.total }}</span>
              <span class="stat-label">Total</span>
            </span>
            <span class="stat-item">
              <span class="stat-number">{{ stats.pending }}</span>
              <span class="stat-label">Pendientes</span>
            </span>
            <span class="stat-item">
              <span class="stat-number">{{ stats.approved }}</span>
              <span class="stat-label">Aprobadas</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Contenido -->
      <div class="content">
        <!-- Filtros -->
        <div class="filters">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="🔍 Buscar universidad..."
            class="search-input"
          />
          
          <select v-model="selectedCountry" class="filter-select">
            <option value="">Todos los países</option>
            <option v-for="country in countries" :key="country" :value="country">
              {{ country }}
            </option>
          </select>
          
          <select v-model="selectedStatus" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="pending_review">Pendiente de revisión</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>

        <!-- Lista de universidades -->
        <div class="universities-list">
          <div v-if="filteredUniversities.length === 0" class="empty-state">
            <div class="empty-icon">🏫</div>
            <h3>No hay universidades</h3>
            <p v-if="activeTab === 'all'">Crea la primera universidad</p>
            <p v-else>No hay universidades en este estado</p>
            <button @click="showCreateModal = true" class="btn-primary">
              Crear Universidad
            </button>
          </div>

          <UniversityCard
            v-for="university in paginatedUniversities"
            :key="university.id"
            :university="university"
            :user-role="userRole"
            @edit="handleEdit"
            @view="handleView"
            @approve="handleApprove"
            @reject="handleReject"
            @delete="handleDelete"
          />
        </div>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            ← Anterior
          </button>
          
          <span class="page-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar -->
    <UniversityFormModal
      v-if="showCreateModal || editingUniversity"
      :university="editingUniversity"
      @close="closeModal"
      @save="handleSaveUniversity"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUniversitiesStore } from '@/stores/universities';
import UniversityCard from '../../components/UniversityCard.vue';
import UniversityFormModal from './UniversityForm.vue';

// Stores
const authStore = useAuthStore();
const universitiesStore = useUniversitiesStore();

// Estado
const activeTab = ref('all');
const searchQuery = ref('');
const selectedCountry = ref('');
const selectedStatus = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showCreateModal = ref(false);
const editingUniversity = ref(null);

// Computed
const userRole = computed(() => authStore.user?.role || 'user');

const tabs = computed(() => [
  { id: 'all', label: 'Todas', count: stats.value.total },
  { id: 'pending', label: 'Pendientes', count: stats.value.pending },
  { id: 'approved', label: 'Aprobadas', count: stats.value.approved },
  { id: 'rejected', label: 'Rechazadas', count: stats.value.rejected },
]);

const countries = computed(() => {
  return [...new Set(universitiesStore.universities.map(u => u.country))];
});

const stats = computed(() => {
  const total = universitiesStore.universities.length;
  const pending = universitiesStore.universities.filter(u => u.status === 'pending_review').length;
  const approved = universitiesStore.universities.filter(u => u.status === 'approved').length;
  const rejected = universitiesStore.universities.filter(u => u.status === 'rejected').length;
  
  return { total, pending, approved, rejected };
});

const filteredUniversities = computed(() => {
  let result = universitiesStore.universities;

  // Filtrar por tab
  if (activeTab.value === 'pending') {
    result = result.filter(u => u.status === 'pending_review');
  } else if (activeTab.value === 'approved') {
    result = result.filter(u => u.status === 'approved');
  } else if (activeTab.value === 'rejected') {
    result = result.filter(u => u.status === 'rejected');
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.city.toLowerCase().includes(query) ||
      u.country.toLowerCase().includes(query)
    );
  }

  // Filtrar por país
  if (selectedCountry.value) {
    result = result.filter(u => u.country === selectedCountry.value);
  }

  // Filtrar por estado
  if (selectedStatus.value) {
    result = result.filter(u => u.status === selectedStatus.value);
  }

  return result;
});

const paginatedUniversities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredUniversities.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredUniversities.value.length / itemsPerPage.value);
});

// Métodos
const handleEdit = (university: any) => {
  editingUniversity.value = university;
};

const handleView = (university: any) => {
  // Redirigir a vista de detalle pública
  window.open(`/universities/${university.id}`, '_blank');
};

const handleApprove = async (universityId: string) => {
  if (confirm('¿Aprobar esta universidad? Será visible públicamente.')) {
    await universitiesStore.approveUniversity(universityId, userRole.value);
  }
};

const handleReject = async (universityId: string) => {
  const reason = prompt('Ingresa el motivo del rechazo:');
  if (reason) {
    await universitiesStore.rejectUniversity(universityId, reason, userRole.value);
  }
};

const handleDelete = async (universityId: string) => {
  if (confirm('¿Eliminar permanentemente esta universidad?')) {
    await universitiesStore.deleteUniversity(universityId, userRole.value);
  }
};

const handleSaveUniversity = async (universityData: any) => {
  if (editingUniversity.value) {
    await universitiesStore.updateUniversity(universityData);
  } else {
    await universitiesStore.createUniversity(universityData);
  }
  closeModal();
};

const closeModal = () => {
  showCreateModal.value = false;
  editingUniversity.value = null;
};

// Inicialización
onMounted(async () => {
  await universitiesStore.fetchUniversities();
});
</script>

<style scoped>
.universities-view {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary span {
  font-size: 1.25rem;
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2563eb;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: #eff6ff;
}

.tab-count {
  background: #e2e8f0;
  color: #475569;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  min-width: 150px;
}

.universities-list {
  display: grid;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats {
    justify-content: space-around;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>