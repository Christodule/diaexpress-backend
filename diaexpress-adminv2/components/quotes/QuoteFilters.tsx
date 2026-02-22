'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export type QuoteFiltersProps = {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onRefresh: () => void;
  onQuickViewChange?: (status: string) => void;
  loading?: boolean;
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'À valider' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'dispatched', label: 'Expédié' }
];

export function QuoteFilters({
  status,
  search,
  dateFrom,
  dateTo,
  onStatusChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onRefresh,
  onQuickViewChange,
  loading,
}: QuoteFiltersProps) {
  const tabs = useMemo(
    () => [
      { key: '', label: 'Tous' },
      { key: 'pending', label: 'À valider' },
      { key: 'confirmed', label: 'Confirmés' },
      { key: 'dispatched', label: 'Expédiés' },
      { key: 'rejected', label: 'Rejetés' },
    ],
    [],
  );

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <div className="panel__title">Filtres</div>
          <p className="panel__muted">
            Filtrez les devis par statut, période ou mot-clé pour retrouver rapidement une demande.
          </p>
        </div>
        <div className="panel__actions">
          <Button variant="ghost" onClick={onRefresh} disabled={loading}>
            Rafraîchir
          </Button>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`tab ${status === tab.key ? 'tab--active' : ''}`}
            onClick={() => {
              onStatusChange(tab.key);
              onQuickViewChange?.(tab.key);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <Input
          placeholder="Rechercher par client, destination, tracking..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Input
          type="date"
          aria-label="Du"
          placeholder="Du"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
        />
        <Input
          type="date"
          aria-label="Au"
          placeholder="Au"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
        />
        <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </form>
    </div>
  );
}
