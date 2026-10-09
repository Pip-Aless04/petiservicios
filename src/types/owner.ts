import type { Coordinates, FormMetadata } from './common';
import type { QuoteInformation, UploadedFile } from './quote';

export interface Owner {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  /** 'whatsapp' | 'llamada' | 'correo' */
  preferredContact: string;
}

/** Dónde está el propietario: sirve para buscar clínicas cercanas. */
export interface OwnerLocation {
  province: string;
  canton: string;
  district?: string;
  /** Señas o referencia, por ejemplo "200 m sur de la iglesia". */
  address?: string;
  googleMapsUrl?: string;
  /** Solo si la persona usó "Usar mi ubicación actual". */
  coordinates?: Coordinates;
}

export interface Pet {
  name: string;
  /** 'perro' | 'gato' | 'ave' | 'reptil' | 'roedor' | 'pez' | 'otra' */
  species: string;
  speciesOther?: string;
  breed?: string;
  /** Texto libre, por ejemplo "3 años" u "8 meses". */
  approximateAge: string;
  /** 'macho' | 'hembra' | 'no_seguro' | 'prefiero_no_indicar' */
  sex: string;
  weightKg?: number;
  /** Castrada/esterilizada: 'si' | 'no' | 'no_se' */
  sterilized?: string;
  /** Vacunas al día: 'si' | 'no' | 'no_se' */
  vaccinesUpToDate?: string;
}

export interface OwnerNeed {
  needs: string[];
  needsOther?: string;
  /** Qué procedimiento o servicio quiere cotizar, en sus palabras. */
  procedure: string;
  description?: string;
  /** 'hoy' | '24_horas' | 'esta_semana' | 'proximas_semanas' | 'averiguando' */
  urgency: string;
  additionalNotes?: string;
}

/** Contexto de salud que ayuda a cotizar mejor (todo opcional). */
export interface HealthContext {
  diagnosis?: string;
  conditions?: string;
  /** Exámenes, radiografías o informes (hasta 3 archivos). */
  documents?: UploadedFile[];
}

export interface OwnerPreferences {
  budgetRange?: string;
  travelDistance?: string;
  factors: string[];
  factorsOther?: string;
}

export interface OwnerRequest {
  owner: Owner;
  location: OwnerLocation;
  pet: Pet;
  request: OwnerNeed;
  health: HealthContext;
  quote: QuoteInformation;
  preferences: OwnerPreferences;
  metadata: FormMetadata;
}
