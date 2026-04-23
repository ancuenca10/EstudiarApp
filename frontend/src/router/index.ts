import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/comparison',
      name: 'comparison',
      component: () => import('../views/ComparisonView.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue')
    }, 
    {
      path: '/university/:id',
      name: 'university-detail',
      component: () => import('../views/UniversityDetailView.vue')
    },
    {
      path: '/university/:id/reviews',
      name: 'UniversityReviews',
      component: () => import('@/views/UniversityReviewsView.vue')
    },
    {
      path: '/write-review',
      name: 'WriteReview',
      component: () => import('@/views/WriteReviewView.vue')
    },
    {
      path: '/reviews',
      name: 'UserReviews',
      component: () => import('@/views/MyReviewsView.vue')
    },
    // NUEVAS RUTAS AÑADIDAS
    {
      path: '/program/:universityId/:programId',
      name: 'program-details',
      component: () => import('@/views/ProgramDetailsView.vue'),
      props: true
    },
    {
      path: '/universities',
      name: 'universities',
      component: () => import('@/views/UniversitiesView.vue'),
      meta: { title: 'Todas las Universidades' }
    },
    {
      path: '/programs',
      name: 'programs',
      component: () => import('@/views/ProgramsView.vue'),
      meta: { title: 'Todos los Programas' }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: 'Buscar' }
    },
    // Rutas de autenticación (si las necesitas más adelante)
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true, title: 'Iniciar Sesión' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true, title: 'Registrarse' }
    },
    {
      path: '/profile',
      name: 'profile',
      alias: '/perfil',
      component: () => import('@/views/auth/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Mi Perfil' }
    },
    // Rutas de administración (opcional para futuro)
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true, title: 'Panel de Administración' }
    },
    {
      path: '/admin/usuarios',
      name: 'admin-users',
      alias: '/admin/users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true, title: 'Gestionar Usuarios' }
    },
    {
      path: '/admin/programas',
      name: 'admin-programs',
      alias: '/admin/programs',
      component: () => import('@/views/admin/ProgramsView.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true, title: 'Aprobar Programas' }
    },
    {
      path: '/admin/universities',
      name: 'admin-universities',
      alias: '/admin/universidades',
      component: () => import('@/views/admin/UniversitiesView.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true, title: 'Administrar Universidades' }
    },
    {
      path: '/admin/reviews',
      name: 'admin-reviews',
      component: () => import('@/views/admin/ReviewsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Moderar Reseñas' }
    },
    // Ruta 404 - Not Found
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' }
    }
  ]
});

// Middleware global para títulos de página
router.beforeEach((to, from, next) => {
  // Establecer título de la página
  const title = to.meta.title as string || 'EstudiarApp';
  document.title = `${title} - EstudiarApp`;
  
  // Aquí puedes agregar más lógica de middleware:
  // - Verificación de autenticación
  // - Verificación de roles
  // - Tracking de analytics
  // - etc.
  
  const authStore = useAuthStore();
  authStore.checkAuth();

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin);

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  if (requiresGuest && authStore.isAuthenticated) {
    next({ path: '/perfil' });
    return;
  }

  if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' });
    return;
  }

  if (requiresSuperAdmin && !authStore.isSuperAdmin) {
    next({ name: 'home' });
    return;
  }

  next();
});

// Middleware de autenticación (ejemplo - descomentar cuando tengas el store de auth)
/*
import { useAuthStore } from '@/stores/auth';

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  
  // Verificar autenticación
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } 
  // Verificar si es invitado (ya autenticado)
  else if (requiresGuest && authStore.isAuthenticated) {
    next({ name: 'home' });
  }
  // Verificar rol de administrador
  else if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' });
  }
  else {
    next();
  }
  
  // Establecer título
  const title = to.meta.title as string || 'EstudiarApp';
  document.title = `${title} - EstudiarApp`;
});
*/

export default router;
