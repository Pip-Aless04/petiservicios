/** Constantes y listas de opciones compartidas por el sitio y los formularios. */

export interface Option {
  value: string;
  label: string;
}

export const SITE = {
  name: 'Peti',
  tagline: 'Tu mascota, en las mejores manos.',
  locale: 'es-CR',
  description:
    'Compará opciones veterinarias en Costa Rica, entendé qué incluye cada cotización y encontrá alternativas cuando tu mascota necesite un procedimiento.',
  /**
   * Datos de contacto públicos. Completalos cuando existan:
   * si están vacíos, el footer enlaza a los formularios en lugar de inventar un contacto.
   */
  contact: {
    email: '',
    whatsapp: '',
  },
} as const;

// --- Envío de formularios -------------------------------------------------

export const FORM_SOURCE = 'peti-landing';
/** 1.1.0: el propietario envía `location` (antes en `owner`), `health` y archivos múltiples. */
export const FORM_VERSION = '1.1.0';
export const REQUEST_TIMEOUT_MS = 60_000;

// --- Archivos adjuntos (cotizaciones y documentos de salud) --------------------

export const ATTACHMENT = {
  extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  /** Tamaño máximo por archivo. */
  maxBytes: 5 * 1024 * 1024,
  maxLabel: '5 MB',
  /** Cantidad máxima de archivos por campo. */
  maxFiles: 3,
  /** Tope entre todos los archivos del formulario (viajan en base64 dentro del JSON). */
  maxTotalBytes: 12 * 1024 * 1024,
  maxTotalLabel: '12 MB',
} as const;

// --- Opciones compartidas -------------------------------------------------

export const PROVINCES: Option[] = [
  { value: 'San José', label: 'San José' },
  { value: 'Alajuela', label: 'Alajuela' },
  { value: 'Cartago', label: 'Cartago' },
  { value: 'Heredia', label: 'Heredia' },
  { value: 'Guanacaste', label: 'Guanacaste' },
  { value: 'Puntarenas', label: 'Puntarenas' },
  { value: 'Limón', label: 'Limón' },
];

export const YES_NO: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
];

// --- Propietarios ----------------------------------------------------------

export const CONTACT_METHODS: Option[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'correo', label: 'Correo' },
];

export const SPECIES: Option[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'roedor', label: 'Roedor' },
  { value: 'pez', label: 'Pez' },
  { value: 'otra', label: 'Otra' },
];

export const PET_SEX: Option[] = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
  { value: 'no_seguro', label: 'No estoy seguro/a' },
  { value: 'prefiero_no_indicar', label: 'Prefiero no indicarlo' },
];

export const PET_NEEDS: Option[] = [
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'dental', label: 'Procedimiento dental' },
  { value: 'diagnostico', label: 'Examen / diagnóstico' },
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'ultrasonido', label: 'Ultrasonido' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'consulta_especializada', label: 'Consulta especializada' },
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'esterilizacion', label: 'Esterilización / castración' },
  { value: 'emergencia', label: 'Emergencia' },
  { value: 'otro', label: 'Otro' },
];

export const URGENCY: Option[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: '24_horas', label: 'En las próximas 24 horas' },
  { value: 'esta_semana', label: 'Esta semana' },
  { value: 'proximas_semanas', label: 'Durante las próximas semanas' },
  { value: 'averiguando', label: 'Todavía estoy averiguando' },
];

export const HAS_QUOTE: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'no_seguro', label: 'No estoy seguro/a' },
];

export const YES_NO_UNSURE: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'no_se', label: 'No sé' },
];

export const QUOTE_REASONS: Option[] = [
  { value: 'cara', label: 'Me parece cara' },
  { value: 'segunda_opinion', label: 'Quiero una segunda opinión' },
  { value: 'no_entiendo', label: 'No entiendo qué incluye' },
  { value: 'comparar', label: 'Quiero comparar opciones' },
];

export const CURRENCIES: Option[] = [
  { value: 'CRC', label: '₡ Colones' },
  { value: 'USD', label: '$ Dólares' },
];

export const BUDGET_RANGES: Option[] = [
  { value: 'menos_50k', label: 'Menos de ₡50.000' },
  { value: '50k_100k', label: '₡50.000–₡100.000' },
  { value: '100k_250k', label: '₡100.000–₡250.000' },
  { value: '250k_500k', label: '₡250.000–₡500.000' },
  { value: '500k_1m', label: '₡500.000–₡1.000.000' },
  { value: 'mas_1m', label: 'Más de ₡1.000.000' },
  { value: 'sin_definir', label: 'No tengo un presupuesto definido' },
];

export const TRAVEL_DISTANCE: Option[] = [
  { value: 'cerca', label: 'Solo cerca de mi zona' },
  { value: '5_km', label: 'Hasta 5 km' },
  { value: '10_km', label: 'Hasta 10 km' },
  { value: '20_km', label: 'Hasta 20 km' },
  { value: 'sin_limite', label: 'No me importa la distancia si la opción lo vale' },
];

