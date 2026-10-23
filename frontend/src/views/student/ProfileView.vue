<template>
  <StudentAccountLayout>
    <section class="student-header">
      <div>
        <p class="eyebrow">Mi perfil</p>
        <h1>Tu plan y preferencias</h1>
      </div>
      <RouterLink class="primary-link accent" to="/student/plans">{{ upgradeLabel }}</RouterLink>
    </section>

    <section class="student-plan-alert" :class="plan">
      <strong>{{ alertTitle }}</strong>
      <p>{{ alertText }}</p>
    </section>

    <section class="plan-summary-grid">
      <StudentPlanCard :plan-info="planInfo" />
      <article class="student-card">
        <span>Limites usados</span>
        <h2>{{ usageHeadline }}</h2>
        <div class="usage-list">
          <PlanUsageBar label="Favoritos" :used="usage.favorites" :limit="limits.favorites" hint="BASIC amplia tus favoritos. PLUS los vuelve ilimitados." />
          <PlanUsageBar label="Comparaciones" :used="usage.comparisons" :limit="limits.comparisons" hint="Compara mas opciones para decidir con menos friccion." />
        </div>
      </article>
    </section>

    <section class="student-section">
      <div class="section-title">
        <h2>Beneficios de tu plan</h2>
        <RouterLink to="/student/plans">Comparar planes</RouterLink>
      </div>
      <div class="benefits-grid">
        <article class="student-card">
          <span>Beneficios activos</span>
          <ul class="feature-checklist">
            <li v-for="feature in activeFeatures" :key="feature">
              <strong>✓</strong>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </article>
        <article class="student-card">
          <span>Funciones premium disponibles</span>
          <ul class="feature-checklist">
            <li v-for="feature in premiumAvailable" :key="feature">
              <strong>✓</strong>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </article>
        <article class="student-card locked-panel">
          <span>Funciones bloqueadas</span>
          <ul class="feature-checklist">
            <li v-for="feature in lockedFeatures" :key="feature.label" class="locked">
              <strong>×</strong>
              <span>{{ feature.label }}</span>
              <small>{{ feature.requiredPlan }}</small>
            </li>
          </ul>
          <div v-if="lockedFeatures.length" class="actions">
            <RouterLink v-if="plan === 'free'" class="primary-link" to="/student/plans">Mejorar a BASIC</RouterLink>
            <RouterLink v-if="plan !== 'plus'" class="primary-link accent" to="/student/plans">Mejorar a PLUS</RouterLink>
          </div>
          <p v-else>Todo desbloqueado. Tienes acceso prioritario y asesoria personalizada.</p>
        </article>
      </div>
    </section>

    <section class="student-section">
      <div class="section-title">
        <h2>Preferencias de busqueda</h2>
        <RouterLink to="/student">Ver recomendaciones</RouterLink>
      </div>
      <form class="form-grid" @submit.prevent="save">
        <label>
          Intereses
          <input v-model="form.interesesText" placeholder="IA, medicina, finanzas" />
        </label>
        <label>
          Areas de interes
          <input v-model="form.areasText" placeholder="ingenieria, salud, derecho" />
        </label>
        <label>
          Ciudades preferidas
          <input v-model="form.ciudadesText" placeholder="Bogota, Medellin, Cali" />
        </label>
        <label>
          Presupuesto maximo
          <input v-model.number="form.presupuestoMax" min="0" type="number" />
        </label>
        <label>
          Modalidad
          <select v-model="form.modalidadPreferida">
            <option :value="null">Sin preferencia</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="distancia">Distancia</option>
            <option value="hibrida">Hibrida</option>
          </select>
        </label>
        <label>
          Nivel
          <select v-model="form.nivelInteres">
            <option :value="null">Sin preferencia</option>
            <option value="pregrado">Pregrado</option>
            <option value="posgrado">Posgrado</option>
            <option value="tecnico">Tecnico</option>
            <option value="tecnologico">Tecnologico</option>
          </select>
        </label>
        <button class="submit-btn" type="submit">Guardar preferencias</button>
        <p v-if="message" class="success">{{ message }}</p>
      </form>
    </section>
  </StudentAccountLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import PlanUsageBar from '@/components/student/PlanUsageBar.vue';
