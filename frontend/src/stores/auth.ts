// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, RegisterData } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters computados
  const isAuthenticated = computed(() => {
    // Verificar token en localStorage como respaldo
    const storedToken = localStorage.getItem('auth_token');
    return !!user.value || !!storedToken;
  });
  
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin');
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
  const isEditor = computed(() => user.value?.role === 'editor');
  const isUser = computed(() => user.value?.role === 'user');
  const userRole = computed(() => user.value?.role || 'user');
  
  // Mock de permisos para desarrollo
  const hasPermission = (permission: string) => {
    if (!user.value) return false;
    if (user.value.role === 'super_admin') return true;
    if (user.value.role === 'admin') return permission.includes('admin');
    if (user.value.role === 'editor') return permission.includes('editor') || permission.includes('view');
    return permission.includes('user') || permission.includes('view');
  };

  // Mock login (sin servicio) - CORREGIDO
  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('🔐 Intentando login con:', credentials.email);
      
      // VALIDACIÓN: Asegurar que credentials.email existe
      if (!credentials.email) {
        throw new Error('El email es requerido');
      }
      
      if (!credentials.password) {
        throw new Error('La contraseña es requerida');
      }
      
      // Extraer nombre del email de forma segura
      const email = credentials.email.trim();
      const emailName = email.split('@')[0] || 'Usuario';
      
      // Mock de usuario (para desarrollo)
      const mockUser: User = {
        id: '1',
        _id: '1',
        email: email,
        name: emailName.charAt(0).toUpperCase() + emailName.slice(1) + ' Demo',
        role: email.includes('admin') ? 'admin' : 
              email.includes('editor') ? 'editor' : 'user',
        status: 'active',
        emailVerified: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(emailName)}&background=667eea&color=fff`,
      };
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Establecer usuario
      user.value = mockUser;
      token.value = 'mock-jwt-token-' + Date.now();
      refreshToken.value = 'mock-refresh-token-' + Date.now();
      
      // Guardar en localStorage
      if (credentials.rememberMe) {
        localStorage.setItem('auth_token', token.value);
        localStorage.setItem('auth_refresh_token', refreshToken.value);
        localStorage.setItem('auth_user', JSON.stringify(mockUser));
      } else {
        sessionStorage.setItem('auth_token', token.value);
        sessionStorage.setItem('auth_user', JSON.stringify(mockUser));
      }
      
      console.log('✅ Login exitoso:', mockUser.email);
      return { success: true, user: mockUser };
      
    } catch (err: any) {
      error.value = err.message || 'Error en el inicio de sesión';
      console.error('❌ Error en login:', err);
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Mock register (sin servicio) - CORREGIDO
  const register = async (data: RegisterData) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('📝 Registrando usuario:', data.email);
      
      // VALIDACIÓN
      if (!data.email) {
        throw new Error('El email es requerido');
      }
      
      if (!data.name) {
        throw new Error('El nombre es requerido');
      }
      
      // Mock de usuario nuevo
      const mockUser: User = {
        id: Date.now().toString(),
        _id: Date.now().toString(),
        email: data.email.trim(),
        name: data.name.trim(),
        role: data.role || 'user',
        status: 'active',
        emailVerified: false,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name.trim())}&background=28a745&color=fff`,
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      user.value = mockUser;
      token.value = 'mock-jwt-token-reg-' + Date.now();
      refreshToken.value = 'mock-refresh-token-reg-' + Date.now();
      
      // Guardar
      localStorage.setItem('auth_token', token.value);
      localStorage.setItem('auth_refresh_token', refreshToken.value);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      console.log('✅ Registro exitoso:', mockUser.email);
      return { success: true, user: mockUser, requiresEmailVerification: true };
      
    } catch (err: any) {
      error.value = err.message || 'Error en el registro';
      console.error('❌ Error en registro:', err);
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout
  const logout = () => {
    console.log('🚪 Cerrando sesión');
    router.push({ name: 'login' }); // Usar 'login' no 'auth-login'

    
    // Limpiar estado
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    error.value = null;
    
    // Limpiar almacenamiento
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    
    // Redirigir (pero esto lo hará el componente)
  };

  // Verificar autenticación existente
  const checkAuth = () => {
    try {
      // Intentar recuperar del localStorage primero
      const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        token.value = storedToken;
        user.value = JSON.parse(storedUser);
        console.log('✅ Usuario recuperado de almacenamiento:', user.value?.email);
        return true;
      }
      
      console.log('ℹ️ No hay usuario autenticado en almacenamiento');
      return false;
      
    } catch (err) {
      console.error('❌ Error checking auth:', err);
      logout();
      return false;
    }
  };

  // Actualizar perfil (mock)
  const updateProfile = async (profileData: Partial<User>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('✏️ Actualizando perfil:', profileData);
      
      // Mock update
      if (user.value) {
        user.value = { ...user.value, ...profileData, updatedAt: new Date() };
        
        // Actualizar en almacenamiento
        const storage = localStorage.getItem('auth_user') ? localStorage : sessionStorage;
        storage.setItem('auth_user', JSON.stringify(user.value));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, user: user.value };
      
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar perfil';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Cambiar contraseña (mock)
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('🔑 Cambiando contraseña');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: 'Contraseña cambiada exitosamente' };
      
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar contraseña';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Inicialización
  const init = () => {
    console.log('🔄 Inicializando store de auth');
    checkAuth();
  };

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isUser,
    userRole,
    hasPermission,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    init,
  };
});