<template>
  <main class="ea-page">
    <AppNavbar />

    <section class="ea-container profile-header ea-card">
      <div class="avatar">{{ userInitials }}</div>
      <div>
        <p class="ea-kicker">Mi cuenta</p>
        <h1>{{ user?.name || 'Usuario' }}</h1>
        <p>{{ user?.email || 'usuario@ejemplo.com' }}</p>
      </div>
      <span class="role-badge">{{ userRoleLabel }}</span>
    </section>

    <section class="ea-container profile-grid">
      <article class="ea-card info-panel">
        <h2>Informacion personal</h2>
        <dl>
          <div>
            <dt>Nombre</dt>
            <dd>{{ user?.name || 'No especificado' }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ user?.email || 'No especificado' }}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{{ userRoleLabel }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>Activo</dd>
          </div>
        </dl>
      </article>

      <aside class="ea-card actions-panel">
        <h2>Acciones</h2>
        <button class="ea-btn ea-btn-secondary" type="button" @click="editProfile">
          Editar perfil
        </button>
        <button class="ea-btn ea-btn-secondary" type="button" @click="changePassword">
          Cambiar contrasena
        </button>
        <button class="ea-btn ea-btn-primary" type="button" @click="goRoleHome">
          Ir a mi panel
        </button>
        <button class="danger-btn" type="button" @click="logout">
          Cerrar sesion
        </button>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

const userInitials = computed(() => {
  if (!user.value?.name) return 'U';
  return user.value.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const userRole = computed(() => authStore.userRole);
const userRoleLabel = computed(() => {
  const roles: Record<string, string> = {
    user: 'Estudiante',
    editor: 'Editor',
    asesor: 'Asesor',
    admin: 'Administrador',
    superadmin: 'Super administrador',
    super_admin: 'Super administrador',
    university: 'Universidad',
  };
  return roles[userRole.value?.toLowerCase?.() || ''] || 'Usuario';
});

const editProfile = () => {
  alert('Funcionalidad en desarrollo');
};

const changePassword = () => {
  router.push('/forgot-password');
};

const goRoleHome = () => {
  if (authStore.isStudent) {
    router.push('/student');
    return;
  }

  if (authStore.user?.role?.toUpperCase() === 'UNIVERSITY') {
    router.push('/universidad');
    return;
  }

  if (authStore.canAccessAdminPanel) {
    router.push('/admin');
    return;
  }

  router.push('/');
};

const logout = () => {
  authStore.logout();
  router.push('/');
};

onMounted(() => {
  authStore.checkAuth();
  if (authStore.isStudent) {
    router.replace('/student/profile');
  }
});
</script>

<style scoped>
.profile-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  margin-top: 32px;
  padding: 24px;
}

.avatar {
  display: grid;
  width: 74px;
  height: 74px;
  place-items: center;
  border-radius: var(--ea-radius-lg);
  background: var(--ea-text);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 900;
}

h1,
h2,
p,
dl {
  margin-top: 0;
}

.profile-header h1 {
  margin-bottom: 4px;
}

.profile-header p:not(.ea-kicker) {
  color: var(--ea-muted);
  margin-bottom: 0;
}

.role-badge {
  border-radius: 999px;
  background: var(--ea-primary-soft);
  color: var(--ea-primary-dark);
  font-weight: 900;
  padding: 8px 12px;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  margin-top: 18px;
  padding-bottom: 56px;
}

.info-panel,
.actions-panel {
  padding: 22px;
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

dl div {
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: var(--ea-surface-muted);
  padding: 14px;
}

dt {
  color: var(--ea-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

dd {
  margin: 4px 0 0;
  color: var(--ea-text);
  font-weight: 800;
}

.actions-panel {
  display: grid;
  align-self: start;
  gap: 10px;
}

.danger-btn {
  min-height: 42px;
  border: 0;
  border-radius: var(--ea-radius-sm);
  background: var(--ea-danger);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 760px) {
  .profile-header,
  .profile-grid,
  dl {
    grid-template-columns: 1fr;
  }
}
</style>