import StudentAccountLayout from '@/components/student/StudentAccountLayout.vue';
import StudentPlanCard from '@/components/student/StudentPlanCard.vue';
import { useStudentStore, type StudentProfile } from '@/stores/student';

const studentStore = useStudentStore();
const { planInfo, plan, limits, usage } = storeToRefs(studentStore);
const message = ref('');
const form = reactive({
  interesesText: '',
  areasText: '',
  ciudadesText: '',
  presupuestoMax: null as number | null,
  modalidadPreferida: null as StudentProfile['modalidadPreferida'],
  nivelInteres: null as StudentProfile['nivelInteres'],
});

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const upgradeLabel = computed(() => plan.value === 'free' ? 'Mejorar a BASIC' : plan.value === 'basic' ? 'Mejorar a PLUS' : 'PLUS activo');
const usageHeadline = computed(() => `${usage.value.favorites} favoritos y ${usage.value.comparisons} comparaciones`);

const alertTitle = computed(() => {
  if (plan.value === 'plus') return 'Tu plan PLUS esta activo';
  if (plan.value === 'basic') return 'Plan Basico activo';
  return 'Estas usando el plan gratuito';
});

const alertText = computed(() => {
  if (plan.value === 'plus') return 'Tienes acceso prioritario, asesoria personalizada e insights avanzados.';
  if (plan.value === 'basic') return 'Ya tienes beneficios avanzados. Sube a PLUS para recibir asesoria personalizada.';
  return 'Mejora tu plan para acceder a mas favoritos, comparaciones, alertas y asesoria.';
});

const activeFeatures = computed(() => {
  if (plan.value === 'plus') {
    return ['Favoritos ilimitados', '10 comparaciones', 'Recomendaciones inteligentes', 'Alertas', 'Asesoria personalizada', 'Insights avanzados'];
  }
  if (plan.value === 'basic') {
    return ['30 favoritos', '5 comparaciones', 'Alertas', 'Contacto asesor', 'Recomendaciones mejoradas'];
  }
  return ['10 favoritos', '3 comparaciones', 'Recomendaciones basicas'];
});

const premiumAvailable = computed(() => {
  if (plan.value === 'plus') return ['Todo desbloqueado', 'Prioridad en resultados', 'Seguimiento de proceso'];
  if (plan.value === 'basic') return ['Alertas activas', 'Contacto asesor', 'Mas capacidad de decision'];
  return ['Mejora a BASIC para activar alertas', 'Mejora a PLUS para ver coincidencias exactas'];
});

const lockedFeatures = computed(() => {
  if (plan.value === 'plus') return [];
  if (plan.value === 'basic') {
    return [
      { label: 'Asesoria personalizada', requiredPlan: 'PLUS' },
      { label: 'Prioridad en resultados', requiredPlan: 'PLUS' },
      { label: 'Insights avanzados', requiredPlan: 'PLUS' },
    ];
  }
  return [
    { label: 'Mas de 10 favoritos', requiredPlan: 'BASIC' },
    { label: 'Mas de 3 comparaciones', requiredPlan: 'BASIC' },
    { label: 'Alertas', requiredPlan: 'BASIC' },
    { label: 'Contacto asesor', requiredPlan: 'BASIC' },
    { label: 'Recomendaciones inteligentes', requiredPlan: 'PLUS' },
    { label: 'Insights avanzados', requiredPlan: 'PLUS' },
  ];
});

onMounted(async () => {
  const profile = await studentStore.fetchProfile();
  await studentStore.fetchPlan();
  form.interesesText = profile.intereses.join(', ');
  form.areasText = profile.areasInteres.join(', ');
  form.ciudadesText = profile.ciudadesPreferidas.join(', ');
  form.presupuestoMax = profile.presupuestoMax;
  form.modalidadPreferida = profile.modalidadPreferida;
  form.nivelInteres = profile.nivelInteres;
});

const save = async () => {
  await studentStore.updateProfile({
    intereses: splitList(form.interesesText),
    areasInteres: splitList(form.areasText),
    ciudadesPreferidas: splitList(form.ciudadesText),
    presupuestoMax: form.presupuestoMax,
    modalidadPreferida: form.modalidadPreferida,
    nivelInteres: form.nivelInteres,
    paisInteres: 'Colombia',
    idiomaPreferido: 'es',
  });
  message.value = 'Preferencias guardadas';
};
</script>

<style scoped src="./student.css"></style>
