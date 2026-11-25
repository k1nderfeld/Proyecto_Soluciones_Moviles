import { axiosClient } from './axiosClient';
import type {
  CategoryItem,
  CategoryPayload,
  ListParams,
  Paginated,
  TypeItem,
  TypePayload,
} from '@/types/api';

const listAll = async <T>(path: string): Promise<T[]> => {
  const { data } = await axiosClient.get<Paginated<T>>(path, { params: { limit: 100, page: 1 } });
  return data.items;
};

export const taxonomyApi = {
  listTypes: (params?: ListParams) =>
    axiosClient.get<Paginated<TypeItem>>('/type', { params }).then((response) => response.data),

  allTypes: () => listAll<TypeItem>('/type'),

  createType: (payload: TypePayload) =>
    axiosClient.post<TypeItem>('/type', payload).then((response) => response.data),

  updateType: (id: number, payload: Partial<TypePayload>) =>
    axiosClient.patch<TypeItem>(`/type/${id}`, payload).then((response) => response.data),

  removeType: async (id: number) => {
    await axiosClient.delete(`/type/${id}`);
  },

  listCategories: (params?: ListParams) =>
    axiosClient.get<Paginated<CategoryItem>>('/category', { params }).then((response) => response.data),

  allCategories: () => listAll<CategoryItem>('/category'),

  createCategory: (payload: CategoryPayload) =>
    axiosClient.post<CategoryItem>('/category', payload).then((response) => response.data),

  updateCategory: (id: number, payload: Partial<CategoryPayload>) =>
    axiosClient.patch<CategoryItem>(`/category/${id}`, payload).then((response) => response.data),

  removeCategory: async (id: number) => {
    await axiosClient.delete(`/category/${id}`);
  },
};
