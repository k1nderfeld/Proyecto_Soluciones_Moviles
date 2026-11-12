import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const GUEST_TOKEN_KEY = 'guest_token';

const isWeb = Platform.OS === 'web';

const readWeb = (key: string): string | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getStoredAuthToken = async (): Promise<string | null> => {
  if (isWeb) return readWeb(AUTH_TOKEN_KEY);
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuthToken = async (token: string | null): Promise<void> => {
  if (isWeb) {
    try {
      if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      else window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
    return;
  }
  try {
    if (token) await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {}
};

export const getStoredGuestToken = async (): Promise<string | null> => {
  if (isWeb) return readWeb(GUEST_TOKEN_KEY);
  try {
    return await SecureStore.getItemAsync(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredGuestToken = async (token: string | null): Promise<void> => {
  if (isWeb) {
    try {
      if (token) window.localStorage.setItem(GUEST_TOKEN_KEY, token);
      else window.localStorage.removeItem(GUEST_TOKEN_KEY);
    } catch {}
    return;
  }
  try {
    if (token) await SecureStore.setItemAsync(GUEST_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY);
  } catch {}
};

export const clearStoredTokens = async (): Promise<void> => {
  await Promise.all([setStoredAuthToken(null), setStoredGuestToken(null)]);
};
