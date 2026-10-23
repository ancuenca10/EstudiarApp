<template>
  <main class="ea-page">
    <AppNavbar />

    <header class="university-page page-header">
      <div>
        <p class="eyebrow">Panel Universidad</p>
        <h1>{{ panelStore.university?.nombre || 'Mi universidad' }}</h1>
        <p>{{ panelStore.university?.descripcion || 'Gestiona los programas asociados a tu cuenta.' }}</p>
      </div>
      <div class="header-actions">
        <NotificationsBell v-if="authStore.isAuthenticated" />
        <button class="ghost-btn" type="button" @click="router.push('/')">Ir al inicio</button>
        <button class="logout-btn" type="button" @click="handleLogout">Cerrar sesion</button>
      </div>
    </header>

    <p v-if="panelStore.loading" class="university-page feedback">Cargando panel...</p>
    <section v-else-if="panelStore.error" class="university-page empty-panel">
      <h2>No hay universidad asociada</h2>
      <p>Tu cuenta aun no tiene una universidad asociada. Contacta al administrador para activar tu panel.</p>
    </section>

    <template v-else>
      <section class="university-page stats-grid">
        <StatsCard label="Total programas" :value="panelStore.programs.length" icon="TP" />
        <StatsCard label="Pendientes" :value="panelStore.pendingPrograms.length" icon="PE" />
        <StatsCard label="Aprobados" :value="panelStore.approvedPrograms.length" icon="AP" />
        <StatsCard label="Rechazados" :value="panelStore.rejectedPrograms.length" icon="RE" />
      </section>

      <section class="university-page action-panel">
        <div>
          <h2>Programas academicos</h2>
          <p>Crear, actualizar y reenviar programas para revision.</p>
        </div>
        <button class="primary-btn" type="button" @click="router.push('/universidad/programas')">
          Gestionar programas
        </button>
      </section>

      <section class="university-page action-panel">
        <div>
          <h2>Becas</h2>
          <p>Crear, actualizar y reenviar becas para revision.</p>
        </div>
        <button class="primary-btn" type="button" @click="router.push('/universidad/becas')">
          Gestionar becas
        </button>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUniversityPanelStore } from '@/stores/universityPanel';
import AppNavbar from '@/components/AppNavbar.vue';
import NotificationsBell from '@/components/NotificationsBell.vue';
import StatsCard from '@/components/StatsCard.vue';

const router = useRouter();
const authStore = useAuthStore();
const panelStore = useUniversityPanelStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(async () => {
  try {
    await panelStore.fetchMyUniversity();
    await panelStore.fetchMyPrograms();
  } catch {
    // El mensaje amigable se renderiza desde el estado del store.
  }
});
</script>

<style scoped>
.university-page {
  margin: 0 auto;
  max-width: 1100px;
  width: min(1100px, calc(100% - 32px));
}

.page-header,
.header-actions,
.action-panel {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.page-header {
  align-items: flex-start;
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  margin-top: 32px;
  margin-bottom: 24px;
  padding: 26px;
}

.eyebrow {
  color: var(--ea-primary);
  font-weight: 800;
  margin: 0 0 6px;
}

h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
}

h1,
h2,
p {
  margin-top: 0;
}

.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
}

.action-panel,
.empty-panel,
.feedback {
  background: #fff;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-lg);
  box-shadow: var(--ea-shadow-sm);
  padding: 20px;
}

.action-panel:hover {
  box-shadow: var(--ea-shadow-md);
  transform: translateY(-2px);
}

.ghost-btn,
.primary-btn,
.logout-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.ghost-btn {
  background: #fff;
  border: 1px solid var(--ea-border);
}

.primary-btn {
  background: var(--ea-primary);
  color: #fff;
}

.logout-btn {
  background: var(--ea-danger);
  color: #fff;
}

@media (max-width: 860px) {
  .page-header,
  .header-actions,
  .action-panel {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
