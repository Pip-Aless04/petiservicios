/** Tipos compartidos solo del frontend. No representan modelos de backend ni de base de datos. */

export type FormType = 'owner_request' | 'veterinary_registration';

/** Estados de un formulario durante el envío. */
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/** Metadata que el frontend agrega a cada envío. */
export interface FormMetadata {
  /** Identifica cuál de los dos formularios generó el POST (ambos usan la misma URL). */
  formType: FormType;
  /** ISO 8601, generado en el navegador al momento de enviar. */
  timestamp: string;
  /** Origen del envío (nombre del sitio). */
  source: string;
  /** Versión del esquema del formulario; cambia cuando cambian los campos. */
  formVersion: string;
  /** El usuario aceptó la política de privacidad antes de enviar. */
  privacyAccepted: boolean;
  /** Reservado para un token anti-spam (Turnstile/CAPTCHA) cuando se incorpore. */
  antiSpamToken?: string;
}

/** Ubicación compartida por la persona con el botón "Usar mi ubicación actual" (opcional). */
export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Precisión aproximada que informa el navegador, en metros. */
  accuracyMeters?: number;
}

export type SubmitResult =
  | { ok: true; status: number; data: unknown }
  | {
      ok: false;
      kind: 'config' | 'http' | 'network' | 'timeout';
      status?: number;
      message: string;
    };
