/** Esquema de validación y armado del payload del formulario de propietarios. */
import { submitOwnerForm } from '../../lib/api';
import { initMultiStepForm, type BuildContext } from '../../lib/multistep';
import { list, num, opt, str } from '../../lib/payload';
import {
  email,
  maxLength,
  notFutureDate,
  numberBetween,
  phone,
  required,
  requiredIf,
  text,
  validFile,
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
  // Paso 2 — Ubicación y movilidad
  province: [required('Elegí tu provincia.')],
  canton: [required('Indicá tu cantón.'), maxLength(60)],
  district: [maxLength(60)],
  // Paso 3 — Tu mascota
  petName: [required('¿Cómo se llama tu mascota?'), maxLength(60)],
  species: [required('Elegí la especie.')],
  speciesOther: [
    requiredIf((all) => text(all.species) === 'otra', 'Contanos qué tipo de animal es.'),
    maxLength(60),
  ],
  petAge: [required('Indicá una edad aproximada, por ejemplo "3 años".'), maxLength(40)],
  petSex: [required('Elegí una opción.')],
  petWeight: [numberBetween(0.01, 200, 'Ingresá un peso en kilos entre 0,01 y 200.')],
  // Paso 4 — Qué necesita
  needs: [required('Elegí al menos una opción.')],
  needsOther: [
    requiredIf((all) => list(all, 'needs').includes('otro'), 'Contanos qué otra necesidad tiene.'),
    maxLength(100),
  ],
  description: [required('Contanos brevemente qué necesitás.'), maxLength(1000)],
  urgency: [required('Elegí qué tan pronto necesitás resolverlo.')],
  // Paso 5 — Cotización (todo opcional salvo la pregunta inicial)
  hasQuote: [required('Elegí una opción.')],
  quoteFile: [validFile()],
  quoteAmount: [numberBetween(0, 1_000_000_000, 'Ingresá un monto válido, por ejemplo 150000.')],
  quoteProcedure: [maxLength(200)],
  quoteIncludes: [maxLength(1000)],
  quoteExcludes: [maxLength(1000)],
  quoteDate: [notFutureDate()],
  quoteClinic: [maxLength(120)],
  // Paso 6 — Presupuesto y preferencias
  factorsOther: [
    requiredIf((all) => list(all, 'factors').includes('otro'), 'Contanos qué otro factor es importante.'),
    maxLength(100),
  ],
  acceptPrivacy: [required('Necesitamos tu aceptación para poder enviar la solicitud.')],
};

function buildQuote({ values, files }: BuildContext): QuoteInformation {
  const hasQuote = str(values, 'hasQuote') as HasQuote;
  if (hasQuote !== 'si') return { hasQuote };

  const amount = num(values, 'quoteAmount');
  return {
    hasQuote,
    file: files.quoteFile,
    totalAmount: amount,
    // La moneda solo tiene sentido si hay monto.
    currency: amount === undefined ? undefined : (str(values, 'quoteCurrency') as Currency),
    procedure: opt(values, 'quoteProcedure'),
    includes: opt(values, 'quoteIncludes'),
    excludes: opt(values, 'quoteExcludes'),
    unsureWhatIncludes: list(values, 'quoteUnsure').length > 0 || undefined,
    approximateDate: opt(values, 'quoteDate'),
    clinicName: opt(values, 'quoteClinic'),
  };
}

export function buildOwnerPayload(context: BuildContext): OwnerRequest {
  const { values, metadata } = context;
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
      province: str(values, 'province'),
      canton: str(values, 'canton'),
      district: opt(values, 'district'),
    },
    pet: {
      name: str(values, 'petName'),
      species,
      speciesOther: species === 'otra' ? opt(values, 'speciesOther') : undefined,
      approximateAge: str(values, 'petAge'),
      sex: str(values, 'petSex'),
      weightKg: num(values, 'petWeight'),
    },
    request: {
      needs,
      needsOther: needs.includes('otro') ? opt(values, 'needsOther') : undefined,
      description: str(values, 'description'),
      urgency: str(values, 'urgency'),
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
