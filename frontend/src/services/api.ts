import axios, { AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const isExpiredTokenMessage = (message: string) => {
  return /token\s+(expirado|invalido|requerido)/i.test(message);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string; details?: Record<string, unknown> }>) => {
    const rawMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Error de conexion con el servidor';

    if (error.response?.status === 401 && isExpiredTokenMessage(rawMessage)) {
      clearStoredSession();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        window.location.assign('/login');
      }

      return Promise.reject(new Error(''));
    }

    const message = isExpiredTokenMessage(rawMessage)
      ? 'La sesion expiro. Inicia sesion nuevamente.'
      : rawMessage;

    const appError = new Error(message) as Error & { details?: Record<string, unknown>; status?: number };
    appError.details = error.response?.data?.details;
    appError.status = error.response?.status;

    return Promise.reject(appError);
  }
);

export default api;
