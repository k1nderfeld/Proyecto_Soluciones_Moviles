import { isAxiosError } from 'axios';

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: string[];

  constructor(message: string, options: { status?: number; code?: string; details?: string[] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

const NETWORK_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión y que el backend esté en ejecución.';

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; details?: string[] }
      | undefined;
    if (data?.message) {
      return data.details?.length
        ? `${data.message}: ${data.details.join(', ')}`
        : data.message;
    }
    if (!error.response) return NETWORK_MESSAGE;
    return `La operación falló (${error.response.status}). Intenta nuevamente.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

export const getErrorStatus = (error: unknown): number | undefined => {
  if (error instanceof ApiError) return error.status;
  if (isAxiosError(error)) return error.response?.status;
  return undefined;
};

export const getErrorCode = (error: unknown): string | undefined => {
  if (error instanceof ApiError) return error.code;
  if (isAxiosError(error)) {
    const data = error.response?.data as { code?: string } | undefined;
    return data?.code;
  }
  return undefined;
};

export const isGuestLimitError = (error: unknown): boolean =>
  getErrorStatus(error) === 403 && getErrorCode(error) === 'GUEST_LIMIT_REACHED';
