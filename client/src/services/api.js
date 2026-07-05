import axios from 'axios';
import { store } from '../redux/store';
import { setCredentials, logout } from '../redux/authSlice';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid loops and check if unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url === '/api/auth/refresh-token' ||
        originalRequest.url === '/api/auth/login' ||
        originalRequest.url === '/api/auth/register'
      ) {
        if (originalRequest.url === '/api/auth/refresh-token') {
          store.dispatch(logout());
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const { accessToken } = response.data.data;

        store.dispatch(setCredentials({ accessToken }));

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
