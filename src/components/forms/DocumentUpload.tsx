import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DocumentChecks } from "@/types";

const documentTypes = [
  { key: 'justificatifDomicile' as const, label: 'Justificatif de domicile' },
  { key: 'titrePropriete' as const, label: 'Titre de propriété' },
  { key: 'pieceIdentite' as const, label: "Pièce d'identité" },
];

interface DocumentUploadProps {
  documentChecks: DocumentChecks;
  onDocumentCheck: (docType: string, checked: boolean) => void;
  documentFiles: Record<string, File[]>;
  onDocumentUpload: (docType: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (docType: string, index: number) => void;
  idPrefix: string;
}

export const DocumentUpload = ({
  documentChecks,
  onDocumentCheck,
  documentFiles,
  onDocumentUpload,
  onRemoveFile,
  idPrefix,
}: DocumentUploadProps) => {
  return (
    <div>
      <Label className="text-base font-medium">Documents</Label>
      <div className="mt-4 space-y-4">
        {documentTypes.map((doc) => (
          <div key={doc.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${idPrefix}-${doc.key}`}
                checked={documentChecks[doc.key]}
                onCheckedChange={(checked) => onDocumentCheck(doc.key, checked as boolean)}
              />
              <Label htmlFor={`${idPrefix}-${doc.key}`}>{doc.label}</Label>
            </div>
            {documentChecks[doc.key] && (
              <div className="ml-6 space-y-2">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onDocumentUpload(doc.key, e)}
                  className="mb-2"
                />
                {documentFiles[doc.key]?.length > 0 && (
                  <div className="space-y-2">
                    {documentFiles[doc.key].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveFile(doc.key, index)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
