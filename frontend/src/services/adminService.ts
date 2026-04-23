import type { University, Program } from '@/types'

const API_BASE_URL = 'http://localhost:3000/api'

export const adminService = {
  async getUniversities(): Promise<University[]> {
    try {
      console.log('🌐 Fetching universities from:', `${API_BASE_URL}/universities`)
      const response = await fetch(`${API_BASE_URL}/universities`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('📦 Universities data received:', data)
      return data
    } catch (error) {
      console.error('❌ Error in getUniversities:', error)
      // Retornar array vacío en caso de error
      return []
    }
  },

  async getUniversityById(id: string): Promise<University> {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/${id}`)
      if (!response.ok) throw new Error('Error al obtener universidad')
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async createUniversity(data: any): Promise<University> {
    try {
      const response = await fetch(`${API_BASE_URL}/universities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Error al crear universidad')
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async updateUniversity(id: string, data: any): Promise<University> {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Error al actualizar universidad')
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  },

  async deleteUniversity(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar universidad')
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }
}