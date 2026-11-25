import { axiosClient } from './axiosClient';
import type { ListParams, Paginated, Rock, RockPayload } from '@/types/api';

const cleanParams = (params?: ListParams): Record<string, string | number> => {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number>;
};

export const rockApi = {
  list: async (params?: ListParams): Promise<Paginated<Rock>> => {
    const { data } = await axiosClient.get<Paginated<Rock>>('/rock', { params: cleanParams(params) });
    return data;
  },

  get: async (id: number | string): Promise<Rock> => {
    const { data } = await axiosClient.get<Rock>(`/rock/${id}`);
    return data;
  },

  create: async (payload: RockPayload): Promise<Rock> => {
    const { data } = await axiosClient.post<Rock>('/rock', payload);
    return data;
  },

  update: async (id: number | string, payload: Partial<RockPayload>): Promise<Rock> => {
    const { data } = await axiosClient.patch<Rock>(`/rock/${id}`, payload);
    return data;
  },

  remove: async (id: number | string): Promise<void> => {
    await axiosClient.delete(`/rock/${id}`);
  },
};
