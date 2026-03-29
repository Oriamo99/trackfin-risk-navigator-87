import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Party, PartyScoring } from "@/types";

interface PartyRiskOverviewProps {
  parties: Party[];
  scorings: PartyScoring[];
  sideLabel: string;
  tabValue: string;
  onNavigateToTab: (tab: string) => void;
}

function getPartyLabel(party: Party): string {
  if (party.personType === 'physical') {
    const name = `${party.physicalPerson.firstName} ${party.physicalPerson.lastName}`.trim();
    return name || 'Sans nom';
  }
  return party.legalEntity.companyName || 'Sans nom';
}

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

export const PartyRiskOverview = ({ parties, scorings, sideLabel, tabValue, onNavigateToTab }: PartyRiskOverviewProps) => {
  return (
    <div className="space-y-2">
      {parties.map((party, idx) => {
        const scoring = scorings.find(s => s.partyId === party.id);
        return (
          <div
            key={party.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-gray-500 font-medium shrink-0">
                {sideLabel} {idx + 1}
              </span>
              <span className="text-sm font-semibold truncate">
                {getPartyLabel(party)}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold">{scoring?.score ?? 0}/20</span>
              <RiskBadge level={scoring?.level ?? 'Faible'} />
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 px-0 h-auto"
                onClick={() => onNavigateToTab(tabValue)}
              >
                Modifier
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
