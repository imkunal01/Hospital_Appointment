import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getInMemoryAccessToken, setInMemoryAccessToken, clearSession } from '../auth/sessionStore';
import { getRefreshToken, saveRefreshToken } from '../auth/secureStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30-second timeout to handle Render cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cold start listener listeners for "Server is waking up..." UI
type WakingUpListener = (isWakingUp: boolean) => void;
const wakingUpListeners = new Set<WakingUpListener>();

export function subscribeToWakingUp(listener: WakingUpListener) {
  wakingUpListeners.add(listener);
  return () => {
    wakingUpListeners.delete(listener);
  };
}

function notifyWakingUp(isWakingUp: boolean) {
  wakingUpListeners.forEach((l) => l(isWakingUp));
}

// Single in-flight refresh promise to prevent multiple parallel refresh calls
let refreshPromise: Promise<string> | null = null;

// Request Interceptor: Attach in-memory access token & setup cold start warning timer
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getInMemoryAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Timer: if request takes > 5 seconds, notify UI that server may be waking up
  const timer = setTimeout(() => {
    notifyWakingUp(true);
  }, 5000);

  // Attach timer to config so response can clear it
  (config as any).__coldStartTimer = timer;

  return config;
});

// Response Interceptor: Clear cold start timer and handle transparent token refresh
apiClient.interceptors.response.use(
  (response) => {
    const timer = (response.config as any).__coldStartTimer;
    if (timer) clearTimeout(timer);
    notifyWakingUp(false);
    return response;
  },
  async (error: AxiosError<any>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; __coldStartTimer?: any });
    if (config?.__coldStartTimer) {
      clearTimeout(config.__coldStartTimer);
    }
    notifyWakingUp(false);

    const originalRequest = config;
    const errorCode = error.response?.data?.error?.code;

    // Handle token expiration with a single in-flight shared refresh promise
    if (error.response?.status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const rawRefreshToken = await getRefreshToken();
            if (!rawRefreshToken) {
              throw new Error('No refresh token available');
            }

            // Direct call bypassing interceptor to avoid loops
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: rawRefreshToken
            });

            const newAccessToken = res.data.accessToken;
            setInMemoryAccessToken(newAccessToken);
            return newAccessToken;
          } catch (refreshErr) {
            await clearSession();
            throw refreshErr;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Ping /health on application startup to warm up Render free-tier cold instances.
 */
export async function warmUpBackend(): Promise<boolean> {
  try {
    const res = await apiClient.get('/health', { timeout: 15000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

