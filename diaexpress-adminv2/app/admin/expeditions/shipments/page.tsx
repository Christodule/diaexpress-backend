import { PageHeader } from '@/components/ui/page-header';
import { ExpeditionsTable } from '@/components/expeditions/ExpeditionsTable';

export default function ExpeditionsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Expéditions / Embarquements"
        description="Planifiez et suivez les expéditions créées depuis les devis ou les shipments."
      />
      <ExpeditionsTable />
    </div>
  );
}
