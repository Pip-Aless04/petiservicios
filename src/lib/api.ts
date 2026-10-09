/**
 * Envío de formularios: únicamente lógica de frontend.
 * Hace un POST con JSON a PUBLIC_FORM_API_URL y devuelve el resultado.
 * No hay servidor, endpoint ni almacenamiento en este proyecto.
 */
import { REQUEST_TIMEOUT_MS } from './constants';
import type { SubmitResult } from '../types/common';
import type { OwnerRequest } from '../types/owner';
import type { VeterinaryRegistration } from '../types/veterinary';

/** URL de destino (variable PUBLIC_*: visible en el navegador, no poner secretos). */
export const FORM_API_URL: string = (import.meta.env.PUBLIC_FORM_API_URL ?? '').trim();

export const isApiConfigured = (): boolean => FORM_API_URL !== '';

/**
 * Punto de enlace para anti-spam (Cloudflare Turnstile, CAPTCHA, etc.).
 * Hoy no devuelve nada; cuando se incorpore, el token viaja en `metadata.antiSpamToken`.
 */
export async function getAntiSpamToken(): Promise<string | undefined> {
  return undefined;
}

export async function submitForm<T>(data: T): Promise<SubmitResult> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      kind: 'config',
      message:
        'Falta configurar PUBLIC_FORM_API_URL, por eso el formulario no puede enviarse todavía.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(FORM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        kind: 'http',
        status: response.status,
        message: `El servidor respondió con un error (${response.status}).`,
      };
    }

    // La respuesta puede venir vacía o no ser JSON; no es un error.
    const body: unknown = await response.json().catch(() => null);
    return { ok: true, status: response.status, data: body };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        kind: 'timeout',
        message: 'El envío tardó demasiado. Revisá tu conexión e intentá de nuevo.',
      };
    }
    return {
      ok: false,
      kind: 'network',
      message: 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
    };
  } finally {
    clearTimeout(timer);
  }
}

export const submitOwnerForm = (data: OwnerRequest): Promise<SubmitResult> => submitForm(data);

export const submitVeterinaryForm = (data: VeterinaryRegistration): Promise<SubmitResult> =>
  submitForm(data);
