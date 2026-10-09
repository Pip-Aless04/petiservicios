/** Esquema de validación y armado del payload del formulario de veterinarias. */
import { submitVeterinaryForm } from '../../lib/api';
import { initMultiStepForm, type BuildContext } from '../../lib/multistep';
import { coordinates, list, opt, str, yesNo } from '../../lib/payload';
import {
  email,
  maxLength,
  normalizeUrl,
  phone,
  required,
  requiredIf,
  url,
  urlOrHandle,
  type Schema,
} from '../../lib/validation';
import type { VeterinaryRegistration } from '../../types/veterinary';

const includes = (name: string, value: string) => (all: Parameters<typeof list>[0]) =>
  list(all, name).includes(value);

export const veterinarySchema: Schema = {
  // Paso 1 — Clínica y contacto
  clinicName: [required('Indicá el nombre de la clínica.'), maxLength(120)],
  tradeName: [maxLength(120)],
  contactPerson: [required('Indicá la persona de contacto.'), maxLength(100)],
  role: [maxLength(80)],
  phone: [required('Necesitamos un teléfono de contacto.'), phone()],
  whatsapp: [phone('Ingresá un WhatsApp válido, por ejemplo 8888 8888.')],
  email: [required('Ingresá un correo de contacto.'), email(), maxLength(120)],
  // Paso 2 — Ubicación y presencia en línea
  province: [required('Elegí la provincia.')],
  canton: [required('Indicá el cantón.'), maxLength(60)],
  district: [maxLength(60)],
  address: [required('Indicá la dirección de la clínica.'), maxLength(200)],
  website: [url(), maxLength(200)],
  instagram: [urlOrHandle(), maxLength(200)],
  facebook: [urlOrHandle(), maxLength(200)],
  googleMapsUrl: [url('Ingresá un enlace válido de Google Maps.'), maxLength(300)],
  // Paso 3 — Servicios y especies
  services: [required('Elegí al menos un servicio.')],
  servicesOther: [
    requiredIf(includes('services', 'otro'), 'Indicá qué otros servicios ofrecen.'),
    maxLength(150),
  ],
  species: [required('Elegí al menos una especie.')],
  speciesOther: [
    requiredIf(includes('species', 'otros'), 'Indicá qué otras especies atienden.'),
    maxLength(150),
  ],
  // Paso 5 — Interés en solicitudes
  interestedInRequests: [required('Elegí una opción.')],
  requestTypesOther: [
    requiredIf(includes('requestTypes', 'otros'), 'Indicá qué otras solicitudes les interesan.'),
    maxLength(150),
  ],
  // Paso 6 — Cotizaciones
  quoteChannelsOther: [
    requiredIf(includes('quoteChannels', 'otro'), 'Indicá por qué otro medio las envían.'),
    maxLength(150),
  ],
  quoteContentsOther: [
    requiredIf(includes('quoteContents', 'otros'), 'Indicá qué otra información incluyen.'),
    maxLength(150),
  ],
  acceptPrivacy: [required('Necesitamos tu aceptación para poder enviar el registro.')],
};

export function buildVeterinaryPayload({ values, metadata }: BuildContext): VeterinaryRegistration {
  const services = list(values, 'services');
  const species = list(values, 'species');
  const requestTypes = list(values, 'requestTypes');
  const quoteChannels = list(values, 'quoteChannels');
  const quoteContents = list(values, 'quoteContents');

  return {
    contact: {
      contactPerson: str(values, 'contactPerson'),
      role: opt(values, 'role'),
      phone: str(values, 'phone'),
      whatsapp: opt(values, 'whatsapp'),
      email: str(values, 'email'),
    },
    clinic: {
      name: str(values, 'clinicName'),
      tradeName: opt(values, 'tradeName'),
      website: normalizeUrl(values.website),
      instagram: opt(values, 'instagram'),
      facebook: opt(values, 'facebook'),
      googleMapsUrl: normalizeUrl(values.googleMapsUrl),
    },
    location: {
      province: str(values, 'province'),
      canton: str(values, 'canton'),
      district: opt(values, 'district'),
      address: str(values, 'address'),
      coordinates: coordinates(values),
    },
    services: {
      offered: services,
      offeredOther: services.includes('otro') ? opt(values, 'servicesOther') : undefined,
      species,
      speciesOther: species.includes('otros') ? opt(values, 'speciesOther') : undefined,
    },
    capabilities: {
      emergencies: yesNo(values, 'emergencies'),
      hospitalization: yesNo(values, 'hospitalization'),
      surgeryRoom: yesNo(values, 'surgeryRoom'),
      specialists: yesNo(values, 'specialists'),
      diagnostics: yesNo(values, 'diagnostics'),
      weekends: yesNo(values, 'weekends'),
      open24h: yesNo(values, 'open24h'),
    },
    commercial: {
      interestedInRequests: str(values, 'interestedInRequests'),
      requestTypes,
      requestTypesOther: requestTypes.includes('otros') ? opt(values, 'requestTypesOther') : undefined,
      preparesQuotes: opt(values, 'preparesQuotes'),
      quoteChannels,
      quoteChannelsOther: quoteChannels.includes('otro') ? opt(values, 'quoteChannelsOther') : undefined,
      quoteContents,
      quoteContentsOther: quoteContents.includes('otros') ? opt(values, 'quoteContentsOther') : undefined,
      responseTime: opt(values, 'responseTime'),
      preferredBusinessModel: opt(values, 'preferredBusinessModel'),
    },
    metadata,
  };
}

export function initVeterinaryForm(card: HTMLElement): void {
  initMultiStepForm<VeterinaryRegistration>(card, {
    formType: 'veterinary_registration',
    schema: veterinarySchema,
    buildPayload: buildVeterinaryPayload,
    submit: submitVeterinaryForm,
  });
}
