<template>
  <main class="ea-page">
    <AppNavbar />
    <div class="assistant-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">ASISTENTE DE CARGA</p>
          <h1>Cargar desde sitio oficial</h1>
          <p>Analiza universidades y programas en flujos separados. Nada se publica automaticamente.</p>
        </div>
        <button class="ghost-btn" type="button" @click="goBack">Volver</button>
      </header>

      <nav class="tabs" aria-label="Flujos del asistente">
        <button
          type="button"
          :class="{ active: activeTab === 'university' }"
          @click="activeTab = 'university'"
        >
          Cargar Universidad
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'program' }"
          @click="activeTab = 'program'"
        >
          Cargar Programa
        </button>
      </nav>

      <section v-if="activeTab === 'university'" class="panel">
        <form class="analyze-form" @submit.prevent="analyzeUniversity">
          <label class="wide">
            URL oficial de la universidad
            <input v-model.trim="universityUrl" type="url" placeholder="https://www.universidad.edu.co" required />
          </label>
          <label class="ai-toggle">
            <input v-model="useUniversityAI" type="checkbox" />
            <span>Usar IA</span>
          </label>
          <button class="primary-btn" type="submit" :disabled="universityLoading">
            {{ universityLoading ? 'Analizando...' : 'Analizar universidad' }}
          </button>
        </form>
        <p class="hint">La IA sugerira datos institucionales, pero el guardado siempre es manual.</p>
        <p v-if="universityError" class="feedback error">{{ universityError }}</p>
        <p v-if="universitySuccess" class="feedback success">{{ universitySuccess }}</p>
      </section>

      <section v-if="activeTab === 'university' && universityAnalysis" class="panel">
        <div class="section-header">
          <div>
            <p class="eyebrow">ANALISIS DE UNIVERSIDAD</p>
            <h2>Universidad detectada</h2>
          </div>
          <div class="badge-row">
            <span class="badge">{{ modeLabel(universityAnalysis.analysisMode) }}</span>
            <span class="confidence" :class="confidenceClass(universityDraft.confidence)">
              {{ confidenceLabel(universityDraft.confidence) }} {{ Math.round(universityDraft.confidence * 100) }}%
            </span>
          </div>
        </div>

        <dl class="summary-list">
          <div>
            <dt>Fuente</dt>
            <dd><a :href="universityAnalysis.sourceUrl" target="_blank" rel="noreferrer">{{ universityAnalysis.sourceUrl }}</a></dd>
          </div>
        </dl>

        <div v-if="universityWarnings.length" class="warning-box">
          <strong>Advertencias</strong>
          <span v-for="warning in universityWarnings" :key="warning">{{ warning }}</span>
        </div>

        <div v-if="universityAnalysis.rejected.length" class="rejected-list">
          <strong>Rechazos del analisis</strong>
          <span v-for="(item, index) in universityAnalysis.rejected" :key="index">{{ rejectionText(item) }}</span>
        </div>

        <form class="draft-form" @submit.prevent="saveUniversity">
          <div class="form-grid">
            <label>
              Nombre
              <input v-model.trim="universityDraft.nombre" type="text" required @input="universityEdited = true" />
            </label>
            <label>
              Naturaleza
              <select v-model="universityDraft.naturaleza" @change="universityEdited = true">
                <option value="publica">Publica</option>
                <option value="privada">Privada</option>
                <option value="mixta">Mixta</option>
                <option value="no_especificada">No especificada</option>
              </select>
            </label>
            <label>
              Pais
              <input v-model.trim="universityDraft.pais" type="text" @input="universityEdited = true" />
            </label>
            <label>
              Departamento
              <input v-model.trim="universityDraft.departamento" type="text" @input="universityEdited = true" />
            </label>
            <label>
              Ciudad
              <input v-model.trim="universityDraft.ciudad" type="text" required @input="universityEdited = true" />
            </label>
            <label>
              Sitio web
              <input v-model.trim="universityDraft.sitioWeb" type="url" @input="universityEdited = true" />
            </label>
            <label>
              Telefono
              <input v-model.trim="universityDraft.telefono" type="text" @input="universityEdited = true" />
            </label>
            <label>
              Email
              <input v-model.trim="universityDraft.email" type="email" @input="universityEdited = true" />
            </label>
            <label class="full-width">
              Direccion
              <input v-model.trim="universityDraft.direccion" type="text" @input="universityEdited = true" />
            </label>
            <label class="full-width">
              Descripcion
              <textarea v-model.trim="universityDraft.descripcion" rows="5" required @input="universityEdited = true" />
            </label>
          </div>

          <label v-if="universityNeedsConfirmation" class="confirm-row">
            <input v-model="confirmLowUniversityConfidence" type="checkbox" />
            <span>Confirmo guardar este borrador revisado aunque la confianza sea baja.</span>
          </label>

          <button class="primary-btn" type="submit" :disabled="savingUniversity || !canSaveUniversity">
            {{ savingUniversity ? 'Guardando...' : 'Guardar universidad' }}
          </button>
        </form>
      </section>

      <section v-if="activeTab === 'program'" class="panel">
        <form class="analyze-form program-form" @submit.prevent="analyzeProgram">
          <label class="wide">
            URL oficial del programa academico
            <input v-model.trim="programUrl" type="url" placeholder="https://www.universidad.edu.co/programas/programa" required />
          </label>
          <label>
            Universidad existente
            <select v-model="selectedUniversityId" required>
              <option value="">Selecciona una universidad</option>
              <option v-for="university in adminStore.universities" :key="university.id" :value="university.id">
                {{ university.nombre }}
              </option>
            </select>
          </label>
          <label class="ai-toggle">
            <input v-model="useProgramAI" type="checkbox" />
            <span>Usar IA</span>
          </label>
          <button class="primary-btn" type="submit" :disabled="programLoading || !selectedUniversityId">
            {{ programLoading ? 'Analizando...' : 'Analizar programa' }}
          </button>
        </form>
        <p class="hint">Para cargar un programa debe existir una universidad seleccionada.</p>
        <p v-if="programError" class="feedback error">{{ programError }}</p>
        <p v-if="programSuccess" class="feedback success">{{ programSuccess }}</p>
      </section>

      <section v-if="activeTab === 'program' && programAnalysis" class="panel">
        <div class="section-header">
          <div>
            <p class="eyebrow">ANALISIS DE PROGRAMA</p>
            <h2>Programa detectado</h2>
            <p class="selected-university">Universidad seleccionada: {{ programAnalysis.universityName }}</p>
          </div>
          <div class="badge-row">
            <span class="badge">{{ modeLabel(programAnalysis.analysisMode) }}</span>
            <span class="confidence" :class="confidenceClass(programDraft.confidence)">
              {{ confidenceLabel(programDraft.confidence) }} {{ Math.round(programDraft.confidence * 100) }}%
            </span>
          </div>
        </div>

        <dl class="summary-list">
          <div>
            <dt>Fuente</dt>
            <dd><a :href="programAnalysis.sourceUrl" target="_blank" rel="noreferrer">{{ programAnalysis.sourceUrl }}</a></dd>
          </div>
        </dl>

        <div v-if="programWarnings.length" class="warning-box">
          <strong>Advertencias</strong>
          <span v-for="warning in programWarnings" :key="warning">{{ warning }}</span>
        </div>

        <div v-if="programAnalysis.rejected.length" class="rejected-list">
          <strong>Rechazos del analisis</strong>
          <span v-for="(item, index) in programAnalysis.rejected" :key="index">{{ rejectionText(item) }}</span>
        </div>

        <form class="draft-form" @submit.prevent="saveProgram">
          <div class="form-grid">
            <label>
              Nombre
              <input v-model.trim="programDraft.nombre" type="text" required @input="programEdited = true" />
            </label>
            <label>
              Nivel
              <select v-model="programDraft.nivel" @change="programEdited = true">
                <option value="pregrado">Pregrado</option>
                <option value="posgrado">Posgrado</option>
                <option value="tecnico">Tecnico</option>
                <option value="tecnologico">Tecnologico</option>
                <option value="especializacion">Especializacion</option>
                <option value="maestria">Maestria</option>
                <option value="doctorado">Doctorado</option>
                <option value="diplomado">Diplomado</option>
                <option value="curso">Curso</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label>
              Modalidad
              <select v-model="programDraft.modalidad" @change="programEdited = true">
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="distancia">Distancia</option>
                <option value="hibrida">Hibrida</option>
                <option value="no_especificada">No especificada</option>
              </select>
            </label>
            <label>
              Ciudad
              <input v-model.trim="programDraft.ciudad" type="text" @input="programEdited = true" />
            </label>
            <label>
              Departamento
              <input v-model.trim="programDraft.departamento" type="text" @input="programEdited = true" />
            </label>
            <label>
              Duracion
              <input v-model.trim="programDraft.duracion" type="text" required @input="programEdited = true" />
            </label>
            <label>
              Creditos
              <input v-model.number="programDraft.creditos" type="number" min="0" @input="programEdited = true" />
            </label>
            <label>
              Titulo otorgado
              <input v-model.trim="programDraft.tituloOtorgado" type="text" @input="programEdited = true" />
            </label>
            <label>
              Facultad
              <input v-model.trim="programDraft.facultad" type="text" @input="programEdited = true" />
            </label>
            <label>
              Costo o matricula
              <input v-model.trim="programDraft.costo" type="text" @input="programEdited = true" />
            </label>
            <label>
              SNIES
              <input v-model.trim="programDraft.snies" type="text" @input="programEdited = true" />
            </label>
            <label>
              Registro calificado
              <input v-model.trim="programDraft.registroCalificado" type="text" @input="programEdited = true" />
            </label>
            <label>
              Acreditacion
              <input v-model.trim="programDraft.acreditacion" type="text" @input="programEdited = true" />
            </label>
            <label class="full-width">
              Descripcion
              <textarea v-model.trim="programDraft.descripcion" rows="4" required @input="programEdited = true" />
            </label>
            <label class="full-width">
              Perfil profesional
              <textarea v-model.trim="programDraft.perfilProfesional" rows="3" @input="programEdited = true" />
            </label>
            <label class="full-width">
              Campo laboral
              <textarea v-model.trim="programDraft.campoLaboral" rows="3" @input="programEdited = true" />
            </label>
            <label class="full-width">
              Requisitos
              <textarea v-model.trim="programDraft.requisitos" rows="3" @input="programEdited = true" />
            </label>
          </div>

          <label v-if="programNeedsConfirmation" class="confirm-row">
            <input v-model="confirmLowProgramConfidence" type="checkbox" />
            <span>Confirmo guardar este borrador revisado aunque la confianza sea baja.</span>
          </label>

          <button class="primary-btn" type="submit" :disabled="savingProgram || !canSaveProgram">
            {{ savingProgram ? 'Guardando...' : 'Guardar programa' }}
          </button>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import api from '@/services/api';
