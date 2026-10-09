/** Utilidades para leer los valores del formulario y armar el payload JSON. */
import { FORM_SOURCE, FORM_VERSION } from './constants';
import { parseNumber, text, type Values } from './validation';
import type { Coordinates, FormMetadata, FormType } from '../types/common';
import type { UploadedFile } from '../types/quote';
import type { YesNo } from '../types/veterinary';

/** Texto recortado; cadena vacía si no hay valor. */
export const str = (values: Values, name: string): string => text(values[name]);

/** Texto recortado o `undefined` si está vacío (para no enviar claves vacías). */
export const opt = (values: Values, name: string): string | undefined => {
  const value = str(values, name);
  return value === '' ? undefined : value;
};

/** Lista de valores seleccionados (casillas múltiples). */
export const list = (values: Values, name: string): string[] => {
  const value = values[name];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
};

/**
 * Coordenadas guardadas por el botón "Usar mi ubicación actual" (campos ocultos geoLat/geoLng/geoAccuracy).
 * `undefined` si la persona no compartió su ubicación.
 */
export function coordinates(values: Values): Coordinates | undefined {
  // No usa `num`: la longitud de Costa Rica es negativa y esos campos los escribimos nosotros con punto decimal.
  const read = (name: string): number | undefined => {
    const raw = str(values, name);
    const n = Number(raw);
    return raw === '' || !Number.isFinite(n) ? undefined : n;
  };
  const latitude = read('geoLat');
  const longitude = read('geoLng');
  if (latitude === undefined || longitude === undefined) return undefined;
  return { latitude, longitude, accuracyMeters: read('geoAccuracy') };
}

/** Número o `undefined` si está vacío o no es válido (acepta "150.000", "4,5", etc.). */
export const num = (values: Values, name: string): number | undefined => {
  const value = str(values, name);
  return value === '' ? undefined : parseNumber(value);
};

/** Casilla individual marcada. */
export const checked = (values: Values, name: string): boolean => list(values, name).length > 0;

/** Pregunta Sí/No: true / false / null si no contestó. */
export const yesNo = (values: Values, name: string): YesNo => {
  const value = str(values, name);
  return value === 'si' ? true : value === 'no' ? false : null;
};

/** Lee el archivo en base64 (sin prefijo `data:`). No lo guarda en ningún lado. */
export function fileToUploadedFile(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve({
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        contentBase64: result.slice(result.indexOf(',') + 1),
      });
    };
    reader.readAsDataURL(file);
  });
}

export function buildMetadata(
  formType: FormType,
  privacyAccepted: boolean,
  antiSpamToken?: string,
): FormMetadata {
  return {
    formType,
    timestamp: new Date().toISOString(),
    source: FORM_SOURCE,
    formVersion: FORM_VERSION,
    privacyAccepted,
    ...(antiSpamToken ? { antiSpamToken } : {}),
  };
}
