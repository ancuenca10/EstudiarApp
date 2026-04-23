// src/middleware/auth.ts
import type { NavigationGuard } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const normalizeRole = (role?: string) => role?.toLowerCase();

// Guard para verificar autenticación (solo UX)
export const authGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore();
  
  console.log('🔍 Middleware auth - Ruta:', to.path);
  console.log('🔍 Usuario autenticado?:', authStore.isAuthenticated);
  
  // Rutas que NO requieren autenticación
  const publicRoutes = [
    '/',
    '/universities/:id',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/error/403',
    '/error/404',
  ];
  
  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes(':')) {
      const basePath = route.split('/:')[0] || route;
      return to.path.startsWith(basePath);
    }
    return to.path === route;
  });
  
  // Si la ruta NO es pública y el usuario NO está autenticado
  if (!isPublicRoute && !authStore.isAuthenticated) {
    console.log('⚠️ Redirigiendo a login - No autenticado');
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
    return;
  }
  
  // Si el usuario está autenticado y va a rutas de auth (excepto logout)
  if (authStore.isAuthenticated && to.path.startsWith('/auth/') && !to.path.includes('/logout')) {
    console.log('⚠️ Redirigiendo a home - Ya autenticado');
    
    // Redirigir según rol
    const role = normalizeRole(authStore.userRole);
    if (role === 'admin' || role === 'super_admin') {
      next('/admin');
    } else {
      next('/');
    }
    return;
  }
  
  console.log('✅ Permitiendo acceso a:', to.path);
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
    
    const userRole = normalizeRole(authStore.userRole) || '';
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());
    
    console.log('🔍 Verificando rol:', userRole);
    console.log('🔍 Roles permitidos:', allowedRoles);
    
    // Super admin tiene acceso a todo (en frontend)
    if (userRole === 'superadmin' || userRole === 'super_admin') {
      console.log('✅ Super admin - Acceso permitido');
      next();
      return;
    }
    
    // Verificar si el rol está permitido
    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('❌ Acceso denegado - Rol no permitido');
      next('/error/403');
      return;
    }
    
    console.log('✅ Rol verificado - Acceso permitido');
    next();
  };
};

// Helper para verificar permisos específicos
export const hasPermission = (permission: string): boolean => {
  const authStore = useAuthStore();
  return authStore.hasPermission ? authStore.hasPermission(permission) : false;
};

// Helper para verificar múltiples permisos
export const hasAnyPermission = (permissions: string[]): boolean => {
  const authStore = useAuthStore();
  if (!authStore.hasPermission) return false;
  return permissions.some(permission => authStore.hasPermission(permission));
};