import { useAdminStore } from '@/stores/admin';

type AnalysisMode = 'ai' | 'basic';

type UniversityDraft = {
  nombre: string | null;
  descripcion: string | null;
  pais: string;
  departamento: string | null;
  ciudad: string | null;
  sitioWeb: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  naturaleza: 'publica' | 'privada' | 'mixta' | 'no_especificada';
  confidence: number;
  reasons: string[];
};

type ProgramDraft = {
  nombre: string | null;
  nivel: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico' | 'especializacion' | 'maestria' | 'doctorado' | 'diplomado' | 'curso' | 'otro';
  modalidad: 'presencial' | 'virtual' | 'distancia' | 'hibrida' | 'no_especificada';
  ciudad: string | null;
  departamento: string | null;
  duracion: string | null;
  creditos: number | null;
  tituloOtorgado: string | null;
  facultad: string | null;
  descripcion: string | null;
  perfilProfesional: string | null;
  campoLaboral: string | null;
  requisitos: string | null;
  costo: string | null;
  snies: string | null;
  registroCalificado: string | null;
  acreditacion: string | null;
  confidence: number;
  reasons: string[];
};

type UniversityAnalysis = {
  type: 'university';
  sourceUrl: string;
  analysisMode: AnalysisMode;
  university: UniversityDraft;
  warnings: string[];
  rejected: unknown[];
};

