import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { adminUsersService, type CreateAdminUserPayload } from '@/services/adminUsersService';
import type { User, UserRole } from '@/types';

export const useAdminUsersStore = defineStore('adminUsers', () => {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const totalUsers = computed(() => users.value.length);

  const fetchUsers = async () => {
    try {
      loading.value = true;
      error.value = null;
      users.value = await adminUsersService.listUsers();
      return { success: true };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar usuarios';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const createAdmin = async (payload: CreateAdminUserPayload) => {
    return createUserWithRole(payload, 'ADMIN');
  };

  const createAsesor = async (payload: CreateAdminUserPayload) => {
    return createUserWithRole(payload, 'ASESOR');
  };

  const createUserWithRole = async (payload: CreateAdminUserPayload, role: 'ADMIN' | 'ASESOR') => {
    try {
      loading.value = true;
      error.value = null;
      const createdUser =
        role === 'ADMIN'
          ? await adminUsersService.createAdmin(payload)
          : await adminUsersService.createAsesor(payload);

      users.value = [createdUser, ...users.value.filter((user) => user.id !== createdUser.id)];
      return { success: true, user: createdUser };
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Error al crear ${role}`;
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const changeRole = async (userId: string, role: UserRole) => {
    try {
      loading.value = true;
      error.value = null;
      const updatedUser = await adminUsersService.changeRole(userId, role);
      users.value = users.value.map((user) => (user.id === userId ? updatedUser : user));
      return { success: true, user: updatedUser };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cambiar rol';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    error,
    totalUsers,
    fetchUsers,
    createAdmin,
    createAsesor,
    changeRole,
  };
});