export const OWNER_FACTORS: Option[] = [
  { value: 'precio', label: 'Precio' },
  { value: 'experiencia', label: 'Experiencia' },
  { value: 'especializacion', label: 'Especialización' },
  { value: 'reputacion', label: 'Reputación' },
  { value: 'ubicacion', label: 'Ubicación' },
  { value: 'disponibilidad', label: 'Disponibilidad' },
  { value: 'que_incluye', label: 'Qué incluye la cotización' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'seguimiento', label: 'Seguimiento posterior' },
  { value: 'facilidad_pago', label: 'Facilidad de pago' },
  { value: 'otro', label: 'Otro' },
];

// --- Veterinarias ----------------------------------------------------------

export const VET_SERVICES: Option[] = [
  { value: 'consulta_general', label: 'Consulta general' },
  { value: 'consulta_especializada', label: 'Consulta especializada' },
  { value: 'emergencias', label: 'Emergencias' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'odontologia', label: 'Odontología' },
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'ultrasonido', label: 'Ultrasonido' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'dermatologia', label: 'Dermatología' },
  { value: 'cardiologia', label: 'Cardiología' },
  { value: 'oncologia', label: 'Oncología' },
  { value: 'ortopedia', label: 'Ortopedia' },
  { value: 'neurologia', label: 'Neurología' },
  { value: 'oftalmologia', label: 'Oftalmología' },
  { value: 'reproduccion', label: 'Reproducción' },
  { value: 'otro', label: 'Otro' },
];

export const VET_SPECIES: Option[] = [
  { value: 'perros', label: 'Perros' },
  { value: 'gatos', label: 'Gatos' },
  { value: 'aves', label: 'Aves' },
  { value: 'reptiles', label: 'Reptiles' },
  { value: 'roedores', label: 'Roedores' },
  { value: 'peces', label: 'Peces' },
  { value: 'exoticos', label: 'Exóticos' },
  { value: 'otros', label: 'Otros' },
];

/** Preguntas Sí/No de capacidad: `name` coincide con las claves de VeterinaryCapabilities. */
export const VET_CAPABILITIES: { name: string; label: string }[] = [
  { name: 'emergencies', label: '¿Atienden emergencias?' },
  { name: 'hospitalization', label: '¿Tienen hospitalización?' },
  { name: 'surgeryRoom', label: '¿Tienen quirófano?' },
  { name: 'specialists', label: '¿Trabajan con especialistas?' },
  { name: 'diagnostics', label: '¿Realizan procedimientos de diagnóstico?' },
  { name: 'weekends', label: '¿Atienden fines de semana?' },
  { name: 'open24h', label: '¿Atienden 24/7?' },
];

export const VET_INTEREST: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'probablemente', label: 'Probablemente' },
  { value: 'conocer_mas', label: 'Me gustaría conocer más' },
  { value: 'no_por_ahora', label: 'No por ahora' },
];

export const VET_REQUEST_TYPES: Option[] = [
  { value: 'cirugias', label: 'Cirugías' },
  { value: 'consultas_especializadas', label: 'Consultas especializadas' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'odontologia', label: 'Odontología' },
  { value: 'procedimientos', label: 'Procedimientos' },
  { value: 'emergencias', label: 'Emergencias' },
  { value: 'otros', label: 'Otros' },
];

export const VET_PREPARES_QUOTES: Option[] = [
  { value: 'si', label: 'Sí' },
  { value: 'algunas_veces', label: 'Algunas veces' },
  { value: 'no', label: 'No' },
];

export const VET_QUOTE_CHANNELS: Option[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'correo', label: 'Correo' },
  { value: 'pdf', label: 'PDF' },
  { value: 'documento', label: 'Documento' },
  { value: 'verbalmente', label: 'Verbalmente' },
  { value: 'otro', label: 'Otro' },
];

export const VET_QUOTE_CONTENTS: Option[] = [
  { value: 'procedimiento', label: 'Procedimiento' },
  { value: 'precio', label: 'Precio' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'anestesia', label: 'Anestesia' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'examenes', label: 'Exámenes' },
  { value: 'controles', label: 'Controles' },
  { value: 'otros', label: 'Otros' },
];

export const VET_RESPONSE_TIME: Option[] = [
  { value: 'menos_30_min', label: 'Menos de 30 minutos' },
  { value: '30_min_2_h', label: '30 min – 2 horas' },
  { value: '2_6_h', label: '2–6 horas' },
  { value: '6_24_h', label: '6–24 horas' },
  { value: 'mas_24_h', label: 'Más de 24 horas' },
  { value: 'depende', label: 'Depende del procedimiento' },
];

export const VET_BUSINESS_MODEL: Option[] = [
  { value: 'pago_por_referido', label: 'Pagar por cliente referido' },
  { value: 'suscripcion_mensual', label: 'Suscripción mensual' },
  { value: 'comision', label: 'Comisión por procedimiento realizado' },
  { value: 'no_se', label: 'Todavía no lo sé' },
  { value: 'ninguno', label: 'Ninguno' },
];
