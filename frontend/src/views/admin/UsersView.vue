<template>
  <main class="admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SUPERADMIN</p>
        <h1>Usuarios</h1>
        <p>Crear administradores y asesores, listar usuarios y cambiar roles.</p>
      </div>
      <button class="ghost-btn" type="button" @click="router.push('/admin')">Dashboard</button>
    </header>

    <section class="toolbar">
      <input v-model.trim="search" type="search" placeholder="Buscar usuario" />
      <div class="toolbar-actions">
        <button type="button" class="primary-btn" @click="openModal('ADMIN')">Crear Admin</button>
        <button type="button" class="primary-btn" @click="openModal('ASESOR')">Crear Asesor</button>
      </div>
    </section>

    <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    <p v-if="adminStore.error" class="feedback error">{{ adminStore.error }}</p>

    <section class="panel">
      <div v-if="adminStore.loading && adminStore.users.length === 0" class="state">Cargando usuarios...</div>
      <div v-else-if="filteredUsers.length === 0" class="state">No hay usuarios para mostrar.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Cambiar rol</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td><span class="badge">{{ user.role }}</span></td>
              <td>
                <select
                  :value="user.role"
                  :disabled="adminStore.loading || user.role === 'SUPERADMIN'"
                  @change="changeRole(user.id, ($event.target as HTMLSelectElement).value as UserRole)"
                >
                  <option v-for="role in editableRoles" :key="role" :value="role">{{ role }}</option>
                </select>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="ghost-btn" type="button" @click="editUser(user)">Editar</button>
                  <button class="danger-btn" type="button" @click="removeUser(user.id)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal" @submit.prevent="submitUser">
        <h2>Crear {{ modalRole }}</h2>
        <label>
          Nombre
          <input v-model.trim="form.name" type="text" required />
        </label>
        <label>
          Email
          <input v-model.trim="form.email" type="email" required />
        </label>
        <label>
          Password
          <input v-model="form.password" type="password" minlength="8" required />
        </label>
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeModal">Cancelar</button>
          <button class="primary-btn" type="submit" :disabled="adminStore.loading">Guardar</button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import type { User, UserRole } from '@/types';

const router = useRouter();
const adminStore = useAdminStore();
const editableRoles: UserRole[] = ['USER', 'UNIVERSITY', 'ASESOR', 'ADMIN'];

const search = ref('');
const showModal = ref(false);
const modalRole = ref<'ADMIN' | 'ASESOR'>('ADMIN');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const form = reactive({ name: '', email: '', password: '' });

const filteredUsers = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return adminStore.users;
  return adminStore.users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term)
  );
});

const setMessage = (text: string, type: 'success' | 'error' = 'success') => {
  message.value = text;
  messageType.value = type;
};

const openModal = (role: 'ADMIN' | 'ASESOR') => {
  modalRole.value = role;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  form.name = '';
  form.email = '';
  form.password = '';
};

const submitUser = async () => {
  try {
    if (modalRole.value === 'ADMIN') {
      await adminStore.createAdmin({ ...form });
    } else {
      await adminStore.createAsesor({ ...form });
    }
    setMessage(`${modalRole.value} creado correctamente`);
    closeModal();
  } catch {
    setMessage(adminStore.error || 'No se pudo crear el usuario', 'error');
  }
};

const changeRole = async (userId: string, role: UserRole) => {
  try {
    await adminStore.changeUserRole(userId, role);
    setMessage('Rol actualizado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo cambiar el rol', 'error');
  }
};

const editUser = async (user: User) => {
  const name = window.prompt('Nombre del usuario', user.name);
  if (name === null) return;

  const email = window.prompt('Email del usuario', user.email);
  if (email === null) return;

  const password = window.prompt('Nueva password opcional. Deja vacio para conservarla.', '');

  try {
    await adminStore.updateUser(user.id, {
      name,
      email,
      role: user.role === 'SUPERADMIN' ? undefined : user.role,
      password: password || undefined,
    });
    setMessage('Usuario actualizado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo actualizar el usuario', 'error');
  }
};

const removeUser = async (userId: string) => {
  const confirmed = window.confirm('Seguro que deseas eliminar este usuario?');
  if (!confirmed) return;

  try {
    await adminStore.deleteUser(userId);
    setMessage('Usuario eliminado correctamente');
  } catch {
    setMessage(adminStore.error || 'No se pudo eliminar el usuario', 'error');
  }
};

const formatDate = (value?: Date | string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-CO').format(new Date(value));
};

onMounted(() => {
  adminStore.fetchUsers();
});
</script>

<style scoped>
.admin-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.page-header,
.toolbar,
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.page-header,
.toolbar {
  margin-bottom: 18px;
}

.eyebrow {
  color: #2563eb;
  font-weight: 800;
  margin: 0 0 6px;
}

h1,
h2,
p {
  margin-top: 0;
}

.toolbar input {
  max-width: 320px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.panel,
.modal {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
  padding: 10px 12px;
}

label {
  display: block;
  font-weight: 700;
  margin-bottom: 14px;
}

label input {
  display: block;
  margin-top: 6px;
  width: 100%;
}

.primary-btn,
.ghost-btn,
.danger-btn {
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 14px;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.ghost-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.danger-btn {
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
}

.badge {
  background: #eef2ff;
  border-radius: 999px;
  color: #3730a3;
  font-weight: 800;
  padding: 4px 9px;
}

.feedback,
.state {
  border-radius: 6px;
  margin-bottom: 16px;
  padding: 12px 14px;
}

.state {
  color: #64748b;
  text-align: center;
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.52);
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal {
  max-width: 420px;
  width: 100%;
}

@media (max-width: 760px) {
  .page-header,
  .toolbar,
  .modal-actions {
    flex-direction: column;
  }

  .toolbar input {
    max-width: none;
  }
}
</style>
