
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface DocumentInfo {
  date: string;
  location: string;
  advisorSignature: string;
  managerSignature: string;
}

interface DocumentInfoFormProps {
  documentInfo: DocumentInfo;
  onDocumentInfoChange: (field: string, value: string) => void;
}

const DocumentInfoForm = ({ documentInfo, onDocumentInfoChange }: DocumentInfoFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Finalisation du Document
        </CardTitle>
        <CardDescription>
          Informations et signatures pour la validation du rapport
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date de rédaction</Label>
              <Input
                id="date"
                type="date"
                value={documentInfo.date}
                onChange={(e) => onDocumentInfoChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={documentInfo.location}
                onChange={(e) => onDocumentInfoChange('location', e.target.value)}
                placeholder="Ville, bureau..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-dashed border-2 border-gray-300">
              <CardHeader className="text-center">
                <CardTitle className="text-base">Signature du Conseiller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    value={documentInfo.advisorSignature}
                    onChange={(e) => onDocumentInfoChange('advisorSignature', e.target.value)}
                    placeholder="Nom et prénom du conseiller"
                  />
                  <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Zone de signature</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-gray-300">
              <CardHeader className="text-center">
                <CardTitle className="text-base">Signature du Responsable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    value={documentInfo.managerSignature}
                    onChange={(e) => onDocumentInfoChange('managerSignature', e.target.value)}
                    placeholder="Nom et prénom du responsable"
                  />
                  <div className="h-24 border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Zone de signature</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentInfoForm;
