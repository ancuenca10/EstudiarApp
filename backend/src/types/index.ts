// src/types/index.ts

// ==================== TIPOS EXISTENTES (mantenidos) ====================
export interface Program {
  _id?: string
  name: string
  level: 'Técnico' | 'Tecnológico' | 'Pregrado' | 'Posgrado'
  duration: string
  price: number
  modality: 'Presencial' | 'Virtual' | 'Híbrido'
  requirements: string[]
  schedule: string
  description: string
}

export interface University {
  _id?: string
  name: string
  city: string
  type: 'Pública' | 'Privada'
  accreditation: string
  programs: Program[]
  contact: {
    email: string
    phone: string
    address: string
    website: string
  }
  logo?: string
  createdAt?: Date
  updatedAt?: Date
}

// ==================== TIPOS DE COMPARACIÓN (mantenidos) ====================
export interface ProgramComparison extends Program {
  comparisonId: string;
  isInComparison: boolean;
}

export interface ComparisonItem {
  programId: string;
  programName: string;
  universityId: string;
  universityName: string;
  addedAt: Date;
}

export interface ComparisonState {
  items: ComparisonItem[];
  maxItems: number;
  isComparing: boolean;
}

// ==================== NUEVOS TIPOS PARA SISTEMA MULTI-USUARIO ====================

// Roles del sistema
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'user';

// Estados del usuario
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'banned';

// Género (opcional)
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Tipo de documento de identificación
export type DocumentType = 'cc' | 'ce' | 'passport' | 'ti';

// Interfaz principal del usuario
export interface User {
  _id?: string; // Mantenemos _id para compatibilidad con MongoDB
  id: string; // Nuevo campo para consistencia
  email: string;
  password?: string; // Solo para creación/actualización, no se devuelve en respuestas
  name: string;
  role: UserRole;
  status: UserStatus;
  
  // Información personal
  avatar?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  birthDate?: Date;
  gender?: Gender;
  documentType?: DocumentType;
  documentNumber?: string;
  
  // Información académica (para estudiantes)
  studentInfo?: {
    currentInstitution?: string;
    studyLevel?: 'school' | 'undergraduate' | 'graduate' | 'postgraduate';
    graduationYear?: number;
    interests?: string[];
  };
  
  // Información profesional (para editores/administradores)
  professionalInfo?: {
    position?: string;
    department?: string;
    universityId?: string; // Referencia a la universidad que gestiona
    biography?: string;
    expertise?: string[];
  };
  
  // Configuración de cuenta
  emailVerified: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  
  // Metadatos del sistema
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Seguridad
  twoFactorEnabled?: boolean;
  lastPasswordChange?: Date;
  
  // Preferencias del usuario
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme?: 'light' | 'dark' | 'auto';
  };
  
  // Relaciones
  universityId?: string; // Para usuarios vinculados a una universidad
  permissions: string[]; // Permisos específicos del usuario
}

// Interfaz para autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Credenciales para login
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string; // Para 2FA
}

// Datos para registro
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  universityId?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  newsletter?: boolean;
}

// Datos para actualizar perfil
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  birthDate?: Date;
  gender?: Gender;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

// Datos para cambiar contraseña
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Interfaz para permisos
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'content' | 'university' | 'system' | 'moderation';
  requiredRole: UserRole;
}

// Interfaz para roles
export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // 1: user, 2: editor, 3: admin, 4: super_admin
  permissions: string[];
  default: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para sesión de usuario
export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: string;
  os?: string;
  browser?: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  isValid: boolean;
}

// Interfaz para auditoría
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ==================== CONSTANTES DE PERMISOS ====================

// Permisos disponibles en el sistema
export const PERMISSIONS = {
  // ===== GESTIÓN DE USUARIOS =====
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_CHANGE_ROLE: 'user.change_role',
  USER_CHANGE_STATUS: 'user.change_status',
  USER_RESET_PASSWORD: 'user.reset_password',
  USER_VIEW_PROFILE: 'user.view_profile',
  
  // ===== GESTIÓN DE CONTENIDO =====
  CONTENT_VIEW: 'content.view',
  CONTENT_CREATE: 'content.create',
  CONTENT_EDIT: 'content.edit',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_ARCHIVE: 'content.archive',
  CONTENT_REVIEW: 'content.review',
  
  // ===== GESTIÓN DE UNIVERSIDADES =====
  UNIVERSITY_VIEW: 'university.view',
  UNIVERSITY_CREATE: 'university.create',
  UNIVERSITY_EDIT: 'university.edit',
  UNIVERSITY_DELETE: 'university.delete',
  UNIVERSITY_MANAGE: 'university.manage', // Gestionar universidad específica
  UNIVERSITY_VERIFY: 'university.verify',
  UNIVERSITY_STATS: 'university.stats',
  
  // ===== GESTIÓN DE PROGRAMAS =====
  PROGRAM_VIEW: 'program.view',
  PROGRAM_CREATE: 'program.create',
  PROGRAM_EDIT: 'program.edit',
  PROGRAM_DELETE: 'program.delete',
  PROGRAM_PUBLISH: 'program.publish',
  PROGRAM_ARCHIVE: 'program.archive',
  
  // ===== MODERACIÓN =====
  REVIEW_MODERATE: 'review.moderate',
  COMMENT_MODERATE: 'comment.moderate',
  REPORT_VIEW: 'report.view',
  REPORT_MANAGE: 'report.manage',
  SPAM_MANAGE: 'spam.manage',
  FLAG_CONTENT: 'flag.content',
  
  // ===== GESTIÓN DE FAVORITOS Y COMPARACIÓN =====
  FAVORITES_VIEW: 'favorites.view',
  FAVORITES_MANAGE: 'favorites.manage',
  COMPARISON_VIEW: 'comparison.view',
  COMPARISON_MANAGE: 'comparison.manage',
  
  // ===== ADMINISTRACIÓN DEL SISTEMA =====
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_STATS: 'system.stats',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_UPDATE: 'system.update',
  
  // ===== ROLES Y PERMISOS =====
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',
  
  // ===== PERFIL DE USUARIO =====
  PROFILE_VIEW: 'profile.view',
  PROFILE_EDIT: 'profile.edit',
  PROFILE_DELETE: 'profile.delete',
  PASSWORD_CHANGE: 'password.change',
  EMAIL_VERIFY: 'email.verify',
  TWO_FACTOR_MANAGE: 'two_factor.manage',
  
  // ===== NOTIFICACIONES =====
  NOTIFICATION_VIEW: 'notification.view',
  NOTIFICATION_MANAGE: 'notification.manage',
  NOTIFICATION_SEND: 'notification.send',
  
  // ===== IMPORTACIÓN/EXPORTACIÓN =====
  EXPORT_DATA: 'export.data',
  IMPORT_DATA: 'import.data',
} as const;

