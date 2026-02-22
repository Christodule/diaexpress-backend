import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

function SummaryItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value || 'À compléter'}</span>
    </div>
  );
}

export function SummaryCard({ itinerary, cargo, contacts, estimate }) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <SummaryItem label="Origine" value={itinerary?.origin} />
          <SummaryItem label="Destination" value={itinerary?.destination} />
          <SummaryItem label="Transport" value={cargo?.transportLabel} />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Colis</h3>
          <div className="grid grid-cols-1 gap-3">
            {cargo?.packageType && <SummaryItem label="Type de colis" value={cargo.packageType} />}
            {cargo?.weight && <SummaryItem label="Poids" value={cargo.weight} />}
            {cargo?.volume && <SummaryItem label="Volume" value={cargo.volume} />}
            {cargo?.dimensions && <SummaryItem label="Dimensions" value={cargo.dimensions} />}
            {!cargo?.packageType && !cargo?.weight && !cargo?.volume && !cargo?.dimensions && (
              <p className="text-xs text-slate-500">Renseignez le colis pour afficher le détail.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Contacts</h3>
          <div className="grid grid-cols-1 gap-3">
            {contacts?.pickupOption && (
              <SummaryItem
                label="Collecte"
                value={
                  contacts.pickupOption === 'pickup'
                    ? "Ramassage à l'adresse"
                    : 'Dépôt en agence DiaExpress'
                }
              />
            )}
            {contacts?.productType && <SummaryItem label="Marchandise" value={contacts.productType} />}
            {contacts?.productLocation && contacts.pickupOption === 'pickup' && (
              <SummaryItem label="Lieu de récupération" value={contacts.productLocation} />
            )}
            {contacts?.contactPhone && (
              <SummaryItem label="Téléphone expéditeur" value={contacts.contactPhone} />
            )}
            {contacts?.recipientContactName && (
              <SummaryItem label="Contact destinataire" value={contacts.recipientContactName} />
            )}
            {contacts?.recipientContactPhone && (
              <SummaryItem label="Téléphone destinataire" value={contacts.recipientContactPhone} />
            )}
            {contacts?.recipientContactEmail && (
              <SummaryItem label="Email destinataire" value={contacts.recipientContactEmail} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Estimation</h3>
          {estimate?.price ? (
            <div className="flex flex-col gap-2 rounded-xl bg-slate-900 p-4 text-white">
              <span className="text-sm text-sky-200">Tarif sélectionné</span>
              <span className="text-2xl font-semibold">{estimate.price}</span>
              {estimate.method && (
                <Badge variant="sky" className="self-start bg-sky-500/20 text-sky-100">
                  {estimate.method}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Calculez un devis pour voir la meilleure offre.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
