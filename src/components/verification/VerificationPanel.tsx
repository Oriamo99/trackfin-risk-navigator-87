import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import type { VerificationResult } from '@/services/verification-service';
import type { PpeDeclaration } from '@/config/ppe';
import { PPE_CATEGORIES } from '@/config/ppe';

// ─── Props ───────────────────────────────────────────────────────────────────

interface VerificationPanelProps {
  result: VerificationResult;
  loading: boolean;
  onRecheck: () => void;
  ppeDeclaration: PpeDeclaration;
  onPpeChange: (decl: PpeDeclaration) => void;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

type CheckStatus = 'clear' | 'hit' | 'error' | 'pending' | 'declared' | 'none';

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  switch (status) {
    case 'clear':
    case 'none':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'hit':
    case 'declared':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const statusLabel: Record<CheckStatus, string> = {
  clear: 'Aucune correspondance',
  hit: 'Correspondance trouvée',
  error: 'Erreur de vérification',
  pending: 'En attente',
  declared: 'PPE déclarée',
  none: 'Aucun risque',
};

const statusCls: Record<CheckStatus, string> = {
  clear: 'bg-green-50 border-green-200 text-green-800',
  hit: 'bg-red-50 border-red-200 text-red-800',
  error: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  pending: 'bg-gray-50 border-gray-200 text-gray-600',
  declared: 'bg-red-50 border-red-200 text-red-800',
  none: 'bg-green-50 border-green-200 text-green-800',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const VerificationPanel = ({
  result,
  loading,
  onRecheck,
  ppeDeclaration,
  onPpeChange,
}: VerificationPanelProps) => {
  const sanctionsStatus = result.sanctions.status;
  const gafiStatus: CheckStatus = result.gafi.listType === 'black' || result.gafi.listType === 'grey' ? 'hit' : result.gafi.checkedAt ? 'clear' : 'pending';
  const ppeStatus: CheckStatus = result.ppe.status === 'declared' ? 'declared' : result.ppe.checkedAt ? 'clear' : 'pending';

  // Overall status bar
  const allClear = sanctionsStatus === 'clear' && gafiStatus === 'clear' && ppeStatus === 'clear';
  const hasHit = sanctionsStatus === 'hit' || gafiStatus === 'hit' || ppeStatus === 'declared';
  const hasError = sanctionsStatus === 'error';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vérifications LCB-FT Automatisées
            </CardTitle>
            <CardDescription>
              Sanctions DG Trésor, pays GAFI et déclaration PPE
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRecheck}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1.5">{loading ? 'Vérification...' : 'Revérifier'}</span>
          </Button>
        </div>

        {/* Status bar */}
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
          hasHit ? 'bg-red-50 border-red-200 text-red-800'
            : hasError ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : allClear ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          {hasHit ? <XCircle className="h-4 w-4" />
            : hasError ? <AlertTriangle className="h-4 w-4" />
            : allClear ? <CheckCircle className="h-4 w-4" />
            : <Clock className="h-4 w-4" />}
          {hasHit ? 'Risque détecté — vérification manuelle recommandée'
            : hasError ? 'Certaines vérifications ont échoué — consultez les détails ci-dessous'
            : allClear ? 'Toutes les vérifications sont conformes'
            : 'En attente de données pour lancer les vérifications'}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Section 1: DG Trésor Sanctions */}
          <CheckSection
            title="Registre des sanctions — DG Trésor"
            status={sanctionsStatus}
          >
            {sanctionsStatus === 'hit' && result.sanctions.matches.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-red-700">
                  {result.sanctions.matches.length} correspondance(s) trouvée(s) :
                </p>
                {result.sanctions.matches.slice(0, 5).map((m, i) => (
                  <p key={i} className="text-sm text-red-600 pl-3">
                    • {m.lastName ?? ''} {m.firstName ?? ''} {m.entityName ?? ''} — {m.nature}
                  </p>
                ))}
                {result.sanctions.matches.length > 5 && (
                  <p className="text-xs text-red-500 pl-3">
                    ...et {result.sanctions.matches.length - 5} autre(s)
                  </p>
                )}
              </div>
            )}
            {sanctionsStatus === 'error' && (
              <p className="text-sm text-yellow-700">
                {result.sanctions.errorMessage ?? 'Erreur de connexion au registre DG Trésor.'}
                <br />
                <span className="text-xs">Veuillez utiliser les liens de vérification manuelle ci-dessous.</span>
              </p>
            )}
          </CheckSection>

