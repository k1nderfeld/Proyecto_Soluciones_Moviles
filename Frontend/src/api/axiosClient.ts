import { create, isAxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) return `http://${host}:8080/api`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api';
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = resolveBaseUrl();

let authToken: string | null = null;
let guestToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let guestUnauthorizedHandler: (() => void) | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const setGuestToken = (token: string | null): void => {
  guestToken = token;
};

export const getAuthToken = (): string | null => authToken;
export const getGuestToken = (): string | null => guestToken;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

export const setGuestUnauthorizedHandler = (handler: (() => void) | null): void => {
  guestUnauthorizedHandler = handler;
};

export const axiosClient = create({
  baseURL: API_BASE_URL,
  timeout: 90_000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  if (authToken) config.headers.set('Authorization', `Bearer ${authToken}`);
  else if (guestToken) config.headers.set('X-Guest-Token', guestToken);
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const sentAuth = Boolean(error.config?.headers?.get?.('Authorization'));
      const sentGuest = Boolean(error.config?.headers?.get?.('X-Guest-Token'));
      if (sentAuth) unauthorizedHandler?.();
      else if (sentGuest) guestUnauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
