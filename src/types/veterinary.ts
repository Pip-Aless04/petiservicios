import type { FormMetadata } from './common';

/** Respuesta a una pregunta Sí/No; `null` si no la contestó. */
export type YesNo = boolean | null;

export interface VeterinaryContact {
  contactPerson: string;
  role?: string;
  phone: string;
  whatsapp?: string;
  email: string;
}

export interface VeterinaryClinic {
  name: string;
  tradeName?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  googleMapsUrl?: string;
}

export interface VeterinaryLocation {
  province: string;
  canton: string;
  district?: string;
  address: string;
}

export interface VeterinaryServices {
  offered: string[];
  offeredOther?: string;
  species: string[];
  speciesOther?: string;
}

export interface VeterinaryCapabilities {
  emergencies: YesNo;
  hospitalization: YesNo;
  surgeryRoom: YesNo;
  specialists: YesNo;
  diagnostics: YesNo;
  weekends: YesNo;
  open24h: YesNo;
}

export interface VeterinaryCommercial {
  /** 'si' | 'probablemente' | 'conocer_mas' | 'no_por_ahora' */
  interestedInRequests: string;
  requestTypes: string[];
  requestTypesOther?: string;
  /** 'si' | 'algunas_veces' | 'no' */
  preparesQuotes?: string;
  quoteChannels: string[];
  quoteChannelsOther?: string;
  quoteContents: string[];
  quoteContentsOther?: string;
  /** 'menos_30_min' | '30_min_2_h' | '2_6_h' | '6_24_h' | 'mas_24_h' | 'depende' */
  responseTime?: string;
  /** Solo investigación; el modelo comercial todavía no está definido. */
  preferredBusinessModel?: string;
}

export interface VeterinaryRegistration {
  contact: VeterinaryContact;
  clinic: VeterinaryClinic;
  location: VeterinaryLocation;
  services: VeterinaryServices;
  capabilities: VeterinaryCapabilities;
  commercial: VeterinaryCommercial;
  metadata: FormMetadata;
}
