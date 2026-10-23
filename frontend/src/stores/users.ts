import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, UserRole, UserStatus } from '@/types/auth';
import api from '@/services/api';

export const useUsersStore = defineStore('users', () => {
  // Estado
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const totalUsers = ref(0);
  const filters = ref({
    role: '' as UserRole | '',
    status: '' as UserStatus | '',
    search: '',
    page: 1,
    limit: 20,
  });

  // Actions
  const fetchUsers = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await api.get('/users', { params: filters.value });
      const data = response.data as { users?: User[]; total?: number };
      users.value = data.users || [];
      totalUsers.value = data.total || users.value.length;
      
      return { success: true, users: users.value };
    } catch (err: any) {
      error.value = err.message || 'Error al cargar usuarios';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUserById = async (userId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await api.get(`/users/${userId}`);
      const user = response.data.user || response.data;
      currentUser.value = user;
      
      return { success: true, user };
    } catch (err: any) {
      error.value = err.message || 'Error al cargar usuario';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const createUser = async (userData: Partial<User>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await api.post('/users', userData);
      const newUser = response.data.user || response.data;
      users.value.unshift(newUser);
      totalUsers.value += 1;
      
      return { success: true, user: newUser };
    } catch (err: any) {
      error.value = err.message || 'Error al crear usuario';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await api.patch(`/users/${userId}`, userData);
      const updatedUser = response.data.user || response.data;
      
      // Actualizar en la lista
      const index = users.value.findIndex(u => u.id === userId);
      if (index !== -1) {
        users.value[index] = updatedUser;
      }
      
      // Actualizar currentUser si es el mismo
      if (currentUser.value?.id === userId) {
        currentUser.value = updatedUser;
      }
      
      return { success: true, user: updatedUser };
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar usuario';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await api.delete(`/users/${userId}`);
      
      // Remover de la lista
      users.value = users.value.filter(u => u.id !== userId);
      totalUsers.value -= 1;
      
      // Limpiar currentUser si es el mismo
      if (currentUser.value?.id === userId) {
        currentUser.value = null;
      }
      
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar usuario';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const changeUserStatus = async (userId: string, status: UserStatus) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await api.patch(`/users/${userId}/status`, { status });
      const updatedUser = response.data.user || response.data;
      
      // Actualizar en la lista
      const index = users.value.findIndex(u => u.id === userId);
      if (index !== -1) {
        users.value[index] = updatedUser;
      }
      
      return { success: true, user: updatedUser };
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar estado';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await api.post(`/users/${userId}/reset-password`);
      return { success: true };
    } catch (err: any) {
      error.value = err.message || 'Error al resetear contraseña';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
    fetchUsers();
  };

  return {
    // State
    users,
    currentUser,
    isLoading,
    error,
    totalUsers,
    filters,
    
    // Actions
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserStatus,
    resetPassword,
    updateFilters,
  };
});
