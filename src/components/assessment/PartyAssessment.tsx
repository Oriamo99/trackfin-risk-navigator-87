import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Users, Building, Save, Plus, Trash2, AlertTriangle, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PersonForm } from "@/components/forms/PersonForm";
import { DocumentUpload } from "@/components/forms/DocumentUpload";
import { OfficialVerificationLinks } from "@/components/verification/OfficialVerificationLinks";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { RiskAssessmentTable } from "@/components/assessment/RiskAssessmentTable";
import { partyQuestions } from "@/config/risk-questions";
import { calculateScore, getRiskLevel } from "@/config/risk-scoring";
import { useGlobalData } from "@/hooks/useGlobalData";
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
    addLabel: '+ Ajouter un vendeur',
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
    addLabel: '+ Ajouter un acquéreur',
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

  const { globalData, addParty, removeParty, updateParty } = useGlobalData();
  const parties = globalData[partyType].parties;

  const [selectedPartyId, setSelectedPartyId] = useState(parties[0]?.id ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, Record<string, File[]>>>({});

  // Keep selectedPartyId valid
  useEffect(() => {
    if (!parties.find(p => p.id === selectedPartyId) && parties.length > 0) {
      setSelectedPartyId(parties[0].id);
    }
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

  // ─── Automated verifications ────────────────────────────────────────

  const { result: verificationResult, loading: verificationLoading, recheck, ppeDeclaration, setPpeDeclaration } = useVerification(selectedParty);

  // Auto-apply flags to risk checks when verification completes
  const prevAutoFlagsRef = useRef<string>('');
  useEffect(() => {
    if (!selectedParty) return;
    const flagsJson = JSON.stringify(verificationResult.autoFlags);
    if (flagsJson === prevAutoFlagsRef.current || !verificationResult.completedAt) return;
    prevAutoFlagsRef.current = flagsJson;

    for (const [questionId, flagValue] of Object.entries(verificationResult.autoFlags)) {
      if (selectedParty.riskChecks[questionId] !== flagValue) {
        updateParty(partyType, selectedPartyId, {
          riskChecks: { ...selectedParty.riskChecks, [questionId]: flagValue },
        });
      }
    }

    updateParty(partyType, selectedPartyId, {
      verificationResult: verificationResult,
    });
  }, [verificationResult, selectedParty, partyType, selectedPartyId, updateParty]);

  if (!selectedParty) return null;

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleAddParty = () => {
    addParty(partyType);
    // Select the newly added party (it'll be the last one after state updates)
    // We set a flag and pick it up in useEffect
    setTimeout(() => {
      const stored = window.localStorage.getItem('tracfinGlobalData');
      if (stored) {
        const data = JSON.parse(stored);
        const newParties = data[partyType]?.parties;
        if (newParties?.length > 0) {
          setSelectedPartyId(newParties[newParties.length - 1].id);
        }
      }
    }, 0);
  };

  const handleConfirmDelete = () => {
    if (!partyToDelete) return;
    removeParty(partyType, partyToDelete);
    setDeleteDialogOpen(false);
    setPartyToDelete(null);
    // Will auto-select first via useEffect
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

  const handleDocumentCheck = (docType: string, checked: boolean) => {
    updateParty(partyType, selectedPartyId, {
      documentChecks: { ...selectedParty.documentChecks, [docType]: checked },
    });
  };

  const getDocFiles = () => documentFiles[selectedPartyId] ?? {
    justificatifDomicile: [],
    titrePropriete: [],
    pieceIdentite: [],
  };

  const handleDocumentUpload = (docType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentFiles(prev => ({
      ...prev,
      [selectedPartyId]: {
        ...getDocFiles(),
        [docType]: [...(prev[selectedPartyId]?.[docType] ?? []), ...files],
      },
    }));
  };

  const removeDocumentFile = (docType: string, index: number) => {
    setDocumentFiles(prev => ({
      ...prev,
      [selectedPartyId]: {
        ...getDocFiles(),
        [docType]: (prev[selectedPartyId]?.[docType] ?? []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    toast.success(cfg.saveMessage);
  };

  // Build PartyData shape expected by PersonForm
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
              {/* Party cards row */}
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

                {/* Add button */}
                <button
                  onClick={handleAddParty}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3 min-w-[140px] text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {cfg.addLabel}
                </button>
              </div>

              {/* Section score summary */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Score section :</span>
                <span className="font-bold">{maxScore}/20</span>
                <RiskBadge level={maxLevel} />
                <span className="text-gray-400">
                  — basé sur le risque le plus élevé parmi {parties.length === 1 ? `1 ${cfg.singularLabel.toLowerCase()}` : `les ${parties.length} ${cfg.riskTitle.toLowerCase()}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <PersonForm
                data={partyDataForForm}
                personType={selectedParty.personType}
                onPersonTypeChange={handlePersonTypeChange}
                onInputChange={handleInputChange}
                idPrefix={`${partyType}-${selectedPartyId.slice(0, 8)}`}
                showAcquirerFields={cfg.showAcquirerFields}
              />
              <DocumentUpload
                documentChecks={selectedParty.documentChecks}
                onDocumentCheck={handleDocumentCheck}
                documentFiles={getDocFiles()}
                onDocumentUpload={handleDocumentUpload}
                onRemoveFile={removeDocumentFile}
                idPrefix={`${partyType}-${selectedPartyId.slice(0, 8)}`}
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

        <RiskAssessmentTable
          questions={partyQuestions}
          checks={selectedParty.riskChecks}
          onCheckChange={handleCheck}
          score={selectedScoring?.score ?? 0}
          riskLevel={selectedScoring?.level ?? 'Faible'}
          title={`${cfg.singularLabel} ${parties.findIndex(p => p.id === selectedPartyId) + 1} — ${getPartyLabel(selectedParty)}`}
          autoFlags={verificationResult.autoFlags}
        />

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
