/**
 * Botón opcional "Usar mi ubicación actual" (solo frontend).
 *
 * Solo pide la ubicación al navegador cuando la persona toca el botón. Guarda latitud, longitud y
 * precisión en campos ocultos del formulario (geoLat, geoLng, geoAccuracy) para que viajen en el POST;
 * no se guarda en ningún otro lado. Si el permiso se niega o falla, el formulario sigue igual.
 *
 * Contrato del HTML (components/form/LocationPicker.astro):
 *  [data-location-picker] · [data-geo-request] · [data-geo-clear] · [data-geo-status] · inputs [name^="geo"]
 */

const DECIMALS = 5; // ~1 m: de sobra para buscar clínicas cercanas

const MESSAGES = {
  unsupported: 'Tu navegador no permite compartir la ubicación. Podés seguir sin ella.',
  denied:
    'No pudimos acceder a tu ubicación (permiso denegado). No pasa nada: completá la provincia y el cantón.',
  unavailable: 'No pudimos detectar tu ubicación ahora. Podés intentar de nuevo o seguir sin ella.',
  timeout: 'Tardó demasiado en detectar tu ubicación. Podés intentar de nuevo o seguir sin ella.',
} as const;

function errorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return MESSAGES.denied;
  if (error.code === error.TIMEOUT) return MESSAGES.timeout;
  return MESSAGES.unavailable;
}

function setupPicker(picker: HTMLElement, form: HTMLFormElement): void {
  const requestButton = picker.querySelector<HTMLButtonElement>('[data-geo-request]');
  const clearButton = picker.querySelector<HTMLButtonElement>('[data-geo-clear]');
  const status = picker.querySelector<HTMLElement>('[data-geo-status]');
  const lat = picker.querySelector<HTMLInputElement>('input[name="geoLat"]');
  const lng = picker.querySelector<HTMLInputElement>('input[name="geoLng"]');
  const accuracy = picker.querySelector<HTMLInputElement>('input[name="geoAccuracy"]');
  if (!requestButton || !clearButton || !status || !lat || !lng || !accuracy) return;

  const idleLabel = requestButton.textContent ?? 'Usar mi ubicación actual';

  const say = (message: string, isError = false): void => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };

  function clear(message = ''): void {
    lat!.value = lng!.value = accuracy!.value = '';
    clearButton!.hidden = true;
    requestButton!.textContent = idleLabel;
    say(message);
  }

  function setBusy(busy: boolean): void {
    requestButton!.disabled = busy;
    requestButton!.textContent = busy ? 'Buscando tu ubicación…' : idleLabel;
  }

  requestButton.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      say(MESSAGES.unsupported, true);
      return;
    }
    setBusy(true);
    say('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat.value = position.coords.latitude.toFixed(DECIMALS);
        lng.value = position.coords.longitude.toFixed(DECIMALS);
        accuracy.value = String(Math.round(position.coords.accuracy));
        setBusy(false);
        requestButton.textContent = 'Actualizar mi ubicación';
        clearButton.hidden = false;
        say(`Ubicación guardada (precisión aproximada de ±${accuracy.value} m).`);
      },
      (error) => {
        setBusy(false);
        say(errorMessage(error), true);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });

  clearButton.addEventListener('click', () => {
    clear('Quitamos tu ubicación.');
    requestButton.focus();
  });

  // `form.reset()` no limpia los campos ocultos: lo hacemos nosotros al terminar el envío.
  form.addEventListener('reset', () => setTimeout(() => clear(), 0));
}

export function initLocationPickers(form: HTMLFormElement): void {
  for (const picker of Array.from(form.querySelectorAll<HTMLElement>('[data-location-picker]'))) {
    setupPicker(picker, form);
  }
}
