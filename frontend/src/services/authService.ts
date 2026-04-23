// src/services/authService.ts
import type { LoginCredentials, RegisterData, AuthResponse, LoginResponse, RegisterResponse } from '@/types';

// Simular delay de red
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 1000));

// Usuarios mock para desarrollo
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@estudiarapp.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin' as const,
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=dc3545&color=fff',
    status: 'active' as const,
    emailVerified: true
  },
  {
    id: '2',
    email: 'editor@estudiarapp.com',
    password: 'editor123',
    name: 'Editor Demo',
    role: 'editor' as const,
    avatar: 'https://ui-avatars.com/api/?name=Editor&background=fd7e14&color=fff',
    status: 'active' as const,
    emailVerified: true
  },
  {
    id: '3',
    email: 'user@estudiarapp.com',
    password: 'user123',
    name: 'Usuario Demo',
    role: 'user' as const,
    avatar: 'https://ui-avatars.com/api/?name=User&background=28a745&color=fff',
    status: 'active' as const,
    emailVerified: true
  }
];

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await simulateNetworkDelay();
    
    console.log('🔐 Login intentado:', credentials.email);
    
    // Buscar usuario mock
    const mockUser = MOCK_USERS.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (!mockUser) {
      throw new Error('Credenciales incorrectas. Usa: admin@estudiarapp.com / admin123');
    }
    
    // Crear respuesta de usuario
    const user = {
      id: mockUser.id,
      _id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      status: mockUser.status,
      emailVerified: mockUser.emailVerified,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: mockUser.avatar
    };
    
    return {
      user,
      token: `mock-jwt-token-${Date.now()}-${mockUser.id}`,
      refreshToken: `mock-refresh-token-${Date.now()}-${mockUser.id}`,
      expiresIn: 3600,
      requiresTwoFactor: false
    };
  },
  
  // Registro
  async register(data: RegisterData): Promise<RegisterResponse> {
    await simulateNetworkDelay();
    
    console.log('📝 Registro intentado:', data.email);
    
    // Verificar si el email ya existe
    if (MOCK_USERS.some(u => u.email === data.email)) {
      throw new Error('El email ya está registrado');
    }
    
    // Validar contraseña
    if (data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Crear nuevo usuario
    const newUser = {
      id: (MOCK_USERS.length + 1).toString(),
      _id: (MOCK_USERS.length + 1).toString(),
      email: data.email,
      name: data.name,
      role: data.role,
      status: 'active' as const,
      emailVerified: false,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=667eea&color=fff`
    };
    
    // Agregar a mock (solo en memoria para esta sesión)
    MOCK_USERS.push({
      ...newUser,
      password: data.password
    });
    
    return {
      user: newUser,
      token: `mock-jwt-token-reg-${Date.now()}`,
      refreshToken: `mock-refresh-token-reg-${Date.now()}`,
      expiresIn: 3600,
      requiresEmailVerification: true
    };
  },
  
  // Verificar token
  async verifyToken(token: string): Promise<boolean> {
    await simulateNetworkDelay();
    console.log('🔍 Verificando token:', token.substring(0, 20) + '...');
    return token.startsWith('mock-jwt-token');
  },
  
  // Refrescar token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    await simulateNetworkDelay();
    return {
      token: `mock-jwt-token-refreshed-${Date.now()}`,
      refreshToken: `mock-refresh-token-refreshed-${Date.now()}`
    };
  },
  
  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await simulateNetworkDelay();
    
    // Validar nueva contraseña
    if (newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    console.log('✅ Contraseña cambiada exitosamente (mock)');
  },
  
  // Solicitar reset de contraseña
  async forgotPassword(email: string): Promise<void> {
    await simulateNetworkDelay();
    
    // Verificar si el email existe
    const userExists = MOCK_USERS.some(u => u.email === email);
    
    if (!userExists) {
      console.log('⚠️ Email no encontrado, pero mostramos mensaje de éxito por seguridad');
    }
    
    console.log(`📧 Email de recuperación enviado a: ${email} (mock)`);
  },
  
  // Resetear contraseña
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await simulateNetworkDelay();
    
    // Validar nueva contraseña
    if (newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    console.log(`✅ Contraseña reseteada con token: ${token.substring(0, 20)}... (mock)`);
  },
  
  // Verificar email
  async verifyEmail(token: string): Promise<void> {
    await simulateNetworkDelay();
    console.log(`✅ Email verificado con token: ${token.substring(0, 20)}... (mock)`);
  },
  
  // Reenviar email de verificación
  async resendVerificationEmail(email: string): Promise<void> {
    await simulateNetworkDelay();
    console.log(`📧 Email de verificación reenviado a: ${email} (mock)`);
  },
  
  // Logout (en servicio, solo para consistencia)
  async logout(): Promise<void> {
    await simulateNetworkDelay();
    console.log('🚪 Sesión cerrada en servidor (mock)');
  }
};

// Exportación por defecto para compatibilidad
export default authService;