type ProgramAnalysis = {
  type: 'program';
  sourceUrl: string;
  universityId: string;
  universityName: string;
  analysisMode: AnalysisMode;
  program: ProgramDraft;
  warnings: string[];
  rejected: unknown[];
};

const router = useRouter();
const adminStore = useAdminStore();
const activeTab = ref<'university' | 'program'>('university');

const universityUrl = ref('');
const useUniversityAI = ref(true);
const universityLoading = ref(false);
const savingUniversity = ref(false);
const universityError = ref('');
const universitySuccess = ref('');
const universityAnalysis = ref<UniversityAnalysis | null>(null);
const universityEdited = ref(false);
const confirmLowUniversityConfidence = ref(false);
const universityDraft = reactive<UniversityDraft>({
  nombre: null,
  descripcion: null,
  pais: 'Colombia',
  departamento: null,
  ciudad: null,
  sitioWeb: null,
  direccion: null,
  telefono: null,
  email: null,
  naturaleza: 'no_especificada',
  confidence: 0,
  reasons: [],
});

const programUrl = ref('');
const selectedUniversityId = ref('');
const useProgramAI = ref(true);
const programLoading = ref(false);
const savingProgram = ref(false);
const programError = ref('');
const programSuccess = ref('');
const programAnalysis = ref<ProgramAnalysis | null>(null);
const programEdited = ref(false);
const confirmLowProgramConfidence = ref(false);
const programDraft = reactive<ProgramDraft>({
  nombre: null,
  nivel: 'otro',
  modalidad: 'no_especificada',
  ciudad: null,
  departamento: null,
  duracion: null,
  creditos: null,
  tituloOtorgado: null,
  facultad: null,
  descripcion: null,
  perfilProfesional: null,
  campoLaboral: null,
  requisitos: null,
  costo: null,
  snies: null,
  registroCalificado: null,
  acreditacion: null,
  confidence: 0,
  reasons: [],
});

