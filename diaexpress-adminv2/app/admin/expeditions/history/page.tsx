import { PageHeader } from '@/components/ui/page-header';
import { FilteredShipmentsTable } from '@/components/shipments/FilteredShipmentsTable';

export default function ShipmentHistoryPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Historique des expéditions"
        description="Shipments livrés ou annulés filtrés côté frontend."
      />
      <FilteredShipmentsTable
        statuses={['delivered', 'cancelled']}
        title="Historique"
        description="Archives des expéditions terminées."
      />
    </div>
  );
}