// Tipo para permisos
export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ==================== ROLES CON PERMISOS POR DEFECTO ====================

export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  // SUPER ADMIN: Todos los permisos
  super_admin: Object.values(PERMISSIONS),
  
  // ADMIN: Permisos administrativos completos excepto configuración del sistema
  admin: [
    // Gestión de usuarios
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_CHANGE_ROLE,
    PERMISSIONS.USER_CHANGE_STATUS,
    PERMISSIONS.USER_RESET_PASSWORD,
    
    // Gestión de contenido
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.CONTENT_ARCHIVE,
    PERMISSIONS.CONTENT_REVIEW,
    
    // Gestión de universidades y programas
    PERMISSIONS.UNIVERSITY_VIEW,
    PERMISSIONS.UNIVERSITY_CREATE,
    PERMISSIONS.UNIVERSITY_EDIT,
    PERMISSIONS.UNIVERSITY_DELETE,
    PERMISSIONS.UNIVERSITY_VERIFY,
    PERMISSIONS.UNIVERSITY_STATS,
    PERMISSIONS.PROGRAM_VIEW,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_EDIT,
    PERMISSIONS.PROGRAM_DELETE,
    PERMISSIONS.PROGRAM_PUBLISH,
    
    // Moderación
    PERMISSIONS.REVIEW_MODERATE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_MANAGE,
    PERMISSIONS.SPAM_MANAGE,
    PERMISSIONS.FLAG_CONTENT,
    
    // Perfil y usuario
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.PASSWORD_CHANGE,
    PERMISSIONS.EMAIL_VERIFY,
    PERMISSIONS.TWO_FACTOR_MANAGE,
    PERMISSIONS.FAVORITES_MANAGE,
    PERMISSIONS.COMPARISON_MANAGE,
    
    // Exportación/Importación
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA,
  ],
  
  // EDITOR: Permisos limitados de edición
  editor: [
    // Gestión de contenido (limitada)
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_REVIEW,
    
    // Gestión específica de universidad si está asignado
    PERMISSIONS.UNIVERSITY_MANAGE,
    PERMISSIONS.PROGRAM_VIEW,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_EDIT,
    PERMISSIONS.PROGRAM_PUBLISH,
    
    // Moderación básica
    PERMISSIONS.REVIEW_MODERATE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.FLAG_CONTENT,
    
    // Perfil
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.PASSWORD_CHANGE,
    PERMISSIONS.EMAIL_VERIFY,
    PERMISSIONS.FAVORITES_MANAGE,
    PERMISSIONS.COMPARISON_MANAGE,
  ],
  
  // USER: Permisos básicos
  user: [
    // Perfil
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.PASSWORD_CHANGE,
    PERMISSIONS.EMAIL_VERIFY,
    PERMISSIONS.TWO_FACTOR_MANAGE,
    
    // Favoritos y comparación
    PERMISSIONS.FAVORITES_VIEW,
    PERMISSIONS.FAVORITES_MANAGE,
    PERMISSIONS.COMPARISON_VIEW,
    PERMISSIONS.COMPARISON_MANAGE,
    
    // Visualización de contenido
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.UNIVERSITY_VIEW,
    PERMISSIONS.PROGRAM_VIEW,
    
    // Notificaciones
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
};

// ==================== INTERFACES PARA FILTROS ====================

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  country?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== INTERFACES PARA FORMULARIOS ====================

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  country?: string;
  city?: string;
  universityId?: string;
  sendWelcomeEmail?: boolean;
  generatePassword?: boolean;
  customPassword?: string;
}

// ==================== INTERFACES PARA API RESPONSES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthResponse {
  requiresTwoFactor?: boolean;
}

export interface RegisterResponse extends AuthResponse {
  requiresEmailVerification: boolean;
}

// ==================== INTERFACES PARA VALIDACIÓN ====================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ==================== INTERFACES PARA ESTADÍSTICAS ====================

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<UserStatus, number>;
  usersByCountry: Record<string, number>;
  usersByCity: Record<string, number>;
  loginStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageDaily: number;
  };
}

// ==================== TIPOS DE NOTIFICACIÓN ====================

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'user_registered'
  | 'password_changed'
  | 'email_verified'
  | 'content_published'
  | 'review_posted'
  | 'report_resolved';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
  readAt?: Date;
}

// ==================== TIPOS PARA PAGINACIÓN ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== ENUMS PARA USO INTERNO ====================

export enum UserAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export enum ContentType {
  UNIVERSITY = 'UNIVERSITY',
  PROGRAM = 'PROGRAM',
  REVIEW = 'REVIEW',
  COMMENT = 'COMMENT',
  ARTICLE = 'ARTICLE',
}