import { axiosClient } from './axiosClient';
import type { ListParams, Paginated, ProgressStats, Analysis } from '@/types/api';

export const progressApi = {
  stats: async (): Promise<ProgressStats> => {
    const { data } = await axiosClient.get<ProgressStats>('/progress/me');
    return data;
  },

  history: async (params?: ListParams): Promise<Paginated<Analysis>> => {
    const { data } = await axiosClient.get<Paginated<Analysis>>('/progress/me/history', { params });
    return data;
  },
};
