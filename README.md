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
- **Error de red / HTTP / timeout:** apuntá la URL a un destino caído o que responda con error; se muestra un mensaje claro y los datos escritos se conservan para reintentar. El timeout es de 30 segundos (`REQUEST_TIMEOUT_MS`).
- **Validación:** dejá campos obligatorios vacíos, un correo o teléfono inválido, o adjuntá un archivo no permitido o mayor a 5 MB.

## Estructura del frontend

```
src/
  components/
    Header.astro  Hero.astro  Problem.astro  HowItWorks.astro
    TrustSection.astro  FAQ.astro  Footer.astro  Icon.astro
    OwnerForm/        # formulario multi-step de propietarios (+ esquema y payload)
    VeterinaryForm/   # formulario multi-step de veterinarias (+ esquema y payload)
    form/             # piezas reutilizables: Field, Choice, Step, FormShell, Consent
  layouts/Layout.astro    # <head>, SEO, Open Graph, header y footer
  lib/
    api.ts          # submitForm / submitOwnerForm / submitVeterinaryForm (fetch POST)
    multistep.ts    # motor del formulario por pasos (progreso, validación, estados)
    validation.ts   # validadores (correo, teléfono, URL, archivos, fechas…)
    payload.ts      # armado del payload y lectura de archivos a base64
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
    "preferredContact": "whatsapp",            // whatsapp | llamada | correo
    "province": "San José", "canton": "Escazú", "district": "San Rafael"  // district opcional
  },
  "pet": {
    "name": "Luna", "species": "perro",        // perro | gato | ave | reptil | roedor | pez | otra
    "speciesOther": "…",                       // solo si species = "otra"
    "approximateAge": "3 años",
    "sex": "hembra",                           // macho | hembra | no_seguro | prefiero_no_indicar
    "weightKg": 12.5                           // opcional
  },
  "request": {
    "needs": ["cirugia", "radiografia"],       // selección múltiple
    "needsOther": "…",                         // solo si incluye "otro"
    "description": "Texto libre",
    "urgency": "esta_semana"                   // hoy | 24_horas | esta_semana | proximas_semanas | averiguando
  },
  "quote": {
    "hasQuote": "si",                          // si | no | no_seguro
    // Lo siguiente solo existe si hasQuote = "si" (todo opcional):
    "file": { "name": "cotizacion.pdf", "mimeType": "application/pdf", "sizeBytes": 123456, "contentBase64": "…" },
    "totalAmount": 350000, "currency": "CRC",  // CRC | USD (la moneda solo viaja si hay monto)
    "procedure": "…", "includes": "…", "excludes": "…",
    "unsureWhatIncludes": true,
    "approximateDate": "2026-10-01", "clinicName": "…"
  },
  "preferences": {
    "budgetRange": "100k_250k",                // opcional (menos_50k … mas_1m | sin_definir)
    "travelDistance": "10_km",                 // opcional (cerca | 5_km | 10_km | 20_km | sin_limite)
    "factors": ["precio", "experiencia"],
    "factorsOther": "…"                        // solo si incluye "otro"
  },
  "metadata": {
    "formType": "owner_request",
    "timestamp": "2026-10-08T18:30:00.000Z",
    "source": "peti-landing",
    "formVersion": "1.0.0",
    "privacyAccepted": true
  }
}
```

### Veterinaria (`metadata.formType = "veterinary_registration"`)

```jsonc
{
  "contact": { "contactPerson": "…", "role": "…", "phone": "2222 2222", "whatsapp": "…", "email": "clinica@correo.com" },
  "clinic": { "name": "…", "tradeName": "…", "website": "https://…", "instagram": "@…", "facebook": "…", "googleMapsUrl": "https://…" },
  "location": { "province": "…", "canton": "…", "district": "…", "address": "…" },
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
  "metadata": { "formType": "veterinary_registration", "timestamp": "…", "source": "peti-landing", "formVersion": "1.0.0", "privacyAccepted": true }
}
```

## Preparado para más adelante (sin implementar)

- **Anti-spam:** `getAntiSpamToken()` en `src/lib/api.ts` es el punto de enlace para Turnstile o un CAPTCHA; el token viajaría en `metadata.antiSpamToken`.
- **Analytics:** `track()` en `src/lib/analytics.ts` publica un `CustomEvent` `peti:analytics` en `window`. No hay ninguna plataforma conectada.

## Fuera de alcance

Backend, base de datos, autenticación, pagos, dashboard, OCR, almacenamiento o procesamiento de archivos y cualquier lógica posterior al envío.