const universityWarnings = computed(() => {
  const warnings = [...(universityAnalysis.value?.warnings || [])];
  if (universityDraft.reasons.length) warnings.push(...universityDraft.reasons.map((item) => `Razon: ${item}`));
  return [...new Set(warnings)];
});

const programWarnings = computed(() => {
  const warnings = [...(programAnalysis.value?.warnings || [])];
  if (programDraft.reasons.length) warnings.push(...programDraft.reasons.map((item) => `Razon: ${item}`));
  return [...new Set(warnings)];
});

const universityNeedsConfirmation = computed(() => universityDraft.confidence < 0.6 && !universityEdited.value);
const programNeedsConfirmation = computed(() => programDraft.confidence < 0.6 && !programEdited.value);

const canSaveUniversity = computed(() => {
  const hasRequired = Boolean(universityDraft.nombre && universityDraft.descripcion && universityDraft.ciudad);
  return hasRequired && (!universityNeedsConfirmation.value || confirmLowUniversityConfidence.value);
});

const canSaveProgram = computed(() => {
  const hasRequired = Boolean(selectedUniversityId.value && programDraft.nombre && programDraft.descripcion && programDraft.duracion);
  return hasRequired && (!programNeedsConfirmation.value || confirmLowProgramConfidence.value);
});

onMounted(async () => {
  try {
    await adminStore.fetchUniversities();
  } catch {
    programError.value = 'No se pudieron cargar las universidades existentes.';
  }
});

const applyUniversityDraft = (draft: UniversityDraft) => {
  Object.assign(universityDraft, {
    ...draft,
    pais: draft.pais || 'Colombia',
    naturaleza: draft.naturaleza || 'no_especificada',
    confidence: Number(draft.confidence || 0),
    reasons: Array.isArray(draft.reasons) ? draft.reasons : [],
  });
};

