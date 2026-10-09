/** Archivo adjunto serializado para enviarse dentro del JSON (el frontend no lo guarda ni lo procesa). */
export interface UploadedFile {
  name: string;
  /** MIME type reportado por el navegador. */
  mimeType: string;
  /** Tamaño original en bytes. */
  sizeBytes: number;
  /** Contenido en base64, sin el prefijo `data:...;base64,`. */
  contentBase64: string;
}

export type HasQuote = 'si' | 'no' | 'no_seguro';
export type Currency = 'CRC' | 'USD';

export interface QuoteInformation {
  hasQuote: HasQuote;
  /** Solo si hasQuote === 'si' y el usuario adjuntó archivos (hasta 3). */
  files?: UploadedFile[];
  totalAmount?: number;
  currency?: Currency;
  /** Procedimiento que indica la cotización (puede diferir del que busca cotizar). */
  procedure?: string;
  includes?: string;
  excludes?: string;
  /** El usuario marcó "No estoy seguro de qué incluye". */
  unsureWhatIncludes?: boolean;
  /** Formato YYYY-MM-DD. */
  approximateDate?: string;
  clinicName?: string;
  /** Por qué busca otra opción: 'cara' | 'segunda_opinion' | 'no_entiendo' | 'comparar'. */
  lookingBecause?: string[];
}
