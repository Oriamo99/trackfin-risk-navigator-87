import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Search, Loader2, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { apimoService, ApimoError } from '@/services/apimo';
import type { ApimoProperty } from '@/types/apimo';

interface PropertySelectorProps {
  onSelect: (property: ApimoProperty) => void;
  onManualMode: () => void;
}

function formatPrice(property: ApimoProperty): string {
  if (!property.price?.value) return '—';
  return Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: property.price.currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(property.price.value);
}

function formatAddress(property: ApimoProperty): string {
  const parts = [property.city?.name, property.city?.zipcode].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

// type = property type (not category which is transaction type)
const TYPE_LABELS: Record<number, string> = {
  1: 'Appartement',
  2: 'Maison',
  3: 'Terrain',
  4: 'Commerce',
  5: 'Garage',
  6: 'Immeuble',
  7: 'Bureau',
  8: 'Bateau',
  9: 'Entrepôt',
  10: 'Cave / Box',
};

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Vente',
  2: 'Location',
  3: 'Saisonnière',
  4: 'Programme',
  5: 'Viager',
  6: 'Enchère',
};

export const PropertySelector = ({ onSelect, onManualMode }: PropertySelectorProps) => {
  const [properties, setProperties] = useState<ApimoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apimoService.getProperties();
      setProperties(data);
    } catch (err) {
      if (err instanceof ApimoError) {
        setError(`Erreur Apimo (${err.status}) : ${err.message}`);
      } else {
        setError('Erreur de connexion au serveur Apimo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(p =>
      String(p.reference ?? '').toLowerCase().includes(q) ||
      p.city?.name?.toLowerCase().includes(q) ||
      p.city?.zipcode?.includes(q) ||
      p.name?.toLowerCase().includes(q)
    );
  }, [properties, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-widest">T R A C F I N</h1>
          </div>
          <h2 className="text-xl text-gray-700 mb-1">Sélectionner un bien</h2>
          <p className="text-gray-500">
            Choisissez le bien immobilier pour lequel vous souhaitez réaliser l'évaluation TRACFIN.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, ville ou code postal..."
            className="pl-10"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Chargement des biens depuis Apimo...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex justify-center gap-3">
                <Button onClick={fetchProperties} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={onManualMode} variant="ghost">
                  Mode manuel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Home className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {search ? 'Aucun bien ne correspond à votre recherche.' : 'Aucun bien trouvé dans votre agence Apimo.'}
              </p>
              <Button onClick={onManualMode} variant="ghost">
                Mode manuel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Property cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(property => (
              <Card
                key={property.id}
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                onClick={() => onSelect(property)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      Réf. {property.reference || property.id}
                    </CardTitle>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[property.type] ?? 'Autre'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[property.category] ?? ''}
                      </span>
                    </div>
                  </div>
                  <CardDescription>{formatAddress(property)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(property)}
                    </span>
                    <span className="text-xs text-gray-400">
                      MAJ : {formatDate(property.updated_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Always-visible manual mode button */}
        <div className="text-center mt-8">
          <button
            onClick={onManualMode}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Mode manuel (saisie sans Apimo)
          </button>
        </div>
      </div>
    </div>
  );
};