const applyProgramDraft = (draft: ProgramDraft) => {
  Object.assign(programDraft, {
    ...draft,
    nivel: draft.nivel || 'otro',
    modalidad: draft.modalidad || 'no_especificada',
    confidence: Number(draft.confidence || 0),
    reasons: Array.isArray(draft.reasons) ? draft.reasons : [],
  });
};

const analyzeUniversity = async () => {
  universityLoading.value = true;
  universityError.value = '';
  universitySuccess.value = '';
  universityAnalysis.value = null;
  universityEdited.value = false;
  confirmLowUniversityConfidence.value = false;
  try {
    const response = await api.post('/import-assistant/analyze-university', {
      url: universityUrl.value,
      useAI: useUniversityAI.value,
    }, { timeout: 70000 });
    const data = response.data.data as UniversityAnalysis;
    universityAnalysis.value = data;
    applyUniversityDraft(data.university);
  } catch (error) {
    universityError.value = getErrorMessage(error);
  } finally {
    universityLoading.value = false;
  }
};

const analyzeProgram = async () => {
  const selectedUniversity = adminStore.universities.find((item) => item.id === selectedUniversityId.value);
  if (!selectedUniversity) {
    programError.value = 'Selecciona una universidad antes de analizar el programa.';
    return;
  }

  programLoading.value = true;
  programError.value = '';
  programSuccess.value = '';
  programAnalysis.value = null;
  programEdited.value = false;
  confirmLowProgramConfidence.value = false;
  try {
    const response = await api.post('/import-assistant/analyze-program', {
      url: programUrl.value,
      universityId: selectedUniversity.id,
      universityName: selectedUniversity.nombre,
      useAI: useProgramAI.value,
    }, { timeout: 70000 });
    const data = response.data.data as ProgramAnalysis;
    programAnalysis.value = data;
    applyProgramDraft(data.program);
  } catch (error) {
    programError.value = getErrorMessage(error);
  } finally {
    programLoading.value = false;
  }
};

const saveUniversity = async () => {
  if (!universityAnalysis.value || !canSaveUniversity.value) return;
  savingUniversity.value = true;
  universityError.value = '';
  universitySuccess.value = '';
  try {
    await adminStore.createUniversity({
      nombre: universityDraft.nombre || '',
      descripcion: universityDraft.descripcion || '',
      ciudad: universityDraft.ciudad || '',
      fuenteUrl: universityAnalysis.value.sourceUrl,
      fuenteNombre: universityDraft.nombre || undefined,
    });
    universitySuccess.value = 'Universidad guardada para revision.';
    await adminStore.fetchUniversities();
  } catch (error) {
    universityError.value = getErrorMessage(error);
  } finally {
    savingUniversity.value = false;
  }
};

const saveProgram = async () => {
  if (!programAnalysis.value || !canSaveProgram.value) return;
  savingProgram.value = true;
  programError.value = '';
  programSuccess.value = '';
  try {
    await adminStore.createProgram({
      nombre: programDraft.nombre || '',
      descripcion: programDraft.descripcion || '',
      precio: parsePrice(programDraft.costo),
      modalidad: programDraft.modalidad === 'no_especificada' ? 'No especificada' : modalityLabel(programDraft.modalidad),
      duracion: programDraft.duracion || 'No especificada',
      universidadId: selectedUniversityId.value,
      fuenteUrl: programAnalysis.value.sourceUrl,
      fuenteNombre: programDraft.nombre || undefined,
    });
    programSuccess.value = 'Programa guardado para revision.';
  } catch (error) {
    programError.value = getErrorMessage(error);
  } finally {
    savingProgram.value = false;
  }
};

