/**
 * Validación del lado del cliente. Son reglas pequeñas y combinables:
 * cada regla devuelve un mensaje de error o `null` si el valor es válido.
 * Los campos vacíos que no son obligatorios nunca producen error (no bloqueamos de más).
 */
import { QUOTE_FILE } from './constants';

export type FieldValue = string | string[] | File | null;
export type Values = Record<string, FieldValue>;
export type Rule = (value: FieldValue, all: Values) => string | null;
export type Schema = Record<string, Rule[]>;
export type Errors = Record<string, string>;

/** Texto recortado de un valor; cadena vacía si no es texto. */
export function text(value: FieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmpty(value: FieldValue | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

export const required =
  (message = 'Este campo es obligatorio.'): Rule =>
  (value) =>
    isEmpty(value) ? message : null;

export const maxLength =
  (max: number, message = `Máximo ${max} caracteres.`): Rule =>
  (value) =>
    text(value).length > max ? message : null;

export const minLength =
  (min: number, message = `Escribí al menos ${min} caracteres.`): Rule =>
  (value) => {
    const t = text(value);
    return t !== '' && t.length < min ? message : null;
  };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const email =
  (message = 'Ingresá un correo válido, por ejemplo nombre@correo.com.'): Rule =>
  (value) => {
    const t = text(value);
    return t === '' || EMAIL_RE.test(t) ? null : message;
  };

/**
 * Teléfonos de Costa Rica (8 dígitos, con o sin +506) y, para no bloquear,
 * números internacionales que empiecen con "+" (8 a 15 dígitos).
 */
export const phone =
  (message = 'Ingresá un teléfono válido, por ejemplo 8888 8888.'): Rule =>
  (value) => {
    const t = text(value);
    if (t === '') return null;
    if (!/^[+\d\s().-]+$/.test(t)) return message;
    const digits = t.replace(/\D/g, '');
    const isCr = digits.length === 8 || (digits.length === 11 && digits.startsWith('506'));
    const isIntl = t.startsWith('+') && digits.length >= 8 && digits.length <= 15;
    return isCr || isIntl ? null : message;
  };

function toUrl(raw: string): URL | null {
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.hostname.includes('.') ? url : null;
  } catch {
    return null;
  }
}

/** Acepta "peti.cr", "www.peti.cr" o "https://peti.cr". */
export const url =
  (message = 'Ingresá una dirección web válida, por ejemplo https://tuclinica.cr.'): Rule =>
  (value) => {
    const t = text(value);
    return t === '' || toUrl(t) ? null : message;
  };

/** Para Instagram/Facebook: acepta un enlace o un usuario como @tuclinica. */
export const urlOrHandle =
  (message = 'Ingresá un enlace o un usuario, por ejemplo @tuclinica.'): Rule =>
  (value) => {
    const t = text(value);
    if (t === '') return null;
    if (/^@?[\w.]{2,50}$/.test(t)) return null;
    return toUrl(t) ? null : message;
  };

/** Devuelve el enlace con protocolo (https://) o `undefined` si está vacío. */
export function normalizeUrl(value: FieldValue | undefined): string | undefined {
  const t = text(value);
  if (t === '') return undefined;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * Convierte texto a número tolerando formatos de Costa Rica:
 * "150.000", "150 000", "150,000", "4,5", "₡150.000" o "4.5".
 */
export function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[₡$\s]/g, '');
  if (cleaned === '') return undefined;
  let normalized = cleaned;
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/[.,]/g, '');
  else if (/^\d+[.,]\d+$/.test(cleaned)) normalized = cleaned.replace(',', '.');
  else if (!/^\d+$/.test(cleaned)) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export const numberBetween =
  (min: number, max: number, message = `Ingresá un número entre ${min} y ${max}.`): Rule =>
  (value) => {
    const t = text(value);
    if (t === '') return null;
    const n = parseNumber(t);
    return n !== undefined && n >= min && n <= max ? null : message;
  };

export const notFutureDate =
  (message = 'La fecha no puede ser futura.'): Rule =>
  (value) => {
    const t = text(value);
    if (t === '') return null;
    const date = new Date(`${t}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Ingresá una fecha válida.';
    return date.getTime() > Date.now() ? message : null;
  };

/** Marca un campo como obligatorio solo cuando `condition` es verdadera. */
export const requiredIf =
  (condition: (all: Values) => boolean, message = 'Este campo es obligatorio.'): Rule =>
  (value, all) =>
    condition(all) && isEmpty(value) ? message : null;

// --- Archivos --------------------------------------------------------------

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/** Valida extensión, tipo MIME y tamaño de la cotización adjunta. */
export function validateQuoteFile(file: File): string | null {
  const ext = extensionOf(file.name);
  const allowed = QUOTE_FILE.extensions.join(', ').toUpperCase();
  if (!(QUOTE_FILE.extensions as readonly string[]).includes(ext)) {
    return `El archivo debe ser ${allowed}.`;
  }
  // Algunos navegadores no informan el MIME; si lo informan, tiene que coincidir.
  if (file.type && !(QUOTE_FILE.mimeTypes as readonly string[]).includes(file.type)) {
    return `Ese tipo de archivo no es válido. Usá ${allowed}.`;
  }
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > QUOTE_FILE.maxBytes) {
    return `El archivo supera el máximo de ${QUOTE_FILE.maxLabel}.`;
  }
  return null;
}

export const validFile = (): Rule => (value) =>
  value instanceof File ? validateQuoteFile(value) : null;

// --- Ejecución -------------------------------------------------------------

/** Devuelve el primer error de un campo, o `null`. */
export function validateField(
  name: string,
  value: FieldValue,
  all: Values,
  schema: Schema,
): string | null {
  for (const rule of schema[name] ?? []) {
    const error = rule(value, all);
    if (error) return error;
  }
  return null;
}

/** Valida una lista de campos y devuelve solo los que tienen error. */
export function validateFields(names: string[], values: Values, schema: Schema): Errors {
  const errors: Errors = {};
  for (const name of names) {
    const error = validateField(name, values[name] ?? null, values, schema);
    if (error) errors[name] = error;
  }
  return errors;
}
