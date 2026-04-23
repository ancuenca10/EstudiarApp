import api from './api';
import type { User, UserRole } from '@/types';

type UsersResponse = {
  users: User[];
};

type UserResponse = {
  message: string;
  user: User;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  password: string;
};

export const adminUsersService = {
  async listUsers() {
    const response = await api.get<UsersResponse>('/users');
    return response.data.users;
  },

  async createAdmin(payload: CreateAdminUserPayload) {
    const response = await api.post<UserResponse>('/users/admins', payload);
    return response.data.user;
  },

  async createAsesor(payload: CreateAdminUserPayload) {
    const response = await api.post<UserResponse>('/users/asesores', payload);
    return response.data.user;
  },

  async changeRole(userId: string, role: UserRole) {
    const response = await api.patch<UserResponse>(`/users/${userId}/role`, { role });
    return response.data.user;
  },
};
