'use client';

import { FilteredShipmentsTable } from '@/components/shipments/FilteredShipmentsTable';

export function ShipmentsSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FilteredShipmentsTable
        title="À venir / Booking"
        description="Expéditions planifiées ou en attente de chargement"
        statuses={['pending', 'booked', 'dispatched', 'in_transit', 'arrived']}
      />
      <FilteredShipmentsTable
        title="Livrées / archivées"
        description="Expéditions terminées ou annulées"
        statuses={['delivered', 'cancelled']}
      />
    </div>
  );
}
