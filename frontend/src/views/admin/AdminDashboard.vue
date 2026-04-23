<template>
  <main class="admin-dashboard">
    <section class="dashboard-header">
      <div>
        <p class="eyebrow">Panel SUPERADMIN</p>
        <h1>Administracion de usuarios</h1>
        <p class="subtitle">Crea administradores y asesores, revisa usuarios y cambia roles operativos.</p>
      </div>
      <button class="secondary-btn" type="button" @click="refreshUsers" :disabled="adminUsers.loading">
        Actualizar
      </button>
    </section>

    <section v-if="!authStore.isSuperAdmin" class="access-card">
      <h2>Acceso restringido</h2>
      <p>Esta vista solo esta disponible para usuarios SUPERADMIN.</p>
      <button class="primary-btn" type="button" @click="router.push('/')">Volver al inicio</button>
    </section>

    <template v-else>
      <section class="stats-grid">
        <article class="stat-card">
          <span>Total usuarios</span>
          <strong>{{ adminUsers.totalUsers }}</strong>
        </article>
        <article class="stat-card">
          <span>Admins</span>
          <strong>{{ roleCount('ADMIN') }}</strong>
        </article>
        <article class="stat-card">
          <span>Asesores</span>
          <strong>{{ roleCount('ASESOR') }}</strong>
        </article>
        <article class="stat-card">
          <span>Universidades</span>
          <strong>{{ roleCount('UNIVERSITY') }}</strong>
        </article>
      </section>

      <section class="forms-grid">
        <form class="panel" @submit.prevent="submitCreateAdmin">
          <h2>Crear ADMIN</h2>
          <label>
            Nombre
            <input v-model.trim="adminForm.name" type="text" autocomplete="name" required />
          </label>
          <label>
            Email
            <input v-model.trim="adminForm.email" type="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input v-model="adminForm.password" type="password" autocomplete="new-password" minlength="8" required />
          </label>
          <button class="primary-btn" type="submit" :disabled="adminUsers.loading">
            Crear ADMIN
          </button>
        </form>

        <form class="panel" @submit.prevent="submitCreateAsesor">
          <h2>Crear ASESOR</h2>
          <label>
            Nombre
            <input v-model.trim="asesorForm.name" type="text" autocomplete="name" required />
          </label>
          <label>
            Email
            <input v-model.trim="asesorForm.email" type="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input v-model="asesorForm.password" type="password" autocomplete="new-password" minlength="8" required />
          </label>
          <button class="primary-btn" type="submit" :disabled="adminUsers.loading">
            Crear ASESOR
          </button>
        </form>
      </section>

      <p v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</p>
      <p v-if="adminUsers.error" class="feedback error">{{ adminUsers.error }}</p>

      <section class="panel">
        <div class="table-header">
          <div>
            <h2>Usuarios</h2>
            <p>Solo SUPERADMIN puede cambiar roles desde esta tabla.</p>
          </div>
          <input v-model.trim="search" class="search-input" type="search" placeholder="Buscar por nombre o email" />
        </div>

        <div v-if="adminUsers.loading && adminUsers.users.length === 0" class="state">
          Cargando usuarios...
        </div>

        <div v-else-if="filteredUsers.length === 0" class="state">
          No hay usuarios para mostrar.
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol actual</th>
                <th>Nuevo rol</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge">{{ user.role }}</span>
                </td>
                <td>
                  <select
                    :value="user.role"
                    :disabled="adminUsers.loading || user.role === 'SUPERADMIN'"
                    @change="changeRole(user.id, ($event.target as HTMLSelectElement).value as UserRole)"
                  >
                    <option v-for="role in editableRoles" :key="role" :value="role">
                      {{ role }}
                    </option>
                  </select>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAdminUsersStore } from '@/stores/adminUsers';
import type { UserRole } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const adminUsers = useAdminUsersStore();

const editableRoles: UserRole[] = ['USER', 'UNIVERSITY', 'ASESOR', 'ADMIN'];

const adminForm = reactive({
  name: '',
  email: '',
  password: '',
});

const asesorForm = reactive({
  name: '',
  email: '',
  password: '',
});

const search = ref('');
const feedback = ref('');
const feedbackType = ref<'success' | 'error'>('success');

const filteredUsers = computed(() => {
  const term = search.value.toLowerCase();

  if (!term) {
    return adminUsers.users;
  }

  return adminUsers.users.filter((user) => {
    return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
  });
});

const roleCount = (role: UserRole) => {
  return adminUsers.users.filter((user) => user.role === role).length;
};

const setFeedback = (message: string, type: 'success' | 'error' = 'success') => {
  feedback.value = message;
  feedbackType.value = type;
};

const resetForm = (form: typeof adminForm) => {
  form.name = '';
  form.email = '';
  form.password = '';
};

const refreshUsers = async () => {
  const result = await adminUsers.fetchUsers();
  if (!result.success) {
    setFeedback(result.error || 'No se pudieron cargar los usuarios', 'error');
  }
};

const submitCreateAdmin = async () => {
  const result = await adminUsers.createAdmin({ ...adminForm });
  if (result.success) {
    resetForm(adminForm);
    setFeedback('ADMIN creado correctamente');
    return;
  }

  setFeedback(result.error || 'No se pudo crear el ADMIN', 'error');
};

const submitCreateAsesor = async () => {
  const result = await adminUsers.createAsesor({ ...asesorForm });
  if (result.success) {
    resetForm(asesorForm);
    setFeedback('ASESOR creado correctamente');
    return;
  }

  setFeedback(result.error || 'No se pudo crear el ASESOR', 'error');
};

const changeRole = async (userId: string, role: UserRole) => {
  const result = await adminUsers.changeRole(userId, role);
  if (result.success) {
    setFeedback('Rol actualizado correctamente');
    return;
  }

  setFeedback(result.error || 'No se pudo cambiar el rol', 'error');
};

const formatDate = (date?: Date | string) => {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
};

onMounted(async () => {
  authStore.checkAuth();

  if (!authStore.isSuperAdmin) {
    return;
  }

  await refreshUsers();
});
</script>

<style scoped>
.admin-dashboard {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
  color: #172033;
}

.dashboard-header,
.table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: 2rem;
}

h2 {
  margin-bottom: 16px;
  font-size: 1.15rem;
}

.subtitle,
.table-header p,
.access-card p {
  color: #64748b;
}

.stats-grid,
.forms-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.forms-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel,
.stat-card,
.access-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.panel,
.access-card {
  padding: 20px;
}

.stat-card {
  padding: 18px;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 0.88rem;
}

.stat-card strong {
  display: block;
  margin-top: 6px;
  font-size: 1.8rem;
}

label {
  display: block;
  margin-bottom: 14px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}

input,
select {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #172033;
  font: inherit;
}

.search-input {
  max-width: 280px;
  margin-top: 0;
}

.primary-btn,
.secondary-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 11px 16px;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.secondary-btn {
  background: #e2e8f0;
  color: #1e293b;
}

button:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.feedback {
  margin: 0 0 16px;
  border-radius: 6px;
  padding: 12px 14px;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #475569;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.role-badge {
  display: inline-block;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 9px;
}

.state {
  color: #64748b;
  padding: 28px 0;
  text-align: center;
}

@media (max-width: 860px) {
  .dashboard-header,
  .table-header {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid,
  .forms-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    max-width: none;
  }
}
</style>
