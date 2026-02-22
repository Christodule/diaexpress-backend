'use client';

import { Button } from '@/components/ui/button';
import { QuoteCreateWizard } from './QuoteCreateWizard';

type QuoteFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function QuoteFormDrawer({ open, onClose, onCreated }: QuoteFormDrawerProps) {
  if (!open) return null;

  return (
    <div className="drawer">
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel">
        <div className="panel__header">
          <div>
            <div className="panel__title">Créer ou éditer un devis</div>
            <p className="panel__muted">
            Renseignez l’itinéraire, le contact et les informations colis pour préparer une estimation.
            </p>
          </div>
          <div className="panel__actions">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="drawer__content">
          <QuoteCreateWizard onQuoteCreated={onCreated} />
        </div>
      </div>
    </div>
  );
}
