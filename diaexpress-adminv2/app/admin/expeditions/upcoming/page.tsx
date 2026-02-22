import { PageHeader } from '@/components/ui/page-header';
import { FilteredShipmentsTable } from '@/components/shipments/FilteredShipmentsTable';

export default function UpcomingShipmentsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Expéditions à venir"
        description="Shipments programmés ou en transit côté clients."
      />
      <FilteredShipmentsTable
        statuses={['scheduled', 'in_transit']}
        title="Expéditions à venir"
        description="Suivi des expéditions en cours de routing."
      />
    </div>
  );
}
