/**
 * Motor de formularios multi-paso (solo frontend). Lo usan los dos formularios.
 *
 * Contrato del HTML (lo genera components/form/FormShell.astro):
 *  - [data-form-root]            el <form>
 *  - [data-step]                 cada paso (sección) con data-title
 *  - [data-field="nombre"]       contenedor de un campo; dentro, [data-error] para el mensaje
 *  - [data-show-when="campo=a|b"] muestra el bloque solo si el campo vale a o b (y deshabilita sus inputs)
 *  - [data-prev] [data-next] [data-submit] botones de navegación
 *  - [data-panel="success|error|config"] paneles de estado
 */
import { getAntiSpamToken, isApiConfigured } from './api';
import { track } from './analytics';
import { initLocationPickers } from './geolocation';
import { buildMetadata, checked, fileToUploadedFile } from './payload';
import {
  filesOf,
  validateField,
  validateFields,
  type Errors,
  type FieldValue,
  type Schema,
  type Values,
} from './validation';
import type { FormMetadata, FormStatus, FormType, SubmitResult } from '../types/common';
import type { UploadedFile } from '../types/quote';

export interface BuildContext {
  values: Values;
  /** Archivos adjuntos ya serializados, por nombre de campo (cada campo admite varios). */
  files: Record<string, UploadedFile[]>;
  metadata: FormMetadata;
}

