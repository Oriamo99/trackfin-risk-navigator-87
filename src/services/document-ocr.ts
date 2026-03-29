// ─── Mistral OCR Document Analysis Service ──────────────────────────────
// Sends documents to Mistral OCR API for structured data extraction.
// Auto-detects document type via a single universal prompt.

import { AUTO_DETECT_PROMPT, type DetectedDocumentType } from '@/config/ocr-prompts';
import type { PhysicalPerson, LegalEntity } from '@/types';

const MISTRAL_BASE_URL = import.meta.env.DEV
  ? '/mistral-api'
  : (import.meta.env.VITE_MISTRAL_PROXY_URL as string || 'https://api.mistral.ai');

// ─── Types ────────────────────────────────────────────────────────────────

export interface OcrExtraction {
  success: boolean;
  fileName: string;
  detectedType: DetectedDocumentType;
  confidence: number;
  personType: 'physical' | 'legal';
  rawMarkdown: string;
  fields: Record<string, string | null>;
  errorMessage?: string;
  processedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/** Check if Mistral API key is configured */
export function isMistralConfigured(): boolean {
  const key = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;
  return !!key?.trim();
}

function convertDateToISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

// ─── Main OCR function ────────────────────────────────────────────────────

export async function analyzeDocument(file: File): Promise<OcrExtraction> {
  const processedAt = new Date().toISOString();
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY as string;

  const fail = (msg: string): OcrExtraction => ({
    success: false,
    fileName: file.name,
    detectedType: 'autre',
    confidence: 0,
    personType: 'physical',
    rawMarkdown: '',
    fields: {},
    errorMessage: msg,
    processedAt,
  });

  if (!apiKey) return fail('Clé API Mistral non configurée (VITE_MISTRAL_API_KEY)');
  if (!isImage(file) && !isPdf(file)) return fail('Format non supporté. Utilisez JPEG, PNG ou PDF.');

  try {
    const base64DataUri = await fileToBase64(file);

    const document = isPdf(file)
      ? { type: 'document_url' as const, document_url: base64DataUri }
      : { type: 'image_url' as const, image_url: base64DataUri };

    const body = {
      model: 'mistral-ocr-latest',
      document,
      document_annotation_format: {
        type: 'json_schema',
        json_schema: {
          name: 'document_extraction',
          schema: {
            type: 'object',
            properties: {
              detected_type: {
                type: 'string',
                enum: ['cni', 'passeport', 'kbis', 'justificatif_domicile', 'autre'],
              },
              confidence: { type: 'number' },
              person_type: {
                type: 'string',
                enum: ['physical', 'legal'],
              },
              fields: {
                type: 'object',
                additionalProperties: { type: ['string', 'null'] },
              },
            },
            required: ['detected_type', 'confidence', 'person_type', 'fields'],
          },
        },
      },
      document_annotation_prompt: AUTO_DETECT_PROMPT,
      ...(isPdf(file) ? { pages: [0] } : {}),
    };

    const response = await fetch(`${MISTRAL_BASE_URL}/v1/ocr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(
        (errorData.message as string) || `Erreur API Mistral OCR (${response.status})`
      );
    }

    const data: {
      pages?: Array<{ markdown?: string }>;
      document_annotation?: string;
    } = await response.json();

    const rawMarkdown = (data.pages ?? [])
      .map((p) => p.markdown ?? '')
      .join('\n\n');

    let parsed: {
      detected_type?: string;
      confidence?: number;
      person_type?: string;
      fields?: Record<string, string | null>;
    } = {};

    if (data.document_annotation) {
      try {
        const cleaned = data.document_annotation
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // JSON parse failed — return raw markdown only
      }
    }

    const detectedType = (parsed.detected_type ?? 'autre') as DetectedDocumentType;
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
    const personType = parsed.person_type === 'legal' ? 'legal' as const : 'physical' as const;

    return {
      success: true,
      fileName: file.name,
      detectedType,
      confidence,
      personType,
      rawMarkdown,
      fields: parsed.fields ?? {},
      processedAt,
    };
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erreur OCR inconnue');
  }
}

// ─── OCR → Form Field Mappers ─────────────────────────────────────────────

export function mapToPhysicalPerson(
  fields: Record<string, string | null>,
): Partial<PhysicalPerson> {
  const result: Partial<PhysicalPerson> = {};

  if (fields.last_name) result.lastName = fields.last_name;
  if (fields.first_name) result.firstName = fields.first_name;
  if (fields.birth_date) result.birthDate = convertDateToISO(fields.birth_date);
  if (fields.birth_place) result.birthPlace = fields.birth_place;
  if (fields.nationality) result.nationality = fields.nationality;
  if (fields.address) result.address = fields.address;
  if (fields.city) result.city = fields.city;
  if (fields.postal_code) result.postalCode = fields.postal_code;
  if (fields.country) result.country = fields.country;
  if (fields.document_type) result.idDocument = fields.document_type;
  if (fields.document_number) result.idNumber = fields.document_number;

  return result;
}

export function mapToLegalEntity(
  fields: Record<string, string | null>,
): Partial<LegalEntity> {
  const result: Partial<LegalEntity> = {};

  if (fields.company_name) result.companyName = fields.company_name;
  if (fields.legal_form) result.legalForm = fields.legal_form;
  if (fields.siret) result.siret = fields.siret;
  else if (fields.siren) result.siret = fields.siren;
  if (fields.address) result.address = fields.address;
  if (fields.city) result.city = fields.city;
  if (fields.postal_code) result.postalCode = fields.postal_code;
  if (fields.activity) result.activity = fields.activity;
  if (fields.representative_name) result.representativeName = fields.representative_name;
  if (fields.representative_position) result.representativePosition = fields.representative_position;

  return result;
}

/** Map extracted fields based on auto-detected person type. */
export function mapExtractedFields(
  extraction: OcrExtraction,
): { personType: 'physical' | 'legal'; physicalFields: Partial<PhysicalPerson>; legalFields: Partial<LegalEntity> } {
  if (extraction.personType === 'legal') {
    return {
      personType: 'legal',
      physicalFields: {},
      legalFields: mapToLegalEntity(extraction.fields),
    };
  }
  return {
    personType: 'physical',
    physicalFields: mapToPhysicalPerson(extraction.fields),
    legalFields: {},
  };
}
