# Peti — landing page

Landing de **Peti** (Costa Rica): explica el servicio y recopila solicitudes de propietarios y registros de veterinarias.

> **Este proyecto es solo frontend.** No hay backend, API, base de datos ni almacenamiento.
> Los formularios validan en el navegador y hacen un `POST` con JSON a la URL configurada en `PUBLIC_FORM_API_URL`. Lo que ocurre después del envío queda fuera de este repositorio.

Stack: Astro + TypeScript + CSS moderno (mobile-first). Sin React ni otras dependencias de interfaz.

## Instalación

Requiere Node.js 22.12 o superior (lo exige Astro 7).

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:4321
npm run build    # genera el sitio estático en dist/
npm run preview  # sirve dist/ para revisarlo localmente
npm run check    # verifica tipos (astro check)
```

## Variable de entorno: `PUBLIC_FORM_API_URL`

Es la única variable configurable: la URL que recibe los `POST` de ambos formularios.

```bash
cp .env.example .env
# editá .env:
PUBLIC_FORM_API_URL=https://example.com/api/requests
```

- Es una variable `PUBLIC_*`: **queda visible en el navegador**. No pongas secretos, claves ni credenciales.
- Astro la incorpora al **compilar**, así que si la cambiás hay que volver a ejecutar `npm run build` (en desarrollo basta con reiniciar `npm run dev`).
- Si no está configurada, el formulario no inventa nada: al enviar muestra el mensaje _"Falta configurar PUBLIC_FORM_API_URL…"_.

### Cambiar la URL de destino

1. Cambiá el valor de `PUBLIC_FORM_API_URL` en `.env` (o en las variables de entorno de tu hosting).
2. Volvé a compilar (`npm run build`).

Ambos formularios usan la misma URL; el campo `metadata.formType` (`owner_request` o `veterinary_registration`) indica de cuál viene cada envío.

## Cómo probar los formularios

1. Configurá `PUBLIC_FORM_API_URL` con una URL que acepte `POST` con JSON (por ejemplo un receptor de pruebas de webhooks).
2. `npm run dev` y abrí la landing.
3. Completá cualquiera de los dos formularios (secciones _Para propietarios_ y _Para veterinarias_).
4. Revisá el cuerpo recibido en tu receptor, o la pestaña **Network** del navegador.

Para ver los otros estados:

- **Sin URL configurada:** dejá la variable vacía y enviá; aparece el aviso de configuración.
- **Error de red / HTTP / timeout:** apuntá la URL a un destino caído o que responda con error; se muestra un mensaje claro y los datos escritos se conservan para reintentar. El timeout es de 60 segundos (`REQUEST_TIMEOUT_MS`), pensado para envíos con archivos.
- **Validación:** dejá campos obligatorios vacíos, un correo o teléfono inválido, o adjuntá un archivo no permitido, de más de 5 MB, más de 3 archivos en un campo, o más de 12 MB entre todos los adjuntos.
- **Ubicación:** en el paso de ubicación, tocá _Usar mi ubicación actual_ y aceptá el permiso del navegador (necesita `localhost` o HTTPS). Si lo negás, el formulario sigue funcionando y solo se omiten las coordenadas.

## Estructura del frontend

```
src/
  components/
    Header.astro  Hero.astro  Problem.astro  HowItWorks.astro
    TrustSection.astro  FAQ.astro  Footer.astro  Icon.astro
    OwnerForm/        # formulario multi-step de propietarios (+ esquema y payload)
    VeterinaryForm/   # formulario multi-step de veterinarias (+ esquema y payload)
    form/             # piezas reutilizables: Field, Choice, Step, FormShell, Consent, LocationPicker
  layouts/Layout.astro    # <head>, SEO, Open Graph, header y footer
  lib/
    api.ts          # submitForm / submitOwnerForm / submitVeterinaryForm (fetch POST)
    multistep.ts    # motor del formulario por pasos (progreso, validación, estados)
    validation.ts   # validadores (correo, teléfono, URL, archivos, fechas…)
    payload.ts      # armado del payload y lectura de archivos a base64
    geolocation.ts  # botón opcional «Usar mi ubicación actual» (solo navegador)
    analytics.ts    # eventos de frontend (sin plataforma conectada)
    constants.ts    # textos, opciones de los formularios y límites
  types/            # interfaces TypeScript (solo frontend)
  pages/            # index.astro y privacidad.astro
  styles/global.css # tokens de diseño (colores de marca) y estilos globales
