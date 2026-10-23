<template>
  <div class="notifications-bell">
    <button
      class="bell-button"
      type="button"
      aria-label="Notificaciones"
      title="Notificaciones"
      @click="toggleDropdown"
    >
      <span class="bell-icon" aria-hidden="true">🔔</span>
      <span v-if="notificationsStore.unreadCount > 0" class="bell-badge">
        {{ notificationCountLabel }}
      </span>
    </button>

    <section v-if="open" class="notifications-menu">
      <header class="menu-header">
        <strong>Notificaciones</strong>
        <button
          type="button"
          class="text-btn"
          :disabled="notificationsStore.loading || notificationsStore.unreadCount === 0"
          @click="markAll"
        >
          Marcar todas
        </button>
      </header>

      <p v-if="visibleError" class="menu-error">{{ visibleError }}</p>
      <div v-if="notificationsStore.loading && notificationsStore.notifications.length === 0" class="menu-empty">
        Cargando...
      </div>
      <div v-else-if="notificationsStore.notifications.length === 0" class="menu-empty">
        No tienes notificaciones.
      </div>

      <button
        v-for="notification in notificationsStore.notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.leida }"
        type="button"
        @click="openNotification(notification)"
      >
        <span class="item-title">{{ notification.titulo }}</span>
        <span class="item-message">{{ notification.mensaje }}</span>
        <span class="item-date">{{ formatDate(notification.fecha) }}</span>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  useNotificationsStore,
  type NotificationItem,
} from '@/stores/notifications';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const open = ref(false);
const visibleError = computed(() => {
  const message = notificationsStore.error || '';
  if (/token\s+expirado/i.test(message)) {
    return '';
  }

  return message;
});
const notificationCountLabel = computed(() =>
  notificationsStore.unreadCount > 99 ? '99+' : String(notificationsStore.unreadCount)
);

const loadNotifications = async () => {
  if (!authStore.isAuthenticated) return;
  await Promise.allSettled([
    notificationsStore.fetchNotifications({ limit: 8 }),
    notificationsStore.fetchUnreadCount(),
  ]);
};

const toggleDropdown = async () => {
  open.value = !open.value;
  if (open.value) {
    await loadNotifications();
  }
};

const markAll = async () => {
  await notificationsStore.markAllAsRead();
};

const openNotification = async (notification: NotificationItem) => {
  if (!notification.leida) {
    await notificationsStore.markAsRead(notification.id);
  }

  open.value = false;

  if (notification.entidadTipo === 'programa') {
    const role = authStore.user?.role?.toUpperCase();
    if (role === 'UNIVERSITY') {
      router.push('/universidad/programas');
      return;
    }

    if (['SUPERADMIN', 'ADMIN', 'ASESOR'].includes(role || '')) {
      router.push('/admin/programas');
    }
  }

  if (notification.entidadTipo === 'beca') {
    const role = authStore.user?.role?.toUpperCase();
    if (role === 'UNIVERSITY') {
      router.push('/universidad/becas');
      return;
    }

    if (['SUPERADMIN', 'ADMIN', 'ASESOR'].includes(role || '')) {
      router.push('/admin/becas');
      return;
    }

    router.push('/becas');
  }
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      await loadNotifications();
    } else {
      open.value = false;
    }
  }
);

onMounted(loadNotifications);
</script>

<style scoped>
.notifications-bell {
  position: relative;
}

.bell-button {
  align-items: center;
  background: #e2e8f0;
  border: 0;
  border-radius: 999px;
  color: #1e293b;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  height: 44px;
  justify-content: center;
  padding: 0;
  position: relative;
  width: 44px;
}

.bell-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.bell-badge {
  background: #dc2626;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1;
  min-width: 20px;
  padding: 3px 5px;
  position: absolute;
  right: -6px;
  text-align: center;
  top: -6px;
}

.notifications-menu {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  max-height: 420px;
  min-width: 320px;
  overflow-y: auto;
  padding: 10px;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 80;
}

.menu-header {
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  padding: 6px 6px 10px;
}

.text-btn {
  background: transparent;
  border: 0;
  color: #2563eb;
  cursor: pointer;
  font-weight: 800;
}

.text-btn:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.notification-item {
  background: transparent;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  display: grid;
  gap: 3px;
  padding: 10px 6px;
  text-align: left;
  width: 100%;
}

.notification-item.unread {
  background: #eff6ff;
}

.item-title {
  color: #0f172a;
  font-weight: 800;
}

.item-message {
  color: #475569;
  display: -webkit-box;
  font-size: 0.9rem;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-date,
.menu-empty,
.menu-error {
  color: #64748b;
  font-size: 0.82rem;
}

.menu-empty,
.menu-error {
  padding: 14px 6px;
}

.menu-error {
  color: #991b1b;
}

@media (max-width: 640px) {
  .notifications-menu {
    min-width: min(320px, calc(100vw - 32px));
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
