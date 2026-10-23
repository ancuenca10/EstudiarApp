<template>
  <main class="ea-page">
    <AppNavbar />

    <header class="admin-page page-header">
      <div>
        <p class="eyebrow">{{ dashboardEyebrow }}</p>
        <h1>Panel de administracion</h1>
        <p>{{ dashboardDescription }}</p>
      </div>
      <div class="header-actions">
        <NotificationsBell v-if="authStore.isAuthenticated" />
        <button class="ghost-btn" type="button" @click="router.push('/perfil')">Mi perfil</button>
        <button class="ghost-btn" type="button" @click="router.push('/')">Ir al inicio</button>
        <button class="logout-btn" type="button" @click="handleLogout">Cerrar sesion</button>
      </div>
    </header>

    <section class="admin-page stats-grid">
      <StatsCard v-if="canManageUsers" label="Usuarios" :value="adminStore.users.length" icon="US" />
      <StatsCard :label="isAsesor ? 'Programas por revisar' : 'Programas'" :value="adminStore.programs.length" icon="PR" />
      <StatsCard label="Pendientes" :value="adminStore.pendingPrograms.length" icon="PE" />
      <StatsCard label="Universidades" :value="adminStore.universities.length" icon="UN" />
    </section>

    <section class="admin-page actions-grid">
      <button v-if="canManageUsers" class="action-card" type="button" @click="router.push('/admin/usuarios')">
        <strong>Gestionar usuarios</strong>
        <span>Crear ADMIN, crear ASESOR y cambiar roles.</span>
      </button>
      <button v-if="canUseImportAssistant" class="action-card" type="button" @click="router.push('/admin/asistente-carga')">
        <strong>Asistente de carga</strong>
        <span>Analizar una URL oficial y proponer datos pendientes de verificacion.</span>
      </button>
      <button v-if="canManageParametrization" class="action-card" type="button" @click="router.push('/admin/parametrizacion')">
        <strong>Parametrizacion</strong>
        <span>Configurar campos dinamicos para universidades y programas.</span>
      </button>
      <button v-if="canManageAiSettings" class="action-card" type="button" @click="router.push('/admin/configuracion-ia')">
        <strong>Configuracion IA</strong>
        <span>Configurar la OPENAI_API_KEY para el asistente de carga.</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/universidades')">
        <strong>Gestionar universidades</strong>
        <span>{{ isAsesor ? 'Crear y editar universidades.' : 'Crear, editar y eliminar universidades.' }}</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/programas')">
        <strong>{{ isAsesor ? 'Programas por revisar' : 'Gestionar programas' }}</strong>
        <span>{{ isAsesor ? 'Revisar, crear, editar y aprobar programas pendientes.' : 'Crear, editar, aprobar y eliminar programas.' }}</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/reviews')">
        <strong>{{ isAsesor ? 'Reseñas por moderar' : 'Gestionar reseñas' }}</strong>
        <span>{{ isAsesor ? 'Ver pendientes, aprobar y rechazar opiniones.' : 'Ver, editar, aprobar, rechazar y eliminar opiniones.' }}</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/becas')">
        <strong>Gestionar becas</strong>
        <span>Crear, editar, aprobar y rechazar becas.</span>
      </button>
    </section>

    <p v-if="adminStore.error" class="admin-page feedback error">{{ adminStore.error }}</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';
import AppNavbar from '@/components/AppNavbar.vue';
import NotificationsBell from '@/components/NotificationsBell.vue';
import StatsCard from '@/components/StatsCard.vue';

const router = useRouter();
const adminStore = useAdminStore();
const authStore = useAuthStore();

const canManageUsers = computed(() => authStore.isSuperAdmin);
const canManageParametrization = computed(() => authStore.isSuperAdmin);
const canManageAiSettings = computed(() => authStore.isSuperAdmin);
const canUseImportAssistant = computed(() => authStore.canAccessAdminPanel);
const isAsesor = computed(() => authStore.user?.role?.toUpperCase() === 'ASESOR');
const dashboardEyebrow = computed(() => isAsesor.value ? 'Gestion de contenido' : 'Panel administrativo');
const dashboardDescription = computed(() =>
  isAsesor.value
    ? 'Gestion operativa de programas, universidades y reseñas pendientes.'
    : 'Gestion operativa de usuarios, programas y universidades.'
);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(async () => {
  const tasks: Promise<unknown>[] = [
    adminStore.fetchPrograms(),
    adminStore.fetchUniversities(),
  ];

  if (canManageUsers.value) {
    tasks.push(adminStore.fetchUsers());
  }

  await Promise.allSettled(tasks);
});
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  width: min(1180px, calc(100% - 32px));
}

.page-header,
.header-actions {
  display: flex;
  gap: 16px;
}

.page-header {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  justify-content: space-between;
  margin-top: 32px;
  margin-bottom: 24px;
  padding: 26px;
}

.header-actions {
  align-items: flex-start;
}

.eyebrow {
  color: var(--ea-primary);
  font-weight: 800;
  margin: 0 0 6px;
}

h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.05;
}

h1,
p {
  margin-top: 0;
}

.stats-grid,
.actions-grid {
  display: grid;
  gap: 16px;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
}

.actions-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.action-card {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  padding: 20px;
}

.action-card span {
  color: var(--ea-muted);
}

.action-card {
  cursor: pointer;
  text-align: left;
  min-height: 138px;
}

.action-card:hover {
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.action-card strong {
  display: block;
  margin-bottom: 8px;
}

.ghost-btn {
  align-self: flex-start;
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.logout-btn {
  align-self: flex-start;
  background: var(--ea-danger);
  border: 0;
  border-radius: var(--ea-radius-sm);
  color: #fff;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.feedback {
  border-radius: 6px;
  margin-top: 16px;
  padding: 12px 14px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 860px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    flex-direction: column;
  }

  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
