import { axiosClient } from './axiosClient';
import type { RecognitionPayload, RecognitionResult } from '@/types/api';

export const recognitionApi = {
  recognize: async (payload: RecognitionPayload): Promise<RecognitionResult> => {
    const { data } = await axiosClient.post<RecognitionResult>('/recognition', payload, {
      timeout: 120_000,
    });
    return data;
  },
};
