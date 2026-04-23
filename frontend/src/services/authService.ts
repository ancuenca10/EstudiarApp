import api from './api';
import type { LoginCredentials, LoginResponse, RegisterData, RegisterResponse, User } from '@/types';

type BackendAuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: User['role'];
    createdAt?: string;
    updatedAt?: string;
  };
};

const mapUser = (user: BackendAuthResponse['user']): User => ({
  id: user.id,
  _id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  status: 'active',
  emailVerified: true,
  permissions: [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<BackendAuthResponse>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    return {
      token: response.data.token,
      user: mapUser(response.data.user),
    };
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<BackendAuthResponse>('/auth/register', {
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
    });

    return {
      token: response.data.token,
      user: mapUser(response.data.user),
      requiresEmailVerification: false,
    };
  },

  async verifyToken(): Promise<boolean> {
    await api.get('/auth/me');
    return true;
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },
};

export default authService;
