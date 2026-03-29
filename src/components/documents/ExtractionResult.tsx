import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from '@/config/ocr-prompts';
import type { OcrExtraction } from '@/services/document-ocr';

interface ExtractionResultProps {
  extraction: OcrExtraction;
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  last_name: 'Nom',
  first_name: 'Prénom',
  birth_date: 'Date de naissance',
  birth_place: 'Lieu de naissance',
  nationality: 'Nationalité',
  gender: 'Sexe',
  document_number: "N° du document",
  document_type: 'Type de document',
  expiry_date: "Date d'expiration",
  address: 'Adresse',
  company_name: 'Raison sociale',
  legal_form: 'Forme juridique',
  siren: 'SIREN',
  siret: 'SIRET',
  city: 'Ville',
  postal_code: 'Code postal',
  country: 'Pays',
  activity: 'Activité',
  capital: 'Capital social',
  representative_name: 'Représentant légal',
  representative_position: 'Fonction',
  registration_date: "Date d'immatriculation",
  holder_name: 'Titulaire',
  document_date: 'Date du document',
};

// Fields hidden from display
const HIDDEN_FIELDS = new Set(['mrz_line1', 'mrz_line2', 'raw_text', 'names', 'dates', 'addresses', 'numbers']);

function truncateFileName(name: string, maxLen = 30): string {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0) {
    const base = name.slice(0, ext);
    const extension = name.slice(ext);
    return base.slice(0, maxLen - extension.length - 3) + '...' + extension;
  }
  return name.slice(0, maxLen - 3) + '...';
}

export const ExtractionResult = ({ extraction }: ExtractionResultProps) => {
  const [expanded, setExpanded] = useState(false);

  const fields = Object.entries(extraction.fields).filter(
    ([key]) => !HIDDEN_FIELDS.has(key),
  );
  const filledCount = fields.filter(([, v]) => v != null).length;

  if (!extraction.success) {
    return (
      <div className="rounded-lg border p-3 text-sm bg-red-50 border-red-200">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="font-medium truncate">{truncateFileName(extraction.fileName)}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
            Erreur
          </span>
        </div>
        <p className="text-red-700 text-xs mt-1">{extraction.errorMessage}</p>
        <p className="text-gray-500 text-xs mt-1">Les champs peuvent être remplis manuellement ci-dessous</p>
      </div>
    );
  }

  const typeLabel = DOCUMENT_TYPE_LABELS[extraction.detectedType] ?? 'Autre';
  const typeColor = DOCUMENT_TYPE_COLORS[extraction.detectedType] ?? DOCUMENT_TYPE_COLORS.autre;
  const confidencePercent = Math.round(extraction.confidence * 100);

  return (
    <div className="rounded-lg border p-3 text-sm bg-green-50 border-green-200">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
        <span className="font-medium truncate">{truncateFileName(extraction.fileName)}</span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColor}`}>
          {typeLabel}
        </span>
        {confidencePercent > 0 && (
          <span className="text-xs text-gray-500">{confidencePercent}%</span>
        )}
        <span className="text-xs text-green-700 ml-auto mr-1">
          {filledCount} champ(s)
        </span>
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
      </div>

      {expanded && fields.length > 0 && (
        <div className="mt-2 space-y-0.5 pl-6">
          {fields.map(([key, value]) => (
            <div key={key} className="flex items-baseline gap-2 text-xs">
              <span className="text-gray-500 min-w-[120px]">
                {FIELD_LABELS[key] ?? key}
              </span>
              {value != null ? (
                <span className="text-gray-900">{value}</span>
              ) : (
                <span className="text-gray-400 italic">Non détecté</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