const parsePrice = (value: string | null) => {
  if (!value) return 0;
  const normalized = value.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const modalityLabel = (value: ProgramDraft['modalidad']) => {
  const labels: Record<ProgramDraft['modalidad'], string> = {
    presencial: 'Presencial',
    virtual: 'Virtual',
    distancia: 'Distancia',
    hibrida: 'Hibrida',
    no_especificada: 'No especificada',
  };
  return labels[value];
};

const modeLabel = (mode: AnalysisMode) => mode === 'ai' ? 'IA' : 'Basico';

const confidenceLabel = (value: number) => {
  if (value >= 0.75) return 'Alta';
  if (value >= 0.45) return 'Media';
  return 'Baja';
};

const confidenceClass = (value: number) => ({
  high: value >= 0.75,
  medium: value >= 0.45 && value < 0.75,
  low: value < 0.45,
});

const rejectionText = (item: unknown) => {
  if (!item || typeof item !== 'object') return String(item);
  const record = item as Record<string, unknown>;
  return [record.field, record.value, record.reason].filter(Boolean).join(' - ');
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || 'Error interno del servidor';
  }
  return error instanceof Error ? error.message : 'Error interno del servidor';
};

const goBack = () => router.push({ name: 'admin' });
</script>

<style scoped>
.assistant-page {
  display: grid;
  gap: 24px;
  padding: 32px;
}

.page-header,
.panel {
  border: 1px solid #d7e0ee;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgb(15 23 42 / 6%);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.page-header h1,
.section-header h2 {
  margin: 0;
  color: #081833;
}

.page-header p {
  margin: 8px 0 0;
  color: #526985;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #d7e0ee;
}

.tabs button {
  min-height: 44px;
  border: 1px solid #d7e0ee;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #eef4ff;
  color: #334155;
  font-weight: 800;
  padding: 0 18px;
  cursor: pointer;
}

.tabs button.active {
  background: #2563eb;
  color: #fff;
}

.panel {
  padding: 24px;
}

.analyze-form,
.program-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(220px, 320px) auto auto;
  gap: 16px;
  align-items: end;
}

.analyze-form .wide {
  grid-column: span 2;
}

label {
  display: grid;
  gap: 8px;
  color: #0f172a;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cfd9e8;
  border-radius: 8px;
  color: #0f172a;
  font: inherit;
  padding: 12px 14px;
}

textarea {
  resize: vertical;
}

.ai-toggle,
.confirm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.ai-toggle input,
.confirm-row input {
  width: auto;
}

.primary-btn,
.ghost-btn {
  min-height: 44px;
  border-radius: 8px;
  font-weight: 900;
  padding: 0 20px;
  cursor: pointer;
}

.primary-btn {
  border: 0;
  background: #2563eb;
  color: #fff;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ghost-btn {
  border: 1px solid #d7e0ee;
  background: #fff;
  color: #0f172a;
}

.hint,
.selected-university {
  color: #526985;
}

.feedback {
  border-radius: 8px;
  padding: 14px 16px;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.badge,
.confidence {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 900;
  padding: 0 12px;
}

.badge {
  background: #e0ecff;
  color: #1d4ed8;
}

.confidence.high {
  background: #dcfce7;
  color: #166534;
}

.confidence.medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence.low {
  background: #fee2e2;
  color: #991b1b;
}

.summary-list {
  display: grid;
  gap: 10px;
}

.summary-list div {
  display: grid;
  gap: 4px;
}

.summary-list dt {
  color: #526985;
  font-weight: 800;
}

.summary-list dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.warning-box,
.rejected-list {
  display: grid;
  gap: 8px;
  border-radius: 8px;
  margin: 16px 0;
  padding: 14px 16px;
}

.warning-box {
  background: #fff7ed;
  color: #9a3412;
}

.rejected-list {
  background: #fef2f2;
  color: #991b1b;
}

.draft-form {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .assistant-page {
    padding: 20px;
  }

  .page-header,
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .analyze-form,
  .program-form,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .analyze-form .wide {
    grid-column: auto;
  }

  .tabs {
    flex-direction: column;
  }

  .tabs button {
    border: 1px solid #d7e0ee;
    border-radius: 8px;
  }
}
</style>
