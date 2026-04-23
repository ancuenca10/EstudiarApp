// src/middleware/auth.ts
import type { NavigationGuard } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Guard para verificar autenticación
export const authGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore();
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password/:token',
    '/auth/verify-email/:token',
    '/error/403',
    '/error/404',
    '/error/500',
  ];
  
  // Verificar si la ruta es pública usando patrones
  const isPublicRoute = publicRoutes.some(route => {
    // Convertir patrón de ruta a regex simple
    const pattern = route.replace(/:[^\s/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(to.path);
  });
  
  // Si la ruta requiere autenticación pero el usuario no está autenticado
  if (!isPublicRoute && !authStore.isAuthenticated) {
    // Redirigir al login con la ruta original como parámetro
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
    return;
  }
  
  // Si el usuario ya está autenticado y trata de acceder a rutas de auth
  if (authStore.isAuthenticated && to.path.startsWith('/auth/')) {
    // Redirigir al dashboard según su rol
    const role = authStore.userRole;
    switch (role) {
      case 'super_admin':
      case 'admin':
        next('/admin/dashboard');
        break;
      case 'editor':
        // Verificar si es editor de universidad
        const user = authStore.user;
        if (user?.universityId) {
          next('/university/dashboard');
        } else {
          next('/editor/dashboard');
        }
        break;
      default:
        next('/');
    }
    return;
  }
  
  // Continuar normalmente
  next();
};

// Guard para verificar roles específicos
export const roleGuard = (allowedRoles: string[]): NavigationGuard => {
  return (to, from, next) => {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      next({ 
        path: '/auth/login', 
        query: { redirect: to.fullPath } 
      });
      return;
    }
    
    const userRole = authStore.userRole;
    
    // Super admin tiene acceso a todo
    if (userRole === 'super_admin') {
      next();
      return;
    }
    
    // Verificar si el rol del usuario está en los permitidos
    if (!allowedRoles.includes(userRole)) {
      // Redirigir a página de acceso denegado
      next('/error/403');
      return;
    }
    
    next();
  };
};

// Guard para verificar si el usuario está verificado
export const verifiedGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next({ path: '/auth/login' });
    return;
  }
  
  // Verificar si el email está verificado (excepto para ciertas rutas)
  if (!authStore.user?.emailVerified && !to.path.includes('/auth/verify')) {
    next({ path: '/auth/verify-email' });
    return;
  }
  
  next();
};

// Guard para redirigir según el rol después del login
export const roleRedirectGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next();
    return;
  }
  
  // Si está autenticado y trata de ir a la página principal
  if (to.path === '/') {
    const role = authStore.userRole;
    switch (role) {
      case 'super_admin':
      case 'admin':
        next('/admin/dashboard');
        break;
      case 'editor':
        const user = authStore.user;
        if (user?.universityId) {
          next('/university/dashboard');
        } else {
          next('/editor/dashboard');
        }
        break;
      default:
        next();
    }
    return;
  }
  
  next();
};