// stores/universities.ts - STORE UNIFICADO CORREGIDO
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { University, Program } from '@/types/university'

export const useUniversitiesStore = defineStore('universities', () => {
  const universities = ref<University[]>([])
  const programs = ref<Program[]>([])
  const isLoading = ref(false)

  // Datos de muestra optimizados
  const mockUniversities: University[] = [
    {
      id: '1',
      _id: 'uni-001',
      name: 'Universidad Nacional de Colombia',
      country: 'Colombia',
      state: 'Bogotá D.C.',
      city: 'Bogotá',
      website: 'https://unal.edu.co',
      description: 'Universidad pública colombiana fundada en 1867. Es la universidad más grande e importante de Colombia, reconocida por su excelencia académica e investigación.',
      logo: 'https://via.placeholder.com/100',
      status: 'approved',
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      approvedBy: 'admin',
      approvedAt: new Date('2024-01-10'),
      version: 1,
      type: 'public',
      rating: 4.5,
      contact: {
        email: 'contacto@unal.edu.co',
        phone: '+57 1 3165000',
        address: 'Carrera 45 # 26-85, Bogotá'
      },
      programs: [
        {
          id: 'prog-001-1',
          name: 'Ingeniería de Sistemas',
          description: 'Forma profesionales en el diseño, desarrollo e implementación de sistemas informáticos.',
          duration: '10 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$1,200,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Desarrollador de software, Arquitecto de sistemas, Analista de datos'
        },
        {
          id: 'prog-001-2',
          name: 'Medicina',
          description: 'Forma médicos generales con sólida base científica y humanística.',
          duration: '12 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$1,500,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Médico general, Especialista, Investigador médico'
        },
        {
          id: 'prog-001-3',
          name: 'Derecho',
          description: 'Forma abogados con pensamiento crítico y compromiso social.',
          duration: '10 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$1,000,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Abogado litigante, Asesor jurídico, Juez'
        }
      ]
    },
    {
      id: '2',
      _id: 'uni-002',
      name: 'Universidad de los Andes',
      country: 'Colombia',
      state: 'Bogotá D.C.',
      city: 'Bogotá',
      website: 'https://uniandes.edu.co',
      description: 'Universidad privada colombiana fundada en 1948. Reconocida por su excelencia académica y alta calidad en investigación.',
      logo: 'https://via.placeholder.com/100',
      status: 'approved',
      createdBy: 'system',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
      version: 1,
      type: 'private',
      rating: 4.8,
      contact: {
        email: 'info@uniandes.edu.co',
        phone: '+57 1 3394949',
        address: 'Carrera 1 # 18A-12, Bogotá'
      },
      programs: [
        {
          id: 'prog-002-1',
          name: 'Ingeniería Industrial',
          description: 'Forma ingenieros capaces de optimizar procesos y sistemas productivos.',
          duration: '10 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$8,500,000 COP por semestre',
          accreditation: 'Acreditación Internacional',
          careerOpportunities: 'Consultor, Gerente de operaciones, Analista de procesos'
        },
        {
          id: 'prog-002-2',
          name: 'Administración de Empresas',
          description: 'Forma líderes empresariales con visión global y estratégica.',
          duration: '9 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$7,800,000 COP por semestre',
          accreditation: 'Acreditación Internacional',
          careerOpportunities: 'Gerente, Emprendedor, Consultor empresarial'
        },
        {
          id: 'prog-002-3',
          name: 'Diseño',
          description: 'Forma diseñadores innovadores con enfoque en sostenibilidad.',
          duration: '8 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$6,500,000 COP por semestre',
          accreditation: 'Acreditación Nacional',
          careerOpportunities: 'Diseñador gráfico, Diseñador de producto, UX/UI Designer'
        }
      ]
    },
    {
      id: '3',
      _id: 'uni-003',
      name: 'Universidad del Valle',
      country: 'Colombia',
      state: 'Valle del Cauca',
      city: 'Cali',
      website: 'https://univalle.edu.co',
      description: 'Universidad pública fundada en 1945. Es la principal institución de educación superior del suroccidente colombiano.',
      logo: 'https://via.placeholder.com/100',
      status: 'approved',
      createdBy: 'system',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-15'),
      approvedBy: 'admin',
      approvedAt: new Date('2024-03-10'),
      version: 1,
      type: 'public',
      rating: 4.2,
      contact: {
        email: 'contactenos@correounivalle.edu.co',
        phone: '+57 2 3212100',
        address: 'Ciudad Universitaria Meléndez, Cali'
      },
      programs: [
        {
          id: 'prog-003-1',
          name: 'Medicina',
          description: 'Programa de medicina con enfoque en salud pública y comunitaria.',
          duration: '12 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$1,300,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Médico general, Salud pública, Investigación médica'
        },
        {
          id: 'prog-003-2',
          name: 'Ingeniería Civil',
          description: 'Forma ingenieros para el desarrollo de infraestructura sostenible.',
          duration: '10 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$1,100,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Constructor, Diseñador estructural, Gerente de proyectos'
        }
      ]
    },
    {
      id: '4',
      _id: 'uni-004',
      name: 'Universidad Javeriana',
      country: 'Colombia',
      state: 'Bogotá D.C.',
      city: 'Bogotá',
      website: 'https://javeriana.edu.co',
      description: 'Universidad privada católica fundada en 1623. Una de las instituciones más antiguas y prestigiosas de América.',
      logo: 'https://via.placeholder.com/100',
      status: 'approved',
      createdBy: 'system',
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-01'),
      version: 1,
      type: 'private',
      rating: 4.7,
      contact: {
        email: 'servicioalciudadano@javeriana.edu.co',
        phone: '+57 1 3208320',
        address: 'Carrera 7 # 40-62, Bogotá'
      },
      programs: [
        {
          id: 'prog-004-1',
          name: 'Psicología',
          description: 'Forma psicólogos con enfoque humanista y científico.',
          duration: '10 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$6,800,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Psicólogo clínico, Organizacional, Educativo'
        },
        {
          id: 'prog-004-2',
          name: 'Comunicación Social',
          description: 'Forma comunicadores con responsabilidad social y ética.',
          duration: '9 semestres',
          level: 'Pregrado',
          modality: 'Presencial',
          cost: '$5,900,000 COP por semestre',
          accreditation: 'Acreditación de Alta Calidad',
          careerOpportunities: 'Periodista, Relaciones públicas, Productor multimedia'
        }
      ]
    }
  ]

  // Obtener universidades - VERSIÓN SIMPLIFICADA Y RÁPIDA
  const fetchUniversities = async (forceRefresh: boolean = false): Promise<void> => {
    if (isLoading.value) return
    
    try {
      isLoading.value = true
      console.log('🔄 fetchUniversities llamado, forceRefresh:', forceRefresh)
      
      // Si hay datos y no se fuerza refresh, usar datos existentes
      if (universities.value.length > 0 && !forceRefresh) {
        console.log('📊 Usando universidades ya cargadas:', universities.value.length)
        isLoading.value = false
        return
      }
      
      // Intentar cargar de localStorage primero
      loadFromLocalStorage()
      
      // Si no hay datos en localStorage o se fuerza refresh, cargar datos de muestra
      if (universities.value.length === 0 || forceRefresh) {
        console.log('📥 Cargando datos de muestra...')
        universities.value = mockUniversities
        saveToLocalStorage()
        console.log('✅ Datos de muestra cargados:', universities.value.length, 'universidades')
      } else {
        console.log('📂 Datos cargados de localStorage:', universities.value.length, 'universidades')
      }
      
    } catch (error) {
      console.error('❌ Error en fetchUniversities:', error)
      // En caso de error, cargar datos de muestra directamente
      universities.value = mockUniversities
    } finally {
      isLoading.value = false
    }
  }

  // Método para buscar universidad por ID (compatible con id o _id)
  const getUniversityById = (id: string): University | undefined => {
    console.log('🔍 Buscando universidad con ID:', id)
    console.log('📊 Total universidades:', universities.value.length)
    
    const found = universities.value.find(u => {
      const matches = u.id === id || u._id === id
      if (matches) {
        console.log('✅ Encontrada:', u.name)
        console.log('🏫 Detalles:', {
          id: u.id,
          _id: u._id,
          programs: u.programs?.length || 0,
          type: u.type,
          rating: u.rating
        })
      }
      return matches
    })
    
    if (!found) {
      console.log('❌ No encontrada. IDs disponibles:', 
        universities.value.map(u => ({ name: u.name, id: u.id, _id: u._id }))
      )
    }
    
    return found
  }

  // Método rápido para cargar universidad por ID sin fetch
  const loadUniversityById = async (id: string): Promise<University | null> => {
    console.log('🚀 loadUniversityById llamado con ID:', id)
    
    // Primero verificar si ya está en el store
    const existing = getUniversityById(id)
    if (existing) {
      console.log('✅ Universidad encontrada en store:', existing.name)
      return existing
    }
    
    // Si no está, cargar todas las universidades
    console.log('📥 Universidad no encontrada, cargando todas...')
    await fetchUniversities(false)
    
    // Buscar nuevamente después de cargar
    const afterLoad = getUniversityById(id)
    if (afterLoad) {
      console.log('✅ Universidad encontrada después de carga:', afterLoad.name)
      return afterLoad
    }
    
    console.error('❌ Universidad no encontrada después de cargar todas')
    return null
  }

  // Crear universidad
  const createUniversity = async (universityData: Omit<University, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'status' | 'version'>) => {
    const newUniversity: University = {
      ...universityData,
      id: Date.now().toString(),
      _id: `uni-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending_review',
      version: 1
    }

    universities.value.push(newUniversity)
    saveToLocalStorage()
    
    return newUniversity
  }

  // Actualizar universidad
  const updateUniversity = async (universityData: University) => {
    const index = universities.value.findIndex(u => u.id === universityData.id)
    
    if (index !== -1) {
      const oldUniversity = universities.value[index]
      
      if (oldUniversity.status === 'approved') {
        const updatedUniversity: University = {
          ...universityData,
          status: 'pending_review',
          updatedAt: new Date(),
          version: oldUniversity.version + 1
        }
        
        universities.value[index] = updatedUniversity
      } else {
        universities.value[index] = {
          ...universityData,
          updatedAt: new Date()
        }
      }
      
      saveToLocalStorage()
    }
  }

  // Aprobar universidad
  const approveUniversity = async (universityId: string, approvedBy: string) => {
    const university = universities.value.find(u => u.id === universityId)
    
    if (university) {
      university.status = 'approved'
      university.approvedBy = approvedBy
      university.approvedAt = new Date()
      university.updatedAt = new Date()
      
      saveToLocalStorage()
    }
  }

  // Rechazar universidad
  const rejectUniversity = async (universityId: string, reason: string, rejectedBy: string) => {
    const university = universities.value.find(u => u.id === universityId)
    
    if (university) {
      university.status = 'rejected'
      university.rejectionReason = reason
      university.approvedBy = rejectedBy
      university.approvedAt = new Date()
      university.updatedAt = new Date()
      
      saveToLocalStorage()
    }
  }

  // Eliminar universidad (solo superadmin)
  const deleteUniversity = async (universityId: string, userRole: string) => {
    if (userRole !== 'super_admin') {
      throw new Error('No tienes permiso para eliminar universidades')
    }
    
    universities.value = universities.value.filter(u => u.id !== universityId)
    saveToLocalStorage()
  }

  // CRUD de programas
  const createProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'status'>) => {
    const newProgram: Program = {
      ...programData,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'pending_review'
    }

    programs.value.push(newProgram)
    saveProgramsToLocalStorage()
    
    return newProgram
  }

  // Persistencia local
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('estudiarapp-universities', JSON.stringify(universities.value))
      console.log('💾 Universidades guardadas en localStorage:', universities.value.length)
    } catch (error) {
      console.error('Error guardando universidades en localStorage:', error)
    }
  }

  const saveProgramsToLocalStorage = () => {
    try {
      localStorage.setItem('estudiarapp-programs', JSON.stringify(programs.value))
    } catch (error) {
      console.error('Error guardando programas en localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedUniversities = localStorage.getItem('estudiarapp-universities')
      
      if (savedUniversities) {
        const parsed = JSON.parse(savedUniversities)
        // Convertir strings de fecha a objetos Date
        const universitiesWithDates = parsed.map((uni: any) => ({
          ...uni,
          createdAt: new Date(uni.createdAt),
          updatedAt: new Date(uni.updatedAt),
          approvedAt: uni.approvedAt ? new Date(uni.approvedAt) : undefined
        }))
        
        universities.value = universitiesWithDates
        console.log('📂 Universidades cargadas de localStorage:', universities.value.length)
      }
      
      const savedPrograms = localStorage.getItem('estudiarapp-programs')
      if (savedPrograms) {
        programs.value = JSON.parse(savedPrograms)
      }
    } catch (error) {
      console.error('Error cargando de localStorage:', error)
    }
  }

  // Inicializar al crear el store - CARGAR INMEDIATAMENTE
  console.log('🏪 Inicializando UniversitiesStore...')
  loadFromLocalStorage()
  
  // Si no hay datos, cargar inmediatamente
  if (universities.value.length === 0) {
    console.log('📥 No hay datos en localStorage, cargando datos de muestra...')
    universities.value = mockUniversities
    saveToLocalStorage()
  }

  // Computed properties útiles
  const approvedUniversities = computed(() => {
    return universities.value.filter(u => u.status === 'approved')
  })

  const pendingUniversities = computed(() => {
    return universities.value.filter(u => u.status === 'pending_review')
  })

  const publicUniversities = computed(() => {
    return universities.value.filter(u => u.type === 'public')
  })

  const privateUniversities = computed(() => {
    return universities.value.filter(u => u.type === 'private')
  })

  return {
    universities,
    programs,
    isLoading,
    approvedUniversities,
    pendingUniversities,
    publicUniversities,
    privateUniversities,
    fetchUniversities,
    getUniversityById,
    loadUniversityById, // NUEVO: método específico para cargar por ID
    createUniversity,
    updateUniversity,
    approveUniversity,
    rejectUniversity,
    deleteUniversity,
    createProgram
  }
})