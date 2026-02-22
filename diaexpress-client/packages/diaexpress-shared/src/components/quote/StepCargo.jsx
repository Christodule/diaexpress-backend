import React, { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { EstimateList } from './EstimateList';
import { Alert } from '../ui/Alert';

const transportVisuals = {
  air: { icon: '✈️', label: 'Aérien' },
  road: { icon: '🚚', label: 'Routier' },
  sea: { icon: '🚢', label: 'Maritime' },
};

export function formatTransport(transportType) {
  if (!transportType) return '';
  const key = transportType.toLowerCase();
  return transportVisuals[key]?.label || transportType;
}

export function StepCargo({
  transportTypes = [],
  packageTypes = [],
  onEstimate,
  estimateError,
  estimateResults = [],
  selectedEstimateIndex,
  onSelectEstimate,
  loadingEstimate,
}) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
    register('transportType');
    register('packageTypeId');
  }, [register]);

  const transportType = watch('transportType');
  const packageTypeId = watch('packageTypeId');
  const length = watch('length');
  const width = watch('width');
  const height = watch('height');

  const requiresDimensions = transportType === 'sea' && !packageTypeId;
  const requiresWeight = !packageTypeId && (transportType === 'air' || transportType === 'road');

  const derivedVolume = useMemo(() => {
    if (!(length && width && height)) return '';
    const volumeValue =
      (Number(String(length).replace(',', '.')) *
        Number(String(width).replace(',', '.')) *
        Number(String(height).replace(',', '.')))/
      1_000_000;
    if (!Number.isFinite(volumeValue)) return '';
    return volumeValue.toFixed(3);
  }, [length, width, height]);

  const handleTransportSelect = (type) => {
    setValue('transportType', type, { shouldDirty: true });
    if (type !== transportType) {
      setValue('packageTypeId', '', { shouldDirty: true });
      setValue('weight', '', { shouldDirty: true });
      setValue('volume', '', { shouldDirty: true });
      setValue('length', '', { shouldDirty: true });
      setValue('width', '', { shouldDirty: true });
      setValue('height', '', { shouldDirty: true });
    }
  };

  const handlePackageChange = (event) => {
    setValue('packageTypeId', event.target.value, { shouldDirty: true });
    if (event.target.value) {
      setValue('weight', '', { shouldDirty: true });
      setValue('volume', '', { shouldDirty: true });
      setValue('length', '', { shouldDirty: true });
      setValue('width', '', { shouldDirty: true });
      setValue('height', '', { shouldDirty: true });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transport & colis</CardTitle>
        <CardDescription>
          Sélectionnez un mode de transport puis renseignez soit un type de colis, soit les caractéristiques du colis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Mode de transport *</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {transportTypes.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sélectionnez une destination pour afficher les modes de transport disponibles.
              </p>
            ) : (
              transportTypes.map((type) => {
                const key = typeof type === 'string' ? type.toLowerCase() : String(type).toLowerCase();
                const visual = transportVisuals[key] || { icon: '🚚', label: String(type) };
                const isActive = transportType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 data-[active=true]:border-sky-500 ${
                      isActive ? 'border-sky-500 bg-sky-50' : 'border-slate-200'
                    }`}
                    onClick={() => handleTransportSelect(String(type))}
                    data-active={isActive}
                  >
                    <span className="text-2xl" aria-hidden>
                      {visual.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{visual.label}</span>
                      <span className="text-xs text-slate-500">
                        {type === 'air'
                          ? 'Rapide et sécurisé'
                          : type === 'sea'
                          ? 'Économique pour gros volumes'
                          : 'Souple et accessible'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {errors.transportType && (
            <p className="text-xs text-red-600">{String(errors.transportType.message)}</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Type de colis</h3>
          <Select value={packageTypeId || ''} onChange={handlePackageChange} disabled={!transportType || packageTypes.length === 0}>
            <option value="">Sélectionnez un type de colis (optionnel)</option>
            {packageTypes.map((pkg) => (
              <option key={pkg._id} value={pkg._id}>
                {pkg.name}
              </option>
            ))}
          </Select>
          {packageTypes.length === 0 && transportType && (
            <p className="text-xs text-slate-500">
              Aucun type de colis prédéfini pour cette combinaison. Renseignez les mesures manuellement.
            </p>
          )}
        </section>

        {!packageTypeId && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="weight">Poids (kg){requiresWeight ? ' *' : ''}</Label>
                <Input
                  id="weight"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 250"
                  {...register('weight')}
                  aria-invalid={Boolean(errors.weight)}
                />
                {errors.weight && <p className="text-xs text-red-600">{String(errors.weight.message)}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="volume">Volume (m³){requiresDimensions ? ' *' : ''}</Label>
                <Input
                  id="volume"
                  type="text"
                  inputMode="decimal"
                  placeholder="ex: 1.2"
                  {...register('volume')}
                  aria-invalid={Boolean(errors.volume)}
                />
                {errors.volume && <p className="text-xs text-red-600">{String(errors.volume.message)}</p>}
              </div>
            </div>

            {requiresDimensions && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {['length', 'width', 'height'].map((field) => {
                  const fieldError = errors[field];
                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <Label htmlFor={field}>
                        {field === 'length'
                          ? 'Longueur (cm)'
                          : field === 'width'
                          ? 'Largeur (cm)'
                          : 'Hauteur (cm)'}
                      </Label>
                      <Input
                        id={field}
                        type="text"
                        inputMode="decimal"
                        placeholder="ex: 120"
                        {...register(field)}
                        aria-invalid={Boolean(fieldError)}
                      />
                      {fieldError && <p className="text-xs text-red-600">{String(fieldError.message)}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {derivedVolume && requiresDimensions && (
              <p className="text-xs text-slate-500">
                Volume estimé d’après les dimensions : <span className="font-semibold">{derivedVolume} m³</span>
              </p>
            )}
          </section>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Estimation</h3>
              <p className="text-xs text-slate-500">
                Calculez un devis pour comparer les offres disponibles.
              </p>
            </div>
            <Button type="button" onClick={onEstimate} disabled={loadingEstimate || !transportType}>
              {loadingEstimate ? 'Calcul en cours…' : 'Calculer le devis'}
            </Button>
          </div>
          {estimateError && <Alert variant="error">{estimateError}</Alert>}
          <EstimateList
            quotes={estimateResults}
            loading={loadingEstimate}
            selectedIndex={selectedEstimateIndex}
            onChange={onSelectEstimate}
          />
        </section>
      </CardContent>
    </Card>
  );
}

