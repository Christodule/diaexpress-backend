import React from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';

function formatProvider(quote) {
  if (!quote) return '';
  const providerLabel =
    quote.provider === 'internal'
      ? 'Tarif interne'
      : quote.provider
      ? quote.provider.replace(/-/g, ' ').toUpperCase()
      : 'Estimation';
  const ruleLabel = quote.appliedRule ? ` · ${quote.appliedRule}` : '';
  return `${providerLabel}${ruleLabel}`;
}

function formatPrice(price, currency) {
  if (price === undefined || price === null) {
    return '—';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function EstimateList({ quotes = [], selectedIndex, onChange, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <p className="text-sm text-slate-500">
        Lancez un calcul de devis pour afficher les offres disponibles.
      </p>
    );
  }

  return (
    <RadioGroup>
      {quotes.map((quote, index) => {
        const providerLabel = formatProvider(quote);
        const priceLabel = formatPrice(quote.estimatedPrice, quote.currency);
        const isCheapest = index === 0;
        const isSelected = selectedIndex === index;
        return (
          <RadioGroupItem
            key={`${quote.provider}-${quote.appliedRule}-${index}`}
            value={String(index)}
            checked={isSelected}
            onChange={() => onChange(index)}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-slate-900">{priceLabel}</span>
                {isCheapest && <Badge variant="green">Meilleur tarif</Badge>}
              </div>
              <span className="text-sm text-slate-500">{providerLabel}</span>
            </div>
          </RadioGroupItem>
        );
      })}
    </RadioGroup>
  );
}