public/             # logo, favicon, imágenes, robots.txt
```

### Datos de contacto

El pie de página muestra correo y WhatsApp solo cuando están definidos en `SITE.contact` (`src/lib/constants.ts`). Están vacíos hasta que existan los datos reales. Cambiá también `site` en `astro.config.mjs` por el dominio real antes de publicar (se usa para el canónico, Open Graph y el sitemap).

## Formato de los payloads

Siempre `POST` con `Content-Type: application/json`. Los campos opcionales vacíos **no se envían**. Los valores de las opciones (`species`, `urgency`, etc.) son identificadores, no el texto mostrado; la lista completa está en `src/lib/constants.ts`.

### Propietario (`metadata.formType = "owner_request"`)

```jsonc
{
  "owner": {
    "firstName": "Ana", "lastName": "Mora", "phone": "8888 8888",
    "email": "ana@correo.com",                 // opcional (obligatorio si prefiere contacto por correo)
    "preferredContact": "whatsapp"             // whatsapp | llamada | correo
  },
  "location": {
    "province": "San José", "canton": "Escazú",
    "district": "San Rafael",                  // opcional
    "address": "200 m sur de la iglesia",      // opcional (señas)
    "googleMapsUrl": "https://maps.app.goo.gl/…",  // opcional (Google Maps o Waze)
    "coordinates": { "latitude": 9.91797, "longitude": -84.14012, "accuracyMeters": 25 }
                                               // solo si tocó «Usar mi ubicación actual»
  },
  "pet": {
    "name": "Luna", "species": "perro",        // perro | gato | ave | reptil | roedor | pez | otra
    "speciesOther": "…",                       // solo si species = "otra"
    "breed": "Labrador",                       // opcional
    "approximateAge": "3 años",
    "sex": "hembra",                           // macho | hembra | no_seguro | prefiero_no_indicar
    "weightKg": 12.5,                          // opcional
    "sterilized": "si",                        // opcional: si | no | no_se
    "vaccinesUpToDate": "no_se"                // opcional: si | no | no_se
  },
  "request": {
    "needs": ["cirugia", "radiografia"],       // selección múltiple
    "needsOther": "…",                         // solo si incluye "otro"
    "procedure": "Cirugía de rodilla",         // qué procedimiento o servicio quiere cotizar (obligatorio)
    "description": "Texto libre",              // opcional
    "urgency": "esta_semana",                  // hoy | 24_horas | esta_semana | proximas_semanas | averiguando
    "additionalNotes": "…"                     // opcional
  },
  "health": {                                  // todo opcional; el bloque siempre existe
    "diagnosis": "…", "conditions": "…",
    "documents": [ { "name": "rx.jpg", "mimeType": "image/jpeg", "sizeBytes": 123456, "contentBase64": "…" } ]
  },
  "quote": {
    "hasQuote": "si",                          // si | no | no_seguro
    // Lo siguiente solo existe si hasQuote = "si" (todo opcional):
    "files": [ { "name": "cotizacion.pdf", "mimeType": "application/pdf", "sizeBytes": 123456, "contentBase64": "…" } ],
    "totalAmount": 350000, "currency": "CRC",  // CRC | USD (la moneda solo viaja si hay monto)
    "procedure": "…", "includes": "…", "excludes": "…",
    "unsureWhatIncludes": true,
    "approximateDate": "2026-10-01", "clinicName": "…",
    "lookingBecause": ["cara", "segunda_opinion"]  // cara | segunda_opinion | no_entiendo | comparar
  },
  "preferences": {
    "budgetRange": "100k_250k",                // opcional (menos_50k … mas_1m | sin_definir)
    "travelDistance": "10_km",                 // opcional (cerca | 5_km | 10_km | 20_km | sin_limite)
    "factors": ["precio", "experiencia"],
    "factorsOther": "…"                        // solo si incluye "otro"
  },
  "metadata": {
    "formType": "owner_request",
    "timestamp": "2026-10-09T18:30:00.000Z",
    "source": "peti-landing",
    "formVersion": "1.1.0",
    "privacyAccepted": true
  }
}
```

**Archivos adjuntos.** Viajan dentro del JSON en base64 (`contentBase64`, sin el prefijo `data:`): PDF, JPG, JPEG, PNG o WEBP; máximo 5 MB por archivo, 3 archivos por campo (`quote.files` y `health.documents`) y 12 MB entre todos. Como el base64 pesa cerca de un tercio más, el servidor que reciba el POST debe aceptar cuerpos de unos 16 MB. Los límites se cambian en `ATTACHMENT` (`src/lib/constants.ts`).

**Cambios de la versión 1.1.0** respecto de la 1.0.0 (por si ya hay un receptor armado): `location` pasó a ser un bloque propio (antes `province`, `canton` y `district` estaban dentro de `owner`); `request.procedure` es nuevo y `request.description` ahora es opcional; `quote.file` pasó a ser `quote.files` (lista); y se agregaron `health`, `pet.breed`, `pet.sterilized`, `pet.vaccinesUpToDate`, `quote.lookingBecause` y `request.additionalNotes`.

### Veterinaria (`metadata.formType = "veterinary_registration"`)

```jsonc
{
  "contact": { "contactPerson": "…", "role": "…", "phone": "2222 2222", "whatsapp": "…", "email": "clinica@correo.com" },
  "clinic": { "name": "…", "tradeName": "…", "website": "https://…", "instagram": "@…", "facebook": "…", "googleMapsUrl": "https://…" },
  "location": {
    "province": "…", "canton": "…", "district": "…", "address": "…",
    "coordinates": { "latitude": 9.93, "longitude": -84.08, "accuracyMeters": 20 }  // solo si usó «Usar mi ubicación actual»
  },
  "services": {
    "offered": ["cirugia", "radiografia"], "offeredOther": "…",
    "species": ["perros", "gatos"], "speciesOther": "…"
  },
  "capabilities": {                            // true | false | null (sin respuesta)
    "emergencies": true, "hospitalization": true, "surgeryRoom": true,
    "specialists": false, "diagnostics": true, "weekends": true, "open24h": false
  },
  "commercial": {
    "interestedInRequests": "si",              // si | probablemente | conocer_mas | no_por_ahora
    "requestTypes": ["cirugias"], "requestTypesOther": "…",
    "preparesQuotes": "algunas_veces",         // si | algunas_veces | no
    "quoteChannels": ["whatsapp"], "quoteChannelsOther": "…",
    "quoteContents": ["precio"], "quoteContentsOther": "…",
    "responseTime": "2_6_h",
    "preferredBusinessModel": "…"              // solo investigación; el modelo comercial no está definido
  },
  "metadata": { "formType": "veterinary_registration", "timestamp": "…", "source": "peti-landing", "formVersion": "1.1.0", "privacyAccepted": true }
}
```

## Preparado para más adelante (sin implementar)

- **Anti-spam:** `getAntiSpamToken()` en `src/lib/api.ts` es el punto de enlace para Turnstile o un CAPTCHA; el token viajaría en `metadata.antiSpamToken`.
- **Analytics:** `track()` en `src/lib/analytics.ts` publica un `CustomEvent` `peti:analytics` en `window`. No hay ninguna plataforma conectada.

## Fuera de alcance

Backend, base de datos, autenticación, pagos, dashboard, OCR, almacenamiento o procesamiento de archivos y cualquier lógica posterior al envío.
