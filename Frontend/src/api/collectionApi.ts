import { axiosClient } from './axiosClient';
import type { CollectionEntry, ListResult } from '@/types/api';

export const collectionApi = {
  mine: async (): Promise<ListResult<CollectionEntry>> => {
    const { data } = await axiosClient.get<ListResult<CollectionEntry>>('/collection/me');
    return data;
  },

  mineByRock: async (rockId: number): Promise<CollectionEntry> => {
    const { data } = await axiosClient.get<CollectionEntry>(`/collection/me/${rockId}`);
    return data;
  },
};
