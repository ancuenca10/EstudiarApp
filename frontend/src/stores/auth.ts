import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '@/services/authService';
import type { LoginCredentials, RegisterData, User } from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const roleValue = (role?: string) => role?.toUpperCase();

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value || !!localStorage.getItem(TOKEN_KEY));
  const isAdmin = computed(() => ['ADMIN', 'SUPERADMIN'].includes(roleValue(user.value?.role) || ''));
  const isSuperAdmin = computed(() => roleValue(user.value?.role) === 'SUPERADMIN');
  const isEditor = computed(() => ['UNIVERSITY', 'ASESOR', 'EDITOR'].includes(roleValue(user.value?.role) || ''));
  const isUser = computed(() => roleValue(user.value?.role) === 'USER');
  const userRole = computed(() => user.value?.role || 'USER');

  const persistSession = (authToken: string, authUser: User, rememberMe?: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    storage.setItem(TOKEN_KEY, authToken);
    storage.setItem(USER_KEY, JSON.stringify(authUser));
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await authService.login(credentials);

      user.value = response.user;
      token.value = response.token;
      refreshToken.value = response.refreshToken || null;
      persistSession(response.token, response.user, credentials.rememberMe);

      return { success: true, user: response.user };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en el inicio de sesion';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await authService.register(data);

      user.value = response.user;
      token.value = response.token;
      refreshToken.value = response.refreshToken || null;
      persistSession(response.token, response.user, true);

      return {
        success: true,
        user: response.user,
        requiresEmailVerification: response.requiresEmailVerification,
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en el registro';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    error.value = null;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const checkAuth = () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

      if (!storedToken || !storedUser) {
        return false;
      }

      token.value = storedToken;
      user.value = JSON.parse(storedUser);
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const init = () => {
    checkAuth();
  };

  const hasPermission = (_permission?: string) => {
    return isAuthenticated.value;
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user.value) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    user.value = { ...user.value, ...profileData };
    const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user.value));
    return { success: true, user: user.value };
  };

  const changePassword = async () => {
    return { success: false, error: 'Cambio de contrasena no disponible todavia' };
  };

  return {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isUser,
    userRole,
    hasPermission,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    init,
  };
});
