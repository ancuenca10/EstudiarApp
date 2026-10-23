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
      path: '/becas',
      name: 'becas',
      component: () => import('@/views/BecasView.vue'),
      meta: { title: 'Becas' }
    },
    {
      path: '/becas/:id',
      name: 'beca-detail',
      component: () => import('@/views/BecaDetailView.vue'),
      meta: { title: 'Detalle de Beca' }
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
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPassword.vue'),
      meta: { requiresGuest: true, title: 'Recuperar contrasena' }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPassword.vue'),
      meta: { requiresGuest: true, title: 'Restablecer contrasena' }
    },
    {
      path: '/profile',
      name: 'profile',
      alias: '/perfil',
      component: () => import('@/views/auth/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Mi Perfil' }
    },
    {
      path: '/student',
      name: 'student-dashboard',
      component: () => import('@/views/student/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Panel Estudiante' }
    },
    {
      path: '/student/profile',
      name: 'student-profile',
      component: () => import('@/views/student/ProfileView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Perfil Estudiante' }
    },
    {
      path: '/student/preferences',
      name: 'student-preferences',
      component: () => import('@/views/student/ProfileView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Preferencias Estudiante' }
    },
    {
      path: '/student/favorites',
      name: 'student-favorites',
      component: () => import('@/views/student/FavoritesView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Favoritos Estudiante' }
    },
    {
      path: '/student/comparisons',
      name: 'student-comparisons',
      component: () => import('@/views/student/ComparisonView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Comparador Estudiante' }
    },
    {
      path: '/student/plans',
      name: 'student-plans',
      component: () => import('@/views/student/PlansView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Planes Estudiante' }
    },
    {
      path: '/student/applications',
      name: 'student-applications',
      component: () => import('@/views/student/ApplicationsView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Inscripciones Estudiante' }
    },
    {
      path: '/student/applications/:id',
      name: 'student-application-detail',
      component: () => import('@/views/student/ApplicationDetailView.vue'),
      meta: { requiresAuth: true, roles: ['STUDENT'], title: 'Detalle de Inscripcion' }
    },
    // Rutas de administración (opcional para futuro)
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Panel de Administración' }
    },
    {
      path: '/admin/usuarios',
      name: 'admin-users',
      alias: '/admin/users',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN'], title: 'Gestionar Usuarios' }
    },
    {
      path: '/admin/programas',
      name: 'admin-programs',
      alias: '/admin/programs',
      component: () => import('@/views/admin/ProgramsView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Aprobar Programas' }
    },
    {
      path: '/admin/universidades',
      name: 'admin-universities',
      alias: '/admin/universities',
      component: () => import('@/views/admin/UniversitiesView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Administrar Universidades' }
    },
    {
      path: '/admin/reviews',
      name: 'admin-reviews',
      alias: ['/admin/resenas', '/admin/reseñas'],
      component: () => import('@/views/admin/ReviewsView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Moderar Resenas' }
    },
    {
      path: '/admin/parametrizacion',
      name: 'admin-parametrizacion',
      component: () => import('@/views/admin/ParametrizacionView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN'], title: 'Parametrizacion' }
    },
    {
      path: '/admin/configuracion-ia',
      name: 'admin-ai-settings',
      component: () => import('@/views/admin/AiSettingsView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN'], title: 'Configuracion IA' }
    },
    {
      path: '/admin/becas',
      name: 'admin-becas',
      component: () => import('@/views/admin/BecasView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Administrar Becas' }
    },
    {
      path: '/admin/asistente-carga',
      name: 'admin-import-assistant',
      component: () => import('@/views/admin/ImportAssistantView.vue'),
      meta: { requiresAuth: true, roles: ['SUPERADMIN', 'ADMIN', 'ASESOR'], title: 'Asistente de Carga' }
    },
    {
      path: '/universidad',
      name: 'university-panel',
      component: () => import('@/views/university/DashboardView.vue'),
      meta: { requiresAuth: true, roles: ['UNIVERSITY'], title: 'Panel Universidad' }
    },
    {
      path: '/universidad/programas',
      name: 'university-panel-programs',
      component: () => import('@/views/university/MyProgramsView.vue'),
      meta: { requiresAuth: true, roles: ['UNIVERSITY'], title: 'Mis Programas' }
    },
    {
      path: '/universidad/becas',
      name: 'university-panel-becas',
      component: () => import('@/views/university/MyBecasView.vue'),
      meta: { requiresAuth: true, roles: ['UNIVERSITY'], title: 'Mis Becas' }
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
  const requiresImportAssistant = to.matched.some(record => record.meta.requiresImportAssistant);
  const allowedRoles = to.matched.flatMap(record => {
    const roles = record.meta.roles;
    return Array.isArray(roles) ? roles.map((role) => String(role).toUpperCase()) : [];
  });
  const currentRole = authStore.user?.role?.toUpperCase();

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  if (requiresGuest && authStore.isAuthenticated) {
    next(authStore.isStudent ? { name: 'student-dashboard' } : { path: '/perfil' });
    return;
  }

  if ((to.name === 'profile' || to.path === '/perfil') && authStore.isStudent) {
    next({ name: 'student-profile' });
    return;
  }

  if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' });
    return;
  }

  if (
    allowedRoles.length > 0 &&
    (!currentRole || !allowedRoles.includes(currentRole)) &&
    !(allowedRoles.includes('STUDENT') && authStore.isStudent)
  ) {
    next(authStore.canAccessAdminPanel ? { name: 'admin' } : { name: 'home' });
    return;
  }

  if (requiresImportAssistant && !authStore.canUseImportAssistant) {
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
