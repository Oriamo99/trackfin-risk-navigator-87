import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, AlertTriangle } from 'lucide-react';
import type { FundsDocumentChecks } from '@/types';

interface FundsDocumentChecklistProps {
  checklist: FundsDocumentChecks;
  onChange: (updated: FundsDocumentChecks) => void;
}

const ITEMS: Array<{ key: keyof Omit<FundsDocumentChecks, 'autreDetail'>; label: string; detail: string }> = [
  { key: 'pretBancaire', label: 'Prêt bancaire', detail: "Offre de prêt + attestation de déblocage" },
  { key: 'acteVente', label: "Vente d'un autre bien", detail: "Copie acte notarié" },
  { key: 'epargnePersonnelle', label: 'Épargne personnelle', detail: "Avis d'imposition, bulletins de salaire" },
  { key: 'donation', label: 'Donation', detail: "Copie acte de donation" },
  { key: 'succession', label: 'Succession / héritage', detail: "Copie acte de succession" },
  { key: 'fondsEtranger', label: "Fonds provenant de l'étranger", detail: "Relevés bancaires + justificatif virement" },
  { key: 'apportSociete', label: 'Apport société', detail: "PV d'AG + relevés bancaires" },
  { key: 'autre', label: 'Autre source de financement', detail: '' },
];

export const FundsDocumentChecklist = ({ checklist, onChange }: FundsDocumentChecklistProps) => {
  const toggle = (key: keyof Omit<FundsDocumentChecks, 'autreDetail'>, checked: boolean) => {
    const updated = { ...checklist, [key]: checked };
    if (key === 'autre' && !checked) {
      updated.autreDetail = '';
    }
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Justificatifs de provenance des fonds
        </CardTitle>
        <CardDescription>
          Cochez les documents collectés auprès de l'acquéreur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ITEMS.map(({ key, label, detail }) => (
            <div key={key}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id={`funds-doc-${key}`}
                  checked={checklist[key] as boolean}
                  onCheckedChange={(checked) => toggle(key, checked as boolean)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor={`funds-doc-${key}`} className="font-medium">{label}</Label>
                  {detail && <p className="text-xs text-gray-500">{detail}</p>}
                </div>
              </div>

              {key === 'autre' && checklist.autre && (
                <div className="ml-6 mt-2">
                  <Input
                    value={checklist.autreDetail}
                    onChange={(e) => onChange({ ...checklist, autreDetail: e.target.value })}
                    placeholder="Précisez la source de financement..."
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Une attestation de disponibilité bancaire seule ne suffit pas à justifier l'origine
              économique des fonds (cf. lignes directrices DGCCRF-Tracfin 2018).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
