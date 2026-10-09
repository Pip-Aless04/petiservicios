import type { FormMetadata } from './common';
import type { QuoteInformation } from './quote';

export interface Owner {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  /** 'whatsapp' | 'llamada' | 'correo' */
  preferredContact: string;
  province: string;
  canton: string;
  district?: string;
}

export interface Pet {
  name: string;
  /** 'perro' | 'gato' | 'ave' | 'reptil' | 'roedor' | 'pez' | 'otra' */
  species: string;
  speciesOther?: string;
  /** Texto libre, por ejemplo "3 años" u "8 meses". */
  approximateAge: string;
  /** 'macho' | 'hembra' | 'no_seguro' | 'prefiero_no_indicar' */
  sex: string;
  weightKg?: number;
}

export interface OwnerNeed {
  needs: string[];
  needsOther?: string;
  description: string;
  /** 'hoy' | '24_horas' | 'esta_semana' | 'proximas_semanas' | 'averiguando' */
  urgency: string;
}

export interface OwnerPreferences {
  budgetRange?: string;
  travelDistance?: string;
  factors: string[];
  factorsOther?: string;
}

export interface OwnerRequest {
  owner: Owner;
  pet: Pet;
  request: OwnerNeed;
  quote: QuoteInformation;
  preferences: OwnerPreferences;
  metadata: FormMetadata;
}
