import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeDocument, isMistralConfigured, mapExtractedFields, type OcrExtraction } from '@/services/document-ocr';
import { ExtractionResult } from './ExtractionResult';
import type { Party, PhysicalPerson, LegalEntity, DocumentChecks } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface DocumentDropZoneProps {
  party: Party;
  onFieldsExtracted: (fields: Partial<Party>) => void;
}

export const DocumentDropZone = ({ party, onFieldsExtracted }: DocumentDropZoneProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<OcrExtraction[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep refs to latest props so the processFile closure always sees current values
  const partyRef = useRef(party);
  partyRef.current = party;
  const callbackRef = useRef(onFieldsExtracted);
  callbackRef.current = onFieldsExtracted;

  const removeResult = useCallback((index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux (max 10 Mo)');
      return;
    }

    setAnalyzing(true);
    try {
      const extraction = await analyzeDocument(file);
      setResults(prev => {
        const existingIndex = prev.findIndex(r => r.fileName === extraction.fileName);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = extraction;
          return updated;
        }
        return [extraction, ...prev];
      });

      if (!extraction.success) {
        toast.error(extraction.errorMessage ?? "Erreur lors de l'analyse du document");
        return;
      }

      const p = partyRef.current;
      const mapped = mapExtractedFields(extraction);
      const updates: Partial<Party> = {};

      if (mapped.personType === 'legal') {
        if (p.personType !== 'legal') {
          updates.personType = 'legal';
        }
        const current = p.legalEntity as unknown as Record<string, string>;
        const merged: Record<string, string> = {};
        for (const [key, value] of Object.entries(mapped.legalFields)) {
          if (value && (!current[key] || String(current[key]).trim() === '')) {
            merged[key] = String(value);
          }
        }
        if (Object.keys(merged).length > 0) {
          updates.legalEntity = { ...p.legalEntity, ...merged } as LegalEntity;
        }
      } else {
        if (p.personType !== 'physical' && (extraction.detectedType === 'cni' || extraction.detectedType === 'passeport')) {
          updates.personType = 'physical';
        }
        const current = p.physicalPerson as unknown as Record<string, string>;
        const merged: Record<string, string> = {};
        for (const [key, value] of Object.entries(mapped.physicalFields)) {
          if (value && (!current[key] || String(current[key]).trim() === '')) {
            merged[key] = String(value);
          }
        }
        if (Object.keys(merged).length > 0) {
          updates.physicalPerson = { ...p.physicalPerson, ...merged } as PhysicalPerson;
        }
      }

      // Auto-check document checkboxes
      const docChecks: DocumentChecks = { ...p.documentChecks };
      if (extraction.detectedType === 'cni' || extraction.detectedType === 'passeport') {
        docChecks.pieceIdentite = true;
      } else if (extraction.detectedType === 'justificatif_domicile') {
        docChecks.justificatifDomicile = true;
      } else if (extraction.detectedType === 'kbis') {
        docChecks.kbis = true;
      }
      updates.documentChecks = docChecks;

      callbackRef.current(updates);

      const fieldCount = mapped.personType === 'legal'
        ? Object.keys(mapped.legalFields).length
        : Object.keys(mapped.physicalFields).length;
      if (fieldCount > 0) {
        toast.success(`${fieldCount} champ(s) pré-rempli(s) depuis le document`);
      }
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.reduce(
      (chain, file) => chain.then(() => processFile(file)),
      Promise.resolve(),
    );
  }, [processFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const mistralReady = isMistralConfigured();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileUp className="h-4 w-4" />
          Analyse documentaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mistralReady ? (
          <p className="text-sm text-gray-400 text-center py-3">
            OCR non disponible — configurez <code className="bg-gray-100 px-1 rounded">VITE_MISTRAL_API_KEY</code> dans <code className="bg-gray-100 px-1 rounded">.env.local</code> puis relancez le serveur.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 text-gray-400'
              } ${analyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => !analyzing && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-blue-600">Analyse en cours...</span>
                </div>
              ) : (
                <div className="py-2">
                  <p>Déposez vos documents ici (CNI, passeport, Kbis, justificatif de domicile)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  >
                    Parcourir
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Extraction results */}
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <ExtractionResult key={`${r.fileName}-${i}`} extraction={r} onRemove={() => removeResult(i)} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