          {/* Section 2: GAFI */}
          <CheckSection
            title="Pays à haut risque — GAFI"
            status={gafiStatus}
          >
            {gafiStatus === 'hit' && (
              <p className="text-sm text-red-700">
                Pays{' '}
                <span className="font-semibold">
                  {result.gafi.country}
                </span>
                {' '}figurant sur la liste{' '}
                <span className="font-semibold">
                  {result.gafi.listType === 'black' ? 'noire' : 'grise'}
                </span>
                {' '}du GAFI.
              </p>
            )}
          </CheckSection>

          {/* Section 3: PPE */}
          <CheckSection
            title="Personne Politiquement Exposée (PPE)"
            status={ppeStatus}
          >
            <PpeForm
              declaration={ppeDeclaration}
              onChange={onPpeChange}
            />
          </CheckSection>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Check section wrapper ───────────────────────────────────────────────────

const CheckSection = ({
  title,
  status,
  children,
}: {
  title: string;
  status: CheckStatus;
  children?: React.ReactNode;
}) => (
  <div className={`rounded-lg border p-3 ${statusCls[status]}`}>
    <div className="flex items-center gap-2 mb-1">
      <StatusIcon status={status} />
      <span className="text-sm font-medium">{title}</span>
      <span className="ml-auto text-xs opacity-70">{statusLabel[status]}</span>
    </div>
    {children}
  </div>
);

// ─── PPE Declaration Form ────────────────────────────────────────────────────

const PpeForm = ({
  declaration,
  onChange,
}: {
  declaration: PpeDeclaration;
  onChange: (decl: PpeDeclaration) => void;
}) => (
  <div className="mt-2 space-y-3">
    <div className="flex items-center gap-3">
      <Label className="text-sm whitespace-nowrap">Cette personne est-elle une PPE ?</Label>
      <Select
        value={declaration.isPpe ? 'oui' : 'non'}
        onValueChange={(v) => onChange({
          ...declaration,
          isPpe: v === 'oui',
          categoryId: v === 'oui' ? declaration.categoryId : null,
          relationship: v === 'oui' ? declaration.relationship : null,
        })}
      >
        <SelectTrigger className="w-24 h-8 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="non">Non</SelectItem>
          <SelectItem value="oui">Oui</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {declaration.isPpe && (
      <>
        <div>
          <Label className="text-sm">Catégorie PPE</Label>
          <Select
            value={declaration.categoryId ?? ''}
            onValueChange={(v) => onChange({ ...declaration, categoryId: v || null })}
          >
            <SelectTrigger className="mt-1 bg-white">
              <SelectValue placeholder="Sélectionnez une catégorie..." />
            </SelectTrigger>
            <SelectContent>
              {PPE_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Lien avec la PPE</Label>
          <Select
            value={declaration.relationship ?? ''}
            onValueChange={(v) => onChange({
              ...declaration,
              relationship: (v || null) as PpeDeclaration['relationship'],
            })}
          >
            <SelectTrigger className="mt-1 bg-white">
              <SelectValue placeholder="Type de relation..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Directement PPE</SelectItem>
              <SelectItem value="family">Membre de la famille d'une PPE</SelectItem>
              <SelectItem value="associate">Personne connue pour être associée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Détails complémentaires</Label>
          <Textarea
            value={declaration.details}
            onChange={(e) => onChange({ ...declaration, details: e.target.value })}
            placeholder="Fonction, période, précisions..."
            className="mt-1 bg-white"
            rows={2}
          />
        </div>
      </>
    )}
  </div>
);
