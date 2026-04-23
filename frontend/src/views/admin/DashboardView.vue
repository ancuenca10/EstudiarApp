<template>
  <main class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SUPERADMIN</p>
        <h1>Panel de administracion</h1>
        <p>Gestion operativa de usuarios, programas y universidades.</p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="router.push('/perfil')">Mi perfil</button>
        <button class="ghost-btn" type="button" @click="router.push('/')">Ir al inicio</button>
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Usuarios</span>
        <strong>{{ adminStore.users.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Programas</span>
        <strong>{{ adminStore.programs.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Pendientes</span>
        <strong>{{ adminStore.pendingPrograms.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Universidades</span>
        <strong>{{ adminStore.universities.length }}</strong>
      </article>
    </section>

    <section class="actions-grid">
      <button class="action-card" type="button" @click="router.push('/admin/usuarios')">
        <strong>Gestionar usuarios</strong>
        <span>Crear ADMIN, crear ASESOR y cambiar roles.</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/programas')">
        <strong>Aprobar programas</strong>
        <span>Revisar programas y aprobar pendientes.</span>
      </button>
      <button class="action-card" type="button" @click="router.push('/admin/universidades')">
        <strong>Gestionar universidades</strong>
        <span>Crear y eliminar universidades.</span>
      </button>
    </section>

    <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();

onMounted(async () => {
  await Promise.allSettled([
    adminStore.fetchUsers(),
    adminStore.fetchPrograms(),
    adminStore.fetchUniversities(),
  ]);
});
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.page-header,
.header-actions {
  display: flex;
  gap: 16px;
}

.page-header {
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-actions {
  align-items: flex-start;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card,
.action-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

.stat-card span,
.action-card span {
  color: #64748b;
}

.stat-card strong {
  display: block;
  font-size: 2rem;
}

.action-card {
  cursor: pointer;
  text-align: left;
}

.action-card strong {
  display: block;
  margin-bottom: 8px;
}

.ghost-btn {
  align-self: flex-start;
  background: #e2e8f0;
  border: 0;
  border-radius: 6px;
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
