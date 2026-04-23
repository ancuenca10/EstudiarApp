// Roles disponibles
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

// Estados del usuario
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// Interfaces principales
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  emailVerified: boolean;
  universityId?: string; // Para usuarios de universidades
  permissions: string[];
  metadata: {
    phone?: string;
    country?: string;
    city?: string;
    bio?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  universityId?: string;
  agreeToTerms: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}