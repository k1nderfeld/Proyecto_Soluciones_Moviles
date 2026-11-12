import { axiosClient } from './axiosClient';
import type {
  GuestSessionInfo,
  GuestSessionResponse,
  LoginResponse,
  MigrationResult,
  ProfilePayload,
  RegisterPayload,
  RegisterResponse,
  User,
} from '@/types/api';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await axiosClient.post<LoginResponse>('/user/login', { email, password });
    return data;
  },

  register: async (payload: RegisterPayload, guestToken?: string | null): Promise<RegisterResponse> => {
    const { data } = await axiosClient.post<RegisterResponse>('/user/registro', {
      ...payload,
      ...(guestToken ? { guestToken } : {}),
    });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await axiosClient.get<User>('/user/me');
    return data;
  },

  updateMe: async (payload: ProfilePayload): Promise<User> => {
    const { data } = await axiosClient.patch<User>('/user/me', payload);
    return data;
  },
};

export const guestApi = {
  createSession: async (): Promise<GuestSessionResponse> => {
    const { data } = await axiosClient.post<GuestSessionResponse>('/guest/session');
    return data;
  },

  getSession: async (): Promise<GuestSessionInfo> => {
    const { data } = await axiosClient.get<GuestSessionInfo>('/guest/session');
    return data;
  },

  migrate: async (guestToken: string): Promise<MigrationResult> => {
    const { data } = await axiosClient.post<MigrationResult>(
      '/guest/migrate',
      {},
      { headers: { 'X-Guest-Token': guestToken } },
    );
    return data;
  },
};
