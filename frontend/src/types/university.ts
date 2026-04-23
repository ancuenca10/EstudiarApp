// types/university.ts
export interface University {
  id: string
  _id?: string // Para compatibilidad
  name: string
  country: string
  state?: string
  city: string
  website?: string
  description?: string
  logo?: string
  accreditation?: string
  cost?: number
  tuition?: number
  type?: 'public' | 'private'
  rating?: number
  programs?: Program[]
  
  // Información de auditoría
  status: 'pending_review' | 'approved' | 'rejected'
  createdBy?: string
  createdAt: Date
  updatedAt: Date
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  version: number
}

export interface Program {
  id: string
  name: string
  description?: string
  duration?: string
  level?: string
  modality?: string
  cost?: string
  
  // Información de auditoría
  status: 'pending_review' | 'approved' | 'rejected'
  createdAt: Date
}
