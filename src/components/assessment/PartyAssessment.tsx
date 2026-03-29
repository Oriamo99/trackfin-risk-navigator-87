import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Users, Building, Save, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PersonForm } from "@/components/forms/PersonForm";
import { OfficialVerificationLinks } from "@/components/verification/OfficialVerificationLinks";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { RiskAssessmentTable } from "@/components/assessment/RiskAssessmentTable";
import { DocumentDropZone } from "@/components/documents/DocumentDropZone";
import { partyQuestions } from "@/config/risk-questions";
import { calculateScore, getRiskLevel } from "@/config/risk-scoring";
import { computeOcrAutoFlags } from "@/services/verification-service";
import { useGlobalDataContext } from "@/contexts/GlobalDataContext";
import { useVerification } from "@/hooks/useVerification";
import type { Party, PartyScoring } from "@/types";

interface PartyAssessmentProps {
  partyType: 'vendor' | 'acquirer';
  onScoreUpdate: (score: number, level: string) => void;
}

const sideConfig = {
  vendor: {
    icon: Users,
    title: 'Informations des Vendeurs',
    description: 'Saisie des informations détaillées des vendeurs',
    riskTitle: 'Vendeurs',
    saveMessage: 'Données des vendeurs sauvegardées avec succès !',
    saveLabel: 'Sauvegarder les données vendeurs',
    singularLabel: 'Vendeur',
    addLabel: 'Ajouter un vendeur',
    showAcquirerFields: false,
  },
  acquirer: {
    icon: Building,
    title: "Informations des Acquéreurs",
    description: "Saisie des informations détaillées des acquéreurs",
    riskTitle: 'Acquéreurs',
    saveMessage: 'Données des acquéreurs sauvegardées avec succès !',
    saveLabel: 'Sauvegarder les données acquéreurs',
    singularLabel: 'Acquéreur',
    addLabel: 'Ajouter un acquéreur',
    showAcquirerFields: true,
  },
} as const;

function getPartyLabel(party: Party): string {
  if (party.personType === 'physical') {
    const name = `${party.physicalPerson.firstName} ${party.physicalPerson.lastName}`.trim();
    return name || 'Sans nom';
  }
  return party.legalEntity.companyName || 'Sans nom';
}

const ApimoBadge = () => (
  <span
    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-500 border border-blue-200"
    title="Donnée importée depuis Apimo"
  >
    Apimo
  </span>
);

const RiskBadge = ({ level }: { level: string }) => {
  const cls = level === 'Faible' ? 'bg-green-100 text-green-800'
    : level === 'Modéré' ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';
  const Icon = level === 'Faible' ? CheckCircle : level === 'Modéré' ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
};

