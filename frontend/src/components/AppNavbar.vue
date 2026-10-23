<template>
  <header class="app-navbar">
    <div class="ea-container nav-inner">
      <button class="brand" type="button" @click="router.push('/')">
        <span class="brand-mark">EA</span>
        <span>
          <strong>EstudiarApp</strong>
          <small>Educacion superior en el Huila</small>
        </span>
      </button>

      <nav class="nav-links" aria-label="Navegacion principal">
        <RouterLink to="/universities">Universidades</RouterLink>
        <RouterLink to="/programs">Programas</RouterLink>
        <RouterLink to="/becas">Becas</RouterLink>
      </nav>

      <div class="nav-actions">
        <NotificationsBell v-if="authStore.isAuthenticated" />
        <button class="icon-btn" type="button" @click="router.push(authStore.isStudent ? '/student/comparisons' : '/comparison')">
          <span>Comparar</span>
          <strong v-if="comparisonCount > 0">{{ comparisonCount }}</strong>
        </button>
        <button class="icon-btn" type="button" @click="router.push(authStore.isStudent ? '/student/favorites' : '/favorites')">
          <span>Favoritos</span>
          <strong v-if="favoritesCount > 0">{{ favoritesCount }}</strong>
        </button>
        <button class="account-btn" type="button" @click="goToAccount">
          {{ authStore.isAuthenticated ? 'Mi cuenta' : 'Ingresar' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import NotificationsBell from '@/components/NotificationsBell.vue';
import { useAuthStore } from '@/stores/auth';
import { useComparisonStore } from '@/stores/comparison';
import { useFavoritesStore } from '@/stores/favorites';
import { useStudentStore } from '@/stores/student';

const router = useRouter();
const authStore = useAuthStore();
const comparisonStore = useComparisonStore();
const favoritesStore = useFavoritesStore();
const studentStore = useStudentStore();

const comparisonCount = computed(() =>
  authStore.isStudent ? studentStore.comparisons.length : comparisonStore.itemCount
);
const favoritesCount = computed(() =>
  authStore.isStudent ? studentStore.favorites.length : favoritesStore.favoritesCount
);

const goToAccount = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  if (authStore.user?.role?.toUpperCase() === 'UNIVERSITY') {
    router.push('/universidad');
    return;
  }

  if (authStore.isStudent) {
    router.push('/student');
    return;
  }

  if (authStore.canAccessAdminPanel) {
    router.push('/admin');
    return;
  }

  router.push('/perfil');
};

onMounted(() => {
  authStore.checkAuth();
  if (authStore.isStudent) {
    void Promise.all([studentStore.fetchFavorites(), studentStore.fetchComparisons()]);
  }
});
</script>

<style scoped>
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(226, 232, 240, 0.86);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.nav-inner {
  display: grid;
  grid-template-columns: minmax(230px, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 72px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: var(--ea-radius-lg);
  background: var(--ea-text);
  color: #fff;
  font-weight: 900;
  box-shadow: var(--ea-shadow-sm);
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  color: var(--ea-text);
  font-size: 1.05rem;
}

.brand small {
  color: var(--ea-muted);
  font-size: 0.78rem;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nav-links a {
  border-radius: var(--ea-radius-sm);
  color: #334155;
  font-weight: 800;
  padding: 9px 12px;
}

.nav-links a.router-link-active,
.nav-links a:hover {
  background: var(--ea-primary-soft);
  color: var(--ea-primary-dark);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn,
.account-btn {
  min-height: 42px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-radius-sm);
  background: #fff;
  color: var(--ea-text);
  cursor: pointer;
  font-weight: 800;
  padding: 0 14px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icon-btn strong {
  display: grid;
  min-width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 999px;
  background: var(--ea-primary);
  color: #fff;
  font-size: 0.76rem;
}

.account-btn {
  background: var(--ea-primary);
  border-color: var(--ea-primary);
  color: #fff;
}

@media (max-width: 1060px) {
  .nav-inner {
    grid-template-columns: 1fr auto;
  }

  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .nav-actions .icon-btn span {
    display: none;
  }

  .brand small {
    display: none;
  }
}
</style>
