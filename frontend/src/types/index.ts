export interface DynamicFieldValue {
  fieldId: string
  nombreInterno: string
  etiqueta: string
  tipo: string
  value: string | string[] | boolean | null
  visibleInCard?: boolean
  visibleInDetail?: boolean
  searchable?: boolean
  filterable?: boolean
  orden: number
}

export interface Program {
  _id?: string
  id?: string
  name?: string
  level?: string
  duration?: string
  price?: number
  modality?: string
  schedule?: string
  description?: string
  requirements?: string[]
  universityId?: string
  universityName?: string
  type?: string
  currency?: string
  cost?: number | string
  duration_months?: number
  weekly_hours?: number
  quality_rating?: number
  requires_exam?: boolean
  requires_interview?: boolean
  curriculum?: Array<{ courses: Array<{ code: string; name: string; credits: number }> }>
  graduation_rate?: number
  cost_breakdown?: Record<string, number>
  dynamicFields?: DynamicFieldValue[]
  status?: string
  approvedAt?: string | null
}

export interface University {
  _id?: string
  id?: string
  name?: string
  country?: string
  state?: string
  city?: string
  type?: string | null
  accreditation?: string
  description?: string
  contact?: {
    email?: string
    phone?: string
    address?: string
    website?: string
  }
  programs?: Program[]
  quality_rating?: number
  student_count?: number
  founded_year?: number
  founded?: number | string
  campus?: string
  rating?: number | null
  dynamicFields?: DynamicFieldValue[]
  status?: string
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
  logo?: string
  website?: string
  version?: number
}

export interface UniversityFilters {
  search: string
  country: string
  state: string
  city: string
  type: string
  accreditation: string
}

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

export interface ComparisonItem {
  programId: string
  programName: string
  universityId: string
  universityName: string
  addedAt: Date
  programData?: Partial<ProgramComparisonData>
}

export interface ComparisonState {
  items: ComparisonItem[]
  maxItems: number
  isComparing: boolean
}

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
  addedAt?: Date
}

export interface RadarAxis {
  label: string
  key: keyof ProgramComparisonData | string
  max: number
  value?: unknown
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

export interface ComparisonResult {
  programs: ProgramComparisonData[]
  differences: Array<{
    type: string
    description: string
    programs: Array<{
      programId: string
      value: unknown
      isBest: boolean
    }>
  }>
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

export interface ComparisonFilter {
  field: keyof ProgramComparisonData
  weight: number
  isAscending?: boolean
}

export enum ComparisonView {
  TABLE = 'table',
  CARDS = 'cards',
  CHARTS = 'charts'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface Recommendation {
  programId: string
  programName: string
  universityName: string
  score: number
  reasons: string[]
  strengths: string[]
  weaknesses: string[]
}

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

export type UserRole =
  | 'USER'
  | 'STUDENT'
  | 'UNIVERSITY'
  | 'ASESOR'
  | 'ADMIN'
  | 'SUPERADMIN'
  | 'user'
  | 'editor'
  | 'admin'
  | 'super_admin'

export interface User {
  id: string
  _id?: string
  email: string
  name: string
  username?: string
  role: UserRole
  tipoUsuario?: string
  plan?: 'free' | 'basic' | 'plus'
  estadoSuscripcion?: 'active' | 'inactive' | 'past_due' | 'cancelled'
  fechaInicioPlan?: string | null
  fechaFinPlan?: string | null
  preferenciasCompletadas?: boolean
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

export * from './reviews'
