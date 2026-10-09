/**
 * Abstracción mínima de eventos. Todavía no hay ninguna plataforma conectada:
 * cada evento se publica como un CustomEvent `peti:analytics` en `window`, y
 * si más adelante se agrega un proveedor basta con suscribirse en un solo lugar:
 *
 *   window.addEventListener('peti:analytics', (e) => provider.track(e.detail));
 */

export type AnalyticsEventName =
  | 'cta_owner_click'
  | 'cta_vet_click'
  | 'form_start'
  | 'form_step_completed'
  | 'form_abandoned'
  | 'form_submitted'
  | 'file_attached';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

export function track(name: AnalyticsEventName, properties?: AnalyticsEvent['properties']): void {
  if (typeof window === 'undefined') return;
  const event: AnalyticsEvent = { name, properties, timestamp: new Date().toISOString() };
  window.dispatchEvent(new CustomEvent<AnalyticsEvent>('peti:analytics', { detail: event }));
  if (import.meta.env.DEV) console.debug('[analytics]', name, properties ?? {});
}

/** Los enlaces con `data-track="cta_owner_click"` (etc.) emiten su evento al hacer clic. */
export function trackClicks(): void {
  document.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-track]');
    const name = target?.dataset.track as AnalyticsEventName | undefined;
    if (name) track(name, { location: target?.dataset.trackLocation ?? 'unknown' });
  });
}
