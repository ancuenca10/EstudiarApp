import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/services/api';

export type TopUniversity = {
  id: string;
  nombre: string;
  ciudad?: string | null;
  ratingPromedio?: number | null;
  resenasCount: number;
  programasCount: number;
};

export type PublicStats = {
  universidadesTotal: number;
  ciudadesTotal: number;
  publicasTotal: number | null;
  privadasTotal: number | null;
  resenasTotal: number;
  topUniversidades: TopUniversity[];
};

const defaultStats = (): PublicStats => ({
  universidadesTotal: 0,
  ciudadesTotal: 0,
  publicasTotal: null,
  privadasTotal: null,
  resenasTotal: 0,
  topUniversidades: [],
});

export const usePublicStatsStore = defineStore('publicStats', () => {
  const stats = ref<PublicStats>(defaultStats());
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStats = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await api.get<{ data: PublicStats }>('/public/stats');
      stats.value = response.data.data || defaultStats();
      return stats.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudieron cargar las estadisticas';
      stats.value = defaultStats();
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
});
