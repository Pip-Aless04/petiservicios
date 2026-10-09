/** Esquema de validación y armado del payload del formulario de propietarios. */
import { submitOwnerForm } from '../../lib/api';
import { initMultiStepForm, type BuildContext } from '../../lib/multistep';
import { coordinates, list, num, opt, str } from '../../lib/payload';
import {
  email,
  maxLength,
  normalizeUrl,
  notFutureDate,
  numberBetween,
  phone,
  required,
  requiredIf,
  text,
  url,
  validFiles,
  type Schema,
} from '../../lib/validation';
import type { Currency, HasQuote, QuoteInformation } from '../../types/quote';
import type { OwnerRequest } from '../../types/owner';

export const ownerSchema: Schema = {
  // Paso 1 — Tus datos
  firstName: [required('Contanos tu nombre.'), maxLength(60)],
  lastName: [required('Contanos tu apellido.'), maxLength(80)],
  phone: [required('Necesitamos un teléfono o WhatsApp para contactarte.'), phone()],
  preferredContact: [required('Elegí cómo preferís que te contactemos.')],
  email: [
    requiredIf(
      (all) => text(all.preferredContact) === 'correo',
      'Ingresá tu correo para que podamos contactarte por ahí.',
    ),
    email(),
    maxLength(120),
  ],
  // Paso 2 — Tu ubicación
  province: [required('Elegí tu provincia.')],
  canton: [required('Indicá tu cantón.'), maxLength(60)],
  district: [maxLength(60)],
  address: [maxLength(200)],
  googleMapsUrl: [url('Ingresá un enlace válido de Google Maps o Waze.'), maxLength(300)],
  // Paso 3 — Tu mascota
  petName: [required('¿Cómo se llama tu mascota?'), maxLength(60)],
  species: [required('Elegí la especie.')],
  speciesOther: [
    requiredIf((all) => text(all.species) === 'otra', 'Contanos qué tipo de animal es.'),
    maxLength(60),
  ],
  breed: [maxLength(60)],
  petAge: [required('Indicá una edad aproximada, por ejemplo "3 años".'), maxLength(40)],
  petSex: [required('Elegí una opción.')],
  petWeight: [numberBetween(0.01, 200, 'Ingresá un peso en kilos entre 0,01 y 200.')],
  // Paso 4 — Qué necesita
  needs: [required('Elegí al menos una opción.')],
  needsOther: [
    requiredIf((all) => list(all, 'needs').includes('otro'), 'Contanos qué otra necesidad tiene.'),
    maxLength(100),
  ],
  procedure: [required('Contanos qué procedimiento o servicio querés cotizar.'), maxLength(150)],
  description: [maxLength(1000)],
  urgency: [required('Elegí qué tan pronto necesitás resolverlo.')],
  // Paso 5 — Salud de tu mascota (todo opcional)
  diagnosis: [maxLength(1000)],
  conditions: [maxLength(1000)],
  supportingFiles: [validFiles()],
  // Paso 6 — Cotización (todo opcional salvo la pregunta inicial)
  hasQuote: [required('Elegí una opción.')],
  quoteFiles: [validFiles()],
  quoteAmount: [numberBetween(0, 1_000_000_000, 'Ingresá un monto válido, por ejemplo 150000.')],
  quoteProcedure: [maxLength(200)],
  quoteIncludes: [maxLength(1000)],
  quoteExcludes: [maxLength(1000)],
  quoteDate: [notFutureDate()],
  quoteClinic: [maxLength(120)],
  // Paso 7 — Presupuesto y preferencias
  factorsOther: [
    requiredIf((all) => list(all, 'factors').includes('otro'), 'Contanos qué otro factor es importante.'),
    maxLength(100),
  ],
  additionalNotes: [maxLength(1000)],
  acceptPrivacy: [required('Necesitamos tu aceptación para poder enviar la solicitud.')],
};

function buildQuote({ values, files }: BuildContext): QuoteInformation {
  const hasQuote = str(values, 'hasQuote') as HasQuote;
  if (hasQuote !== 'si') return { hasQuote };

  const amount = num(values, 'quoteAmount');
  const reasons = list(values, 'lookingBecause');
  return {
    hasQuote,
    files: files.quoteFiles,
    totalAmount: amount,
    // La moneda solo tiene sentido si hay monto.
    currency: amount === undefined ? undefined : (str(values, 'quoteCurrency') as Currency),
    procedure: opt(values, 'quoteProcedure'),
    includes: opt(values, 'quoteIncludes'),
    excludes: opt(values, 'quoteExcludes'),
    unsureWhatIncludes: list(values, 'quoteUnsure').length > 0 || undefined,
    approximateDate: opt(values, 'quoteDate'),
    clinicName: opt(values, 'quoteClinic'),
    lookingBecause: reasons.length > 0 ? reasons : undefined,
  };
}

export function buildOwnerPayload(context: BuildContext): OwnerRequest {
  const { values, files, metadata } = context;
  const species = str(values, 'species');
  const needs = list(values, 'needs');
  const factors = list(values, 'factors');

  return {
    owner: {
      firstName: str(values, 'firstName'),
      lastName: str(values, 'lastName'),
      phone: str(values, 'phone'),
      email: opt(values, 'email'),
      preferredContact: str(values, 'preferredContact'),
    },
    location: {
      province: str(values, 'province'),
      canton: str(values, 'canton'),
      district: opt(values, 'district'),
      address: opt(values, 'address'),
      googleMapsUrl: normalizeUrl(values.googleMapsUrl),
      coordinates: coordinates(values),
    },
    pet: {
      name: str(values, 'petName'),
      species,
      speciesOther: species === 'otra' ? opt(values, 'speciesOther') : undefined,
      breed: opt(values, 'breed'),
      approximateAge: str(values, 'petAge'),
      sex: str(values, 'petSex'),
      weightKg: num(values, 'petWeight'),
      sterilized: opt(values, 'sterilized'),
      vaccinesUpToDate: opt(values, 'vaccines'),
    },
    request: {
      needs,
      needsOther: needs.includes('otro') ? opt(values, 'needsOther') : undefined,
      procedure: str(values, 'procedure'),
      description: opt(values, 'description'),
      urgency: str(values, 'urgency'),
      additionalNotes: opt(values, 'additionalNotes'),
    },
    health: {
      diagnosis: opt(values, 'diagnosis'),
      conditions: opt(values, 'conditions'),
      documents: files.supportingFiles,
    },
    quote: buildQuote(context),
    preferences: {
      budgetRange: opt(values, 'budgetRange'),
      travelDistance: opt(values, 'travelDistance'),
      factors,
      factorsOther: factors.includes('otro') ? opt(values, 'factorsOther') : undefined,
    },
    metadata,
  };
}

export function initOwnerForm(card: HTMLElement): void {
  initMultiStepForm<OwnerRequest>(card, {
    formType: 'owner_request',
    schema: ownerSchema,
    buildPayload: buildOwnerPayload,
    submit: submitOwnerForm,
  });
}
