import { axiosClient } from './axiosClient';
import type {
  AdminStats,
  Analysis,
  CollectionEntry,
  Feedback,
  ListParams,
  ListResult,
  Paginated,
  Role,
  User,
  UserUpdatePayload,
} from '@/types/api';

export const adminApi = {
  stats: async (): Promise<AdminStats> => {
    const { data } = await axiosClient.get<AdminStats>('/admin/stats');
    return data;
  },

  recognitions: async (params?: ListParams): Promise<Paginated<Analysis>> => {
    const { data } = await axiosClient.get<Paginated<Analysis>>('/admin/recognitions', { params });
    return data;
  },

  feedback: async (params?: ListParams): Promise<Paginated<Feedback>> => {
    const { data } = await axiosClient.get<Paginated<Feedback>>('/admin/feedback', { params });
    return data;
  },

  updateUser: async (id: number, payload: UserUpdatePayload): Promise<User> => {
    const { data } = await axiosClient.patch<User>(`/admin/users/${id}`, payload);
    return data;
  },

  userCollection: async (id: number): Promise<ListResult<CollectionEntry>> => {
    const { data } = await axiosClient.get<ListResult<CollectionEntry>>(`/admin/users/${id}/collection`);
    return data;
  },

  userAchievements: async (id: number): Promise<ListResult<{ id: number; name: string; unlocked: boolean; unlockedAt: string | null }>> => {
    const { data } = await axiosClient.get<ListResult<{ id: number; name: string; unlocked: boolean; unlockedAt: string | null }>>(
      `/admin/users/${id}/achievements`,
    );
    return data;
  },
};

export const userApi = {
  list: async (params?: ListParams): Promise<Paginated<User>> => {
    const { data } = await axiosClient.get<Paginated<User>>('/user', { params });
    return data;
  },

  get: async (id: number | string): Promise<User> => {
    const { data } = await axiosClient.get<User>(`/user/${id}`);
    return data;
  },
};

export const roleApi = {
  list: async (): Promise<Role[]> => {
    const { data } = await axiosClient.get<Paginated<Role>>('/role', { params: { limit: 100 } });
    return data.items;
  },
};
