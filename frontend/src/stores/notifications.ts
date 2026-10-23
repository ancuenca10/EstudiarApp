import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';

export type NotificationItem = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'programa_aprobado' | 'programa_rechazado' | 'sistema' | string;
  entidadTipo?: string | null;
  entidadId?: string | null;
  leida: boolean;
  fecha: string;
};

type FetchNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
};

const unwrapList = <T>(payload: unknown, keys: string[]): T[] => {
  const value = payload as Record<string, unknown>;
  const nested = value?.data as Record<string, unknown> | undefined;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key] as T[];
    if (Array.isArray(nested?.[key])) return nested[key] as T[];
  }

  if (Array.isArray(value?.data)) return value.data as T[];
  return [];
};

const unwrapOne = <T>(payload: unknown, keys: string[]): T => {
  const value = payload as Record<string, unknown>;
  const nested = value?.data as Record<string, unknown> | undefined;

  for (const key of keys) {
    if (value?.[key]) return value[key] as T;
    if (nested?.[key]) return nested[key] as T;
  }

  return payload as T;
};

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const hasUnread = computed(() => unreadCount.value > 0);

  const run = async <T>(task: () => Promise<T>, fallbackMessage: string) => {
    try {
      loading.value = true;
      error.value = null;
      return await task();
    } catch (err) {
      error.value = err instanceof Error ? err.message : fallbackMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchNotifications = async (options: FetchNotificationsOptions = {}) => {
    return run(async () => {
      const response = await api.get('/notifications', {
        params: {
          unreadOnly: options.unreadOnly || undefined,
          limit: options.limit || 20,
        },
      });
      notifications.value = unwrapList<NotificationItem>(response.data, ['notifications']);
      return notifications.value;
    }, 'No se pudieron cargar las notificaciones');
  };

  const fetchUnreadCount = async () => {
    return run(async () => {
      const response = await api.get('/notifications/unread-count');
      unreadCount.value = Number((response.data as { count?: number }).count || 0);
      return unreadCount.value;
    }, 'No se pudo cargar el contador de notificaciones');
  };

  const markAsRead = async (id: string) => {
    return run(async () => {
      const response = await api.patch(`/notifications/${id}/read`);
      const notification = unwrapOne<NotificationItem>(response.data, ['notification']);
      notifications.value = notifications.value.map((item) =>
        item.id === notification.id ? notification : item
      );
      unreadCount.value = notifications.value.filter((item) => !item.leida).length;
      await fetchUnreadCount();
      return notification;
    }, 'No se pudo marcar la notificacion como leida');
  };

  const markAllAsRead = async () => {
    return run(async () => {
      const response = await api.patch('/notifications/read-all');
      notifications.value = notifications.value.map((item) => ({ ...item, leida: true }));
      unreadCount.value = 0;
      return Number((response.data as { count?: number }).count || 0);
    }, 'No se pudieron marcar las notificaciones como leidas');
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
});
