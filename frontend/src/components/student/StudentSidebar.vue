<template>
  <aside class="student-sidebar" aria-label="Navegacion de cuenta estudiante">
    <div class="sidebar-card">
      <span class="sidebar-kicker">Mi cuenta</span>
      <strong>{{ planLabel }}</strong>
      <small>{{ usage.favorites }} favoritos · {{ usage.comparisons }} comparaciones</small>
    </div>

    <nav class="sidebar-nav">
      <RouterLink to="/student">Dashboard</RouterLink>
      <RouterLink to="/student/profile">Mi perfil</RouterLink>
      <RouterLink to="/student/favorites">Mis favoritos</RouterLink>
      <RouterLink to="/student/comparisons">Comparador</RouterLink>
      <RouterLink to="/student">Mis recomendaciones</RouterLink>
      <RouterLink to="/student/applications">Inscripciones PLUS</RouterLink>
      <RouterLink to="/student/plans">Mi plan</RouterLink>
    </nav>

    <RouterLink v-if="plan !== 'plus'" class="sidebar-upgrade" to="/student/plans">
      Mejorar a {{ plan === 'free' ? 'BASIC' : 'PLUS' }}
    </RouterLink>

    <button class="sidebar-logout" type="button" @click="logout">
      Cerrar sesion
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useStudentStore } from '@/stores/student';

const studentStore = useStudentStore();
const authStore = useAuthStore();
const router = useRouter();
const { plan, usage } = storeToRefs(studentStore);

const planLabel = computed(() => {
  if (plan.value === 'plus') return 'Plan PLUS';
  if (plan.value === 'basic') return 'Plan BASIC';
  return 'Plan FREE';
});

onMounted(() => {
  void studentStore.fetchPlan();
});

const logout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.student-sidebar {
  align-self: start;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 14px;
  padding: 16px;
  position: sticky;
  top: 18px;
}

.sidebar-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 6px;
  padding: 14px;
}

.sidebar-kicker {
  color: #0f766e;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
}

.sidebar-card strong {
  color: #0f172a;
  font-size: 1.2rem;
}

.sidebar-card small {
  color: #64748b;
  line-height: 1.4;
}

.sidebar-nav {
  display: grid;
  gap: 6px;
}

.sidebar-nav a,
.sidebar-upgrade,
.sidebar-logout {
  border-radius: 8px;
  font-weight: 900;
  padding: 11px 12px;
  text-decoration: none;
}

.sidebar-nav a {
  color: #334155;
}

.sidebar-nav a.router-link-active,
.sidebar-nav a:hover {
  background: #ccfbf1;
  color: #115e59;
}

.sidebar-upgrade {
  background: #b45309;
  color: #fff;
  text-align: center;
}

.sidebar-logout {
  background: #dc2626;
  border: 0;
  color: #fff;
  cursor: pointer;
  width: 100%;
}

@media (max-width: 920px) {
  .student-sidebar {
    position: static;
  }

  .sidebar-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .sidebar-nav {
    grid-template-columns: 1fr;
  }
}
</style>
