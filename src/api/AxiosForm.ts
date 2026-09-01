import axios from 'axios';
import store from '../components/redux/Store';
import { attachAxiosLogging } from './ApiLogger';
import { BASE_URL } from './AxiosClient';

const axiosClientForm = axios.create({ baseURL: BASE_URL });
attachAxiosLogging(axiosClientForm, 'axiosForm');

axiosClientForm.interceptors.request.use(async config => {
  const token = store.getState().auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'multipart/form-data';
  return config;
});

axiosClientForm.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error?.response?.status === 400) {
      return error?.response?.data?.message;
    }

    return Promise.reject(error);
  },
);

export default axiosClientForm;
