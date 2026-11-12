const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
};

export const formatNumber = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('es-CL').format(value)
    : '0';

export const formatPercentage = (value?: number | null): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0 %';
  return `${Math.round(value * 10) / 10} %`;
};

export const formatCondition = (
  conditionType?: string | null,
  conditionValue?: number | null,
): string => {
  if (!conditionType || !conditionValue) return 'Logro especial del sistema';
  const unit = conditionValue === 1 ? '' : 's';
  if (conditionType === 'distinct_rocks') {
    return `Descubre ${conditionValue} roca${unit} distinta${unit}`;
  }
  if (conditionType === 'total_recognitions') {
    return `Realiza ${conditionValue} reconocimiento${unit}`;
  }
  return 'Condición automática';
};

export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const truncate = (value: string, max = 120): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export const formatExpiration = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
