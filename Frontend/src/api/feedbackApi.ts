import { axiosClient } from './axiosClient';
import type { Feedback, FeedbackPayload } from '@/types/api';

export const feedbackApi = {
  get: async (analysisId: number | string): Promise<Feedback> => {
    const { data } = await axiosClient.get<Feedback>(`/recognition/${analysisId}/feedback`);
    return data;
  },

  create: async (analysisId: number | string, payload: FeedbackPayload): Promise<Feedback> => {
    const { data } = await axiosClient.post<Feedback>(`/recognition/${analysisId}/feedback`, payload);
    return data;
  },

  update: async (analysisId: number | string, payload: FeedbackPayload): Promise<Feedback> => {
    const { data } = await axiosClient.patch<Feedback>(`/recognition/${analysisId}/feedback`, payload);
    return data;
  },
};
