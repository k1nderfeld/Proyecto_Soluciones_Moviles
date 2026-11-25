import { axiosClient } from './axiosClient';
import type {
  Achievement,
  AchievementPayload,
  ListParams,
  ListResult,
  Paginated,
} from '@/types/api';

export const achievementApi = {
  list: async (params?: ListParams): Promise<Paginated<Achievement>> => {
    const { data } = await axiosClient.get<Paginated<Achievement>>('/achievement', { params });
    return data;
  },

  mine: async (): Promise<ListResult<Achievement>> => {
    const { data } = await axiosClient.get<ListResult<Achievement>>('/achievement/me');
    return data;
  },

  create: async (payload: AchievementPayload): Promise<Achievement> => {
    const { data } = await axiosClient.post<Achievement>('/achievement', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AchievementPayload>): Promise<Achievement> => {
    const { data } = await axiosClient.patch<Achievement>(`/achievement/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/achievement/${id}`);
  },
};
