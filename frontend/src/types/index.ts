// src/types/index.ts

export interface Program {
  _id: string
  name: string
  level: 'Técnico' | 'Tecnológico' | 'Pregrado' | 'Posgrado'
  duration: string
  price: number
  modality: 'Presencial' | 'Virtual' | 'Híbrido'
  schedule: string
  description: string
  requirements: string[]
  
  // ✅ Campos para el comparador
  duration_months?: number        // Duración en meses para comparación numérica
  weekly_hours?: number          // Horas por semana
  quality_rating?: number        // Calificación de calidad (1-5)
  requires_exam?: boolean        // Requiere examen de admisión
  requires_interview?: boolean   // Requiere entrevista
}

export interface University {
  _id: string
  name: string
  country: string
  state: string
  city: string
  type: 'Pública' | 'Privada'
  accreditation: string
  contact: {
    email: string
    phone: string
    address: string
    website: string
  }
  programs: Program[]
  
  // ✅ Campos adicionales para el comparador
  quality_rating?: number        // Calificación general de la universidad
  student_count?: number        // Número de estudiantes
  founded_year?: number         // Año de fundación
}

export interface UniversityFilters {
  search: string
  country: string
  state: string
  city: string
  type: string
  accreditation: string
}

// 👇 INTERFACES PARA FAVORITOS
export interface FavoriteUniversity {
  universityId: string
  addedAt: string
}

export interface FavoriteProgram {
  programId: string
  universityId: string
  addedAt: string
}

export interface FavoritesState {
  universities: FavoriteUniversity[]
  programs: FavoriteProgram[]
}

// 👇 NUEVAS INTERFACES PARA EL COMPARADOR
export interface ComparisonItem {
  programId: string
  programName: string
  universityId: string
  universityName: string
  addedAt: Date
}

export interface ComparisonState {
  items: ComparisonItem[]
  maxItems: number
  isComparing: boolean
}

// 👇 TIPOS PARA DATOS DE COMPARACIÓN
export interface ProgramComparisonData {
  id: string
  name: string
  universityName: string
  universityId: string
  level: string
  duration: string
  duration_months?: number
  price: number
  modality: string
  schedule: string
  quality_rating?: number
  weekly_hours?: number
  requires_exam?: boolean
  requires_interview?: boolean
}

// 👇 INTERFACES PARA GRÁFICOS
export interface RadarAxis {
  label: string
  key: keyof ProgramComparisonData | string
  max: number
  value?: any // Para valores personalizados
}

export interface ComparisonChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
  }[]
}

// 👇 INTERFACES PARA RESULTADOS DE COMPARACIÓN
export interface ComparisonResult {
  programs: ProgramComparisonData[]
  differences: {
    type: string
    description: string
    programs: {
      programId: string
      value: any
      isBest: boolean
    }[]
  }[]
  recommendation: {
    programId: string
    reason: string
    score: number
  }
  stats: {
    averageCost: number
    minCost: number
    maxCost: number
    averageDuration: number
    costDifference: number
    costDifferencePercentage: number
  }
}

// 👇 TIPO PARA FILTROS DE COMPARACIÓN
export interface ComparisonFilter {
  field: keyof ProgramComparisonData
  weight: number // 0-1 para ponderación
  isAscending?: boolean // true = menor es mejor, false = mayor es mejor
}

// 👇 ENUMS PARA EL COMPARADOR
export enum ComparisonView {
  TABLE = 'table',
  CARDS = 'cards',
  CHARTS = 'charts'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// 👇 INTERFAZ PARA LA RECOMENDACIÓN INTELIGENTE
export interface Recommendation {
  programId: string
  programName: string
  universityName: string
  score: number
  reasons: string[]
  strengths: string[]
  weaknesses: string[]
}

// 👇 TIPO PARA DATOS DE EXPORTACIÓN
export interface ComparisonExportData {
  metadata: {
    exportedAt: Date
    programCount: number
    criteria: string[]
  }
  programs: ProgramComparisonData[]
  comparison: ComparisonResult
  recommendation: Recommendation
}
export interface Program {
  id?: string
  universityId?: string
  status?: string
  approvedAt?: string | null
}

export interface University {
  id?: string
  description?: string
  status?: string
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export type UserRole = 'USER' | 'UNIVERSITY' | 'ASESOR' | 'ADMIN' | 'SUPERADMIN' | 'user' | 'editor' | 'admin' | 'super_admin'

export interface User {
  id: string
  _id?: string
  email: string
  name: string
  role: UserRole
  status?: string
  avatar?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  emailVerified?: boolean
  universityId?: string
  permissions?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: UserRole
  universityId?: string
  agreeToTerms?: boolean
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken?: string
  expiresIn?: number
  requiresTwoFactor?: boolean
}

export interface RegisterResponse extends LoginResponse {
  requiresEmailVerification?: boolean
}

export type AuthResponse = LoginResponse

export interface ApiProgram {
  id: string
  nombre: string
  descripcion: string
  precio: number
  modalidad: string
  duracion: string
  universidadId: string
  creadoPor: string
  estado: string
  aprobadoPor: string | null
  fechaAprobacion: string | null
  creadoEn: string
  actualizadoEn: string
}

export interface ApiUniversity {
  id: string
  nombre: string
  descripcion: string
  ciudad: string
  userId: string
  estado: string
  creadoEn: string
  actualizadoEn: string
}

export * from './reviews';
