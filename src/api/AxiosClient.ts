import axios from 'axios';
import Toast from 'react-native-toast-message';
import store from '../components/redux/Store';
import { logout, setToken, setUser } from '../components/redux/slice/AuthSlice';
import { navigationRef } from '../services/NavigationService';
import { attachAxiosLogging } from './ApiLogger';
export const BASE_URL = 'https://sfa.fieldkonnect.io/';
export const IMAGE_BASE_URL = 'https://sfa.fieldkonnect.io/';
// export const BASE_URL = 'http://127.0.0.1:8000/';

/**
 * API media fields are not consistent: newer endpoints return complete URLs,
 * while older endpoints return a path relative to public/storage. Never add a
 * base URL to an already absolute URL (that produces an invalid image URL).
 */
export const resolveMediaUrl = (value?: string | null): string => {
  const path = String(value || '').trim();

  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('//')) return `https:${path}`;

  const baseUrl = BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  if (normalizedPath.startsWith('public/') || normalizedPath.startsWith('storage/')) {
    return `${baseUrl}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith('uploads/')) {
    return `${baseUrl}/public/${normalizedPath}`;
  }

  return `${baseUrl}/public/storage/${normalizedPath}`;
};

const axiosClient = axios.create({ baseURL: BASE_URL });
attachAxiosLogging(axiosClient, 'axiosClient');

axiosClient.interceptors.request.use(async config => {
  const token = store.getState()?.auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

axiosClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    const errorMsg = error?.response?.data?.error;
    const authErrorText = `${message || ''} ${errorMsg || ''}`.toLowerCase();
    const isAuthenticationError =
      status === 401 ||
      authErrorText.includes('unauthenticated') ||
      authErrorText.includes('token expired') ||
      authErrorText.includes('invalid token');

    if (isAuthenticationError) {

      Toast.show({
        type: 'error',
        text1: 'Session expired. Please login again',
      });
      store.dispatch(setUser(null));
      store.dispatch(setToken(null));
      store.dispatch(logout());

      // ✅ navigate to login
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });

      return Promise.reject(error);
    }
    if (error?.response?.status === 400) {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || error?.response?.data?.reminders[0]?.message || error?.response?.data ||
          error?.response?.data?.errorMessage ||
          error?.response?.data?.message ||
          error?.response?.data?.errors[0]?.error || 'Something went wrong',
        visibilityTime: 5000
      });

      return error?.response?.data?.message || error?.response?.data?.error;
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