export interface MultiStepConfig<TPayload> {
  formType: FormType;
  schema: Schema;
  buildPayload: (context: BuildContext) => TPayload;
  submit: (payload: TPayload) => Promise<SubmitResult>;
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isControl = (el: Element): el is Control =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLSelectElement ||
  el instanceof HTMLTextAreaElement;

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMultiStepForm<TPayload>(
  card: HTMLElement,
  config: MultiStepConfig<TPayload>,
): void {
  const form = card.querySelector<HTMLFormElement>('[data-form-root]');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
  const total = steps.length;
  const prevButton = form.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextButton = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submitButton = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submitButton.textContent ?? 'Enviar';
  const progressLabel = form.querySelector<HTMLElement>('[data-progress-label]');
  const progressTitle = form.querySelector<HTMLElement>('[data-progress-title]');
  const progressBar = form.querySelector<HTMLElement>('[data-progress-bar]');
  const progressTrack = form.querySelector<HTMLElement>('[role="progressbar"]');
  const errorPanel = card.querySelector<HTMLElement>('[data-panel="error"]');
  const errorMessage = card.querySelector<HTMLElement>('[data-error-message]');
  const successPanel = card.querySelector<HTMLElement>('[data-panel="success"]');
  const configPanel = card.querySelector<HTMLElement>('[data-panel="config"]');

  let current = 0;
  let status: FormStatus = 'idle';
  let started = false;
  let abandonedSent = false;

  // --- Estado ---------------------------------------------------------------

  function setStatus(next: FormStatus): void {
    status = next;
    card.dataset.status = next;
    const loading = next === 'loading';
    form!.setAttribute('aria-busy', String(loading));
    submitButton.disabled = loading;
    prevButton.disabled = loading;
    submitButton.textContent = loading ? 'Enviando…' : submitLabel;
  }

  function showError(message: string): void {
    if (!errorPanel || !errorMessage) return;
    errorMessage.textContent = message;
    errorPanel.hidden = false;
  }

  const hideError = (): void => {
    if (errorPanel) errorPanel.hidden = true;
  };

  // --- Lectura de valores ----------------------------------------------------

  function readValues(): Values {
    const values: Values = {};
    for (const el of Array.from(form!.elements)) {
      if (!isControl(el) || !el.name || el.disabled || el.name.startsWith('hp_')) continue;
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          const existing = values[el.name];
          const list = Array.isArray(existing)
            ? existing.filter((v): v is string => typeof v === 'string')
            : [];
          if (el.checked) list.push(el.value);
          values[el.name] = list;
          continue;
        }
        if (el.type === 'radio') {
          if (el.checked) values[el.name] = el.value;
          else if (!(el.name in values)) values[el.name] = '';
          continue;
        }
        if (el.type === 'file') {
          const picked = Array.from(el.files ?? []);
          values[el.name] = el.multiple ? picked : (picked[0] ?? null);
          continue;
        }
      }
      values[el.name] = el.value;
    }
    return values;
  }

  function fieldNames(root: ParentNode): string[] {
    const names = new Set<string>();
    for (const el of Array.from(root.querySelectorAll('[name]'))) {
      if (isControl(el) && el.name && !el.disabled && !el.name.startsWith('hp_')) names.add(el.name);
    }
    return Array.from(names);
  }

  // --- Campos condicionales --------------------------------------------------

  function updateConditionals(): void {
    const values = readValues();
    for (const block of Array.from(form!.querySelectorAll<HTMLElement>('[data-show-when]'))) {
      const [name, expected = ''] = (block.dataset.showWhen ?? '').split('=');
      const accepted = expected.split('|');
      const selected = values[name ?? ''];
      const visible = Array.isArray(selected)
        ? selected.some((v) => typeof v === 'string' && accepted.includes(v))
        : typeof selected === 'string' && accepted.includes(selected);
      block.hidden = !visible;
      for (const el of Array.from(block.querySelectorAll('input, select, textarea'))) {
        if (isControl(el)) el.disabled = !visible;
      }
      if (!visible) {
        for (const wrapper of Array.from(block.querySelectorAll<HTMLElement>('[data-field]'))) {
          setError(wrapper.dataset.field ?? '', null);
        }
      }
    }
  }

  // --- Errores ---------------------------------------------------------------

  function wrapperOf(name: string): HTMLElement | null {
    return form!.querySelector<HTMLElement>(`[data-field="${CSS.escape(name)}"]`);
  }

  function setError(name: string, message: string | null): void {
    const wrapper = wrapperOf(name);
    if (!wrapper) return;
    wrapper.classList.toggle('has-error', message !== null);
    for (const el of Array.from(wrapper.querySelectorAll('input, select, textarea'))) {
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
    const slot = wrapper.querySelector<HTMLElement>('[data-error]');
    if (slot) {
      slot.textContent = message ?? '';
      slot.hidden = message === null;
    }
  }

  function showErrors(errors: Errors, names: string[]): void {
    for (const name of names) setError(name, errors[name] ?? null);
  }

  function focusFirstError(errors: Errors, names: string[]): void {
    const first = names.find((name) => errors[name]);
    if (!first) return;
    const control = wrapperOf(first)?.querySelector<HTMLElement>('input, select, textarea');
    control?.focus({ preventScroll: false });
  }

  // --- Navegación ------------------------------------------------------------

  function renderProgress(): void {
    const step = steps[current]!;
    if (progressLabel) progressLabel.textContent = `Paso ${current + 1} de ${total}`;
    if (progressTitle) progressTitle.textContent = step.dataset.title ?? '';
    if (progressBar) progressBar.style.width = `${((current + 1) / total) * 100}%`;
    if (progressTrack) {
      progressTrack.setAttribute('aria-valuenow', String(current + 1));
      progressTrack.setAttribute('aria-valuetext', `Paso ${current + 1} de ${total}`);
    }
  }

  function goTo(index: number, moveFocus = true): void {
    current = Math.min(Math.max(index, 0), total - 1);
    steps.forEach((step, i) => {
      step.hidden = i !== current;
    });
    const last = current === total - 1;
    prevButton.hidden = current === 0;
    nextButton.hidden = last;
    submitButton.hidden = !last;
    hideError();
    renderProgress();
    if (moveFocus) {
      steps[current]!.querySelector<HTMLElement>('[data-step-heading]')?.focus({
        preventScroll: true,
      });
      const top = card.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) {
        card.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  }

  function validateStep(index: number): boolean {
    const names = fieldNames(steps[index]!);
    const errors = validateFields(names, readValues(), config.schema);
    showErrors(errors, names);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors, names);
      return false;
    }
    return true;
  }

  function next(): void {
    if (!validateStep(current)) return;
    track('form_step_completed', {
      formType: config.formType,
      step: current + 1,
      stepName: steps[current]!.dataset.title ?? '',
    });
    goTo(current + 1);
  }

  // --- Envío -----------------------------------------------------------------

  async function submit(): Promise<void> {
    if (status === 'loading') return;

    // Revalida todo por si el usuario volvió atrás y cambió algo.
    for (let i = 0; i < total; i++) {
      if (!validateStep(i)) {
        if (i !== current) goTo(i, false);
        return;
      }
    }

    hideError();
    setStatus('loading');

    const honeypot = form!.querySelector<HTMLInputElement>('[name^="hp_"]');
    if (honeypot && honeypot.value.trim() !== '') {
      // Probable bot: simulamos éxito sin enviar nada.
      finishSuccess();
      return;
    }

    try {
      const values = readValues();
      const files: Record<string, UploadedFile[]> = {};
      for (const [name, value] of Object.entries(values)) {
        const attached = filesOf(value);
        if (attached.length > 0) files[name] = await Promise.all(attached.map(fileToUploadedFile));
      }
      const metadata = buildMetadata(
        config.formType,
        checked(values, 'acceptPrivacy'),
        await getAntiSpamToken(),
      );
      const result = await config.submit(config.buildPayload({ values, files, metadata }));

      if (result.ok) {
        track('form_submitted', { formType: config.formType });
        finishSuccess();
      } else {
        setStatus('error');
        showError(result.message);
      }
    } catch {
      setStatus('error');
      showError('Ocurrió un error inesperado al preparar el envío. Intentá de nuevo.');
    }
  }

  function finishSuccess(): void {
    setStatus('success');
    form!.reset();
    updateConditionals();
    form!.hidden = true;
    if (successPanel) {
      successPanel.hidden = false;
      successPanel.focus({ preventScroll: true });
    }
    card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  // --- Archivos --------------------------------------------------------------

  // Archivos confirmados por campo. El input nativo se va reemplazando con cada selección,
  // así que guardamos la lista válida para poder ir agregando de a uno y revertir si algo falla.
  const accepted = new WeakMap<HTMLInputElement, File[]>();

  const sameFile = (a: File, b: File): boolean =>
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

  /** Deja en el input exactamente estos archivos (el navegador no permite editar `files` de otra forma). */
  function setInputFiles(input: HTMLInputElement, files: File[]): void {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
  }

  function renderFileList(input: HTMLInputElement): void {
    const list = input.closest<HTMLElement>('[data-field]')?.querySelector<HTMLElement>('[data-file-list]');
    if (!list) return;
    list.replaceChildren();
    Array.from(input.files ?? []).forEach((file, index) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${file.name} (${Math.max(1, Math.ceil(file.size / 1024))} KB)`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-ghost';
      remove.dataset.fileRemove = String(index);
      remove.textContent = 'Quitar';
      remove.setAttribute('aria-label', `Quitar archivo ${file.name}`);
      item.append(name, remove);
      list.append(item);
    });
  }

  function handleFileChange(input: HTMLInputElement): void {
    const previous = accepted.get(input) ?? [];
    const picked = Array.from(input.files ?? []);
    const merged = input.multiple
      ? [...previous, ...picked.filter((f) => !previous.some((p) => sameFile(p, f)))]
      : picked;
    setInputFiles(input, merged);

    const value = input.multiple ? merged : (merged[0] ?? null);
    const error = merged.length > 0 ? validateField(input.name, value, readValues(), config.schema) : null;
    if (error) {
      // Mantiene lo que ya estaba bien adjunto y avisa por qué no se agregó lo nuevo.
      setInputFiles(input, previous);
      setError(input.name, error);
    } else {
      setError(input.name, null);
      accepted.set(input, merged);
      for (const file of merged.filter((f) => !previous.some((p) => sameFile(p, f)))) {
        track('file_attached', {
          formType: config.formType,
          extension: file.name.split('.').pop()?.toLowerCase() ?? '',
          sizeKb: Math.ceil(file.size / 1024),
        });
      }
    }
    renderFileList(input);
  }

  function removeFile(input: HTMLInputElement, index: number): void {
    const remaining = Array.from(input.files ?? []).filter((_, i) => i !== index);
    setInputFiles(input, remaining);
    accepted.set(input, remaining);
    setError(input.name, null);
    renderFileList(input);
    input.focus();
  }

  // --- Eventos ---------------------------------------------------------------

  function markStarted(): void {
    abandonedSent = false;
    if (started) return;
    started = true;
    track('form_start', { formType: config.formType });
  }

  form.addEventListener('focusin', markStarted);
  form.addEventListener('input', markStarted);

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !isControl(target)) return;
    updateConditionals();

    if (target instanceof HTMLInputElement && target.type === 'file') handleFileChange(target);
  });

  // Corrige en vivo solo los campos que ya muestran un error.
  form.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !isControl(target) || !target.name) return;
    if (wrapperOf(target.name)?.classList.contains('has-error')) {
      const values = readValues();
      setError(target.name, validateField(target.name, values[target.name] ?? null, values, config.schema));
    }
  });

  // Al salir de un campo con contenido, avisa de formato inválido sin molestar por campos vacíos.
  form.addEventListener('focusout', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !isControl(target) || !target.name) return;
    if (target instanceof HTMLInputElement && ['file', 'radio', 'checkbox'].includes(target.type)) return;
    const values = readValues();
    const value: FieldValue = values[target.name] ?? null;
    if (typeof value === 'string' && value.trim() !== '') {
      setError(target.name, validateField(target.name, value, values, config.schema));
    }
  });

  form.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const remove = target.closest<HTMLElement>('[data-file-remove]');
    if (remove) {
      const input = remove
        .closest<HTMLElement>('[data-field]')
        ?.querySelector<HTMLInputElement>('input[type="file"]');
      if (input) removeFile(input, Number(remove.dataset.fileRemove));
    }
  });

  // `form.reset()` (al enviar con éxito) vacía los inputs de archivo: sincronizamos la lista visible.
  form.addEventListener('reset', () => {
    setTimeout(() => {
      for (const input of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'))) {
        accepted.set(input, []);
        renderFileList(input);
      }
    }, 0);
  });

  prevButton.addEventListener('click', () => goTo(current - 1));
  nextButton.addEventListener('click', next);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (current < total - 1) next();
    else void submit();
  });

  // Si el usuario se va a mitad del formulario, lo registramos una sola vez.
  const reportAbandon = (): void => {
    if (started && !abandonedSent && status !== 'success') {
      abandonedSent = true;
      track('form_abandoned', {
        formType: config.formType,
        step: current + 1,
        stepName: steps[current]?.dataset.title ?? '',
      });
    }
  };
  window.addEventListener('pagehide', reportAbandon);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportAbandon();
  });

  // --- Inicio ----------------------------------------------------------------

  if (configPanel && !isApiConfigured() && import.meta.env.DEV) configPanel.hidden = false;
  initLocationPickers(form);
  setStatus('idle');
  updateConditionals();
  goTo(0, false);
}
