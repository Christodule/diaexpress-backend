import React from 'react';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { normaliseCountry } from '../../utils/addressValidation';

export function AddressPicker({
  label,
  type,
  addresses = [],
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  helperText,
  error,
  disabled,
  hideCreate,
  allowEdit = true,
}) {
  const hasAddresses = addresses.length > 0;

  const handleChange = (event) => {
    onSelect?.(event.target.value || '');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <Label htmlFor={`${type}-address`}>{label}</Label>
        <div className="flex flex-wrap gap-2">
          {!hideCreate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCreate?.(type)}
              className="text-sky-600 hover:text-sky-700"
            >
              Nouvelle
            </Button>
          )}
          {hasAddresses && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(type)}
              className="text-slate-600 hover:text-slate-700"
              disabled={!selectedId || !allowEdit}
            >
              Modifier
            </Button>
          )}
        </div>
      </div>
      <Select
        id={`${type}-address`}
        value={selectedId || ''}
        onChange={handleChange}
        disabled={disabled || !hasAddresses}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
        aria-invalid={Boolean(error)}
      >
        <option value="">{hasAddresses ? 'Sélectionnez une adresse' : 'Aucune adresse disponible'}</option>
        {addresses.map((address) => (
          <option key={address._id} value={address._id}>
            {address.label || `${address.city}, ${normaliseCountry(address.country ?? '')}`}
          </option>
        ))}
      </Select>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {selectedId && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {addresses
            .filter((address) => address._id === selectedId)
            .map((address) => (
              <address key={address._id} className="not-italic leading-5">
                <strong className="block text-slate-700">{address.label || 'Adresse sans libellé'}</strong>
                <span className="block">{address.line1}</span>
                {address.line2 && <span className="block">{address.line2}</span>}
                <span className="block">
                  {address.postalCode} {address.city} · {normaliseCountry(address.country ?? '')}
                </span>
                {address.phone && <span className="block">📞 {address.phone}</span>}
              </address>
            ))}
        </div>
      )}
    </div>
  );
}
