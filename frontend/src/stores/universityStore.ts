// stores/university.ts - STORE CENTRALIZADO
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { University } from '@/types'
import { adminService } from '@/services/adminApi'

export const useUniversityStore = defineStore('university', () => {
  const universities = ref<University[]>([])

  const fetchUniversities = async () => {
    try {
      const data = await adminService.getUniversities()
      universities.value = data
      console.log('🏪 Store actualizado:', universities.value.length, 'universidades')
    } catch (error) {
      console.error('Error fetching universities:', error)
      universities.value = []
    }
  }

  return {
    universities,
    fetchUniversities
  }
})