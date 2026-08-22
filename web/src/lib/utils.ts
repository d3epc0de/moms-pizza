/**
 * Shared utility functions for Mom's Pizza POS
 */

/** Format a number as Colombian Pesos (COP) */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
};

/** Generate a short sequential order number like "001" */
export const padOrderNumber = (num: number | undefined): string => {
  return (num || 0).toString().padStart(3, '0');
};

/** Format elapsed time from a timestamp to "mm:ss min" */
export const formatElapsedTime = (elapsedMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min`;
};

/** Calculate elapsed time progress as a percentage (0-100) for a given max time in ms */
export const calculateProgressPercent = (elapsedMs: number, maxMs: number): number => {
  return Math.min(100, Math.max(0, (elapsedMs / maxMs) * 100));
};

/** Get a human-readable date string */
export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Get just the time portion HH:MM */
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
