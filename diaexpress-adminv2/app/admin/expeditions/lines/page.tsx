import { PageHeader } from '@/components/ui/page-header';
import { TransportLinesTable } from '@/components/expeditions/TransportLinesTable';

export default function TransportLinesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Lignes de transport"
        description="Créez et maintenez les routes logistiques disponibles pour l'estimation et le suivi."
      />
      <TransportLinesTable />
    </div>
  );
}