const PartyAssessment = ({ partyType, onScoreUpdate }: PartyAssessmentProps) => {
  const cfg = sideConfig[partyType];
  const Icon = cfg.icon;

  const { globalData, addParty, removeParty, updateParty } = useGlobalDataContext();
  const parties = globalData[partyType].parties;

  const [selectedPartyId, setSelectedPartyId] = useState(parties[0]?.id ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null);

  // Keep selectedPartyId valid: select last on add, first on delete
  const prevLengthRef = useRef(parties.length);

  useEffect(() => {
    if (parties.length === 0) return;

    if (parties.length > prevLengthRef.current) {
      // A party was added → select the last one
      setSelectedPartyId(parties[parties.length - 1].id);
    } else if (!parties.find(p => p.id === selectedPartyId)) {
      // Selected party was removed → select the first one
      setSelectedPartyId(parties[0].id);
    }

    prevLengthRef.current = parties.length;
  }, [parties, selectedPartyId]);

  // ─── Scoring ─────────────────────────────────────────────────────────

  const partyScorings: PartyScoring[] = useMemo(() =>
    parties.map(party => {
      const score = calculateScore(party.riskChecks, partyQuestions);
      return {
        partyId: party.id,
        partyLabel: getPartyLabel(party),
        score,
        level: getRiskLevel(score),
      };
    }), [parties]);

  const maxScore = useMemo(() => Math.max(0, ...partyScorings.map(p => p.score)), [partyScorings]);
  const maxLevel = getRiskLevel(maxScore);

  const stableOnScoreUpdate = useCallback(onScoreUpdate, [onScoreUpdate]);

  useEffect(() => {
    stableOnScoreUpdate(maxScore, maxLevel);
  }, [maxScore, maxLevel, stableOnScoreUpdate]);

  // ─── Current party ───────────────────────────────────────────────────

  const selectedParty = parties.find(p => p.id === selectedPartyId);
  const selectedScoring = partyScorings.find(s => s.partyId === selectedPartyId);

  const allVerificationsComplete = useMemo(() => {
    return parties.every(p => p.verificationResult?.completedAt != null);
  }, [parties]);

  // ─── Automated verifications ────────────────────────────────────────

  const { result: verificationResult, loading: verificationLoading, recheck, ppeDeclaration, setPpeDeclaration } = useVerification(selectedParty);

  // Auto-apply flags to risk checks (verification + OCR merged)
  const prevAutoFlagsRef = useRef<string>('');
  useEffect(() => {
    if (!selectedParty) return;

    const ocrFlags = computeOcrAutoFlags(selectedParty);
    const allAutoFlags = { ...verificationResult.autoFlags, ...ocrFlags };

    const flagsJson = JSON.stringify(allAutoFlags);
    if (flagsJson === prevAutoFlagsRef.current) return;
    if (!verificationResult.completedAt && Object.keys(ocrFlags).length === 0) return;
    prevAutoFlagsRef.current = flagsJson;

    const updatedChecks = { ...selectedParty.riskChecks };
    let changed = false;

    for (const [questionId, flagValue] of Object.entries(allAutoFlags)) {
      if (updatedChecks[questionId] !== flagValue) {
        updatedChecks[questionId] = flagValue;
        changed = true;
      }
    }

    if (changed) {
      updateParty(partyType, selectedPartyId, { riskChecks: updatedChecks });
    }

    if (verificationResult.completedAt) {
      updateParty(partyType, selectedPartyId, { verificationResult });
    }
  }, [verificationResult, selectedParty, partyType, selectedPartyId, updateParty]);

  const combinedAutoFlags = useMemo(() => {
    if (!selectedParty) return {};
    const ocrFlags = computeOcrAutoFlags(selectedParty);
    return { ...verificationResult.autoFlags, ...ocrFlags };
  }, [selectedParty, verificationResult.autoFlags]);

  const autoFilledCount = useMemo(() => Object.keys(combinedAutoFlags).length, [combinedAutoFlags]);

  // ─── OCR merge callback ─────────────────────────────────────────────

  const handleFieldsExtracted = useCallback((fields: Partial<Party>) => {
    if (!selectedParty) return;
    updateParty(partyType, selectedPartyId, fields);
  }, [selectedParty, partyType, selectedPartyId, updateParty]);

  if (!selectedParty) return null;

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleAddParty = () => {
    addParty(partyType);
  };

  const handleConfirmDelete = () => {
    if (!partyToDelete) return;
    removeParty(partyType, partyToDelete);
    setDeleteDialogOpen(false);
    setPartyToDelete(null);
  };

  const handleInputChange = (section: 'physicalPerson' | 'legalEntity', field: string, value: string) => {
    updateParty(partyType, selectedPartyId, {
      [section]: { ...selectedParty[section], [field]: value },
    });
  };

  const handlePersonTypeChange = (type: 'physical' | 'legal') => {
    updateParty(partyType, selectedPartyId, { personType: type });
  };

  const handleCheck = (id: string, checked: boolean) => {
    updateParty(partyType, selectedPartyId, {
      riskChecks: { ...selectedParty.riskChecks, [id]: checked },
    });
  };


  const handleSave = () => {
    toast.success(cfg.saveMessage);
  };

  const partyDataForForm = {
    physicalPerson: selectedParty.physicalPerson,
    legalEntity: selectedParty.legalEntity,
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Party selector cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {cfg.title}
            </CardTitle>
            <CardDescription>{cfg.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {parties.map((party, idx) => {
                  const scoring = partyScorings.find(s => s.partyId === party.id);
                  const isSelected = party.id === selectedPartyId;
                  return (
                    <div
                      key={party.id}
                      onClick={() => setSelectedPartyId(party.id)}
                      className={`relative cursor-pointer rounded-lg border-2 p-3 min-w-[180px] max-w-[250px] transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 font-medium">
                            {cfg.singularLabel} {idx + 1}
                          </p>
                          <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                            {getPartyLabel(party)}
                            {party.apimoContactId != null && <ApimoBadge />}
                          </p>
                        </div>
                        {parties.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartyToDelete(party.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {scoring && (
                        <div className="mt-2">
                          <RiskBadge level={scoring.level} />
                          <span className="text-xs text-gray-500 ml-2">{scoring.score}/20</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={handleAddParty}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3 min-w-[140px] text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {cfg.addLabel}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Score section :</span>
                <span className="font-bold">{maxScore}/20</span>
                <RiskBadge level={maxLevel} />
                <span className="text-gray-400">
                  basé sur le risque le plus élevé parmi {parties.length === 1 ? `1 ${cfg.singularLabel.toLowerCase()}` : `les ${parties.length} ${cfg.riskTitle.toLowerCase()}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk profile indicator */}
        {maxLevel === 'Faible' && allVerificationsComplete && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Faible</strong> — basé sur les vérifications automatiques</span>
          </div>
        )}
        {maxLevel === 'Modéré' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Modéré</strong> — vérifiez les critères de risque</span>
          </div>
        )}
        {maxLevel === 'Élevé' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <XCircle className="h-4 w-4" />
            <span>Profil de risque probable : <strong>Élevé</strong> — vigilance renforcée requise</span>
          </div>
        )}

        {/* Selected party form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {cfg.singularLabel} {parties.findIndex(p => p.id === selectedPartyId) + 1} : {getPartyLabel(selectedParty)}
              {selectedParty.apimoContactId != null && <ApimoBadge />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <DocumentDropZone
                party={selectedParty}
                onFieldsExtracted={handleFieldsExtracted}
              />
              <PersonForm
                data={partyDataForForm}
                personType={selectedParty.personType}
                onPersonTypeChange={handlePersonTypeChange}
                onInputChange={handleInputChange}
                idPrefix={`${partyType}-${selectedPartyId.slice(0, 8)}`}
                showAcquirerFields={cfg.showAcquirerFields}
              />
            </div>
          </CardContent>
        </Card>

        <VerificationPanel
          result={verificationResult}
          loading={verificationLoading}
          onRecheck={recheck}
          ppeDeclaration={ppeDeclaration}
          onPpeChange={setPpeDeclaration}
        />

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700">
              <ChevronDown className="h-4 w-4" />
              Vérifications manuelles (liens officiels)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <OfficialVerificationLinks idPrefix={`${partyType}-${selectedPartyId.slice(0, 8)}`} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <div className="rounded-lg border bg-white p-4">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-medium">
                      Évaluation des risques — {getPartyLabel(selectedParty)}
                    </span>
                    <p className="text-sm text-gray-500">
                      {autoFilledCount > 0
                        ? `${autoFilledCount} critère(s) pré-rempli(s) automatiquement`
                        : 'Aucun critère pré-rempli — évaluation manuelle requise'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{selectedScoring?.score ?? 0}/20</span>
                  <RiskBadge level={selectedScoring?.level ?? 'Faible'} />
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform [[data-state=open]_&]:rotate-180" />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <RiskAssessmentTable
                questions={partyQuestions}
                checks={selectedParty.riskChecks}
                onCheckChange={handleCheck}
                score={selectedScoring?.score ?? 0}
                riskLevel={selectedScoring?.level ?? 'Faible'}
                title={`${cfg.singularLabel} ${parties.findIndex(p => p.id === selectedPartyId) + 1} — ${getPartyLabel(selectedParty)}`}
                autoFlags={combinedAutoFlags}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="text-center">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            {cfg.saveLabel}
          </Button>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment supprimer ce {cfg.singularLabel.toLowerCase()} ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default PartyAssessment;
