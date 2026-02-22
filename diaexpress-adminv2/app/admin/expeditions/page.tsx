import { EmbarkmentsSection } from '@/components/expeditions/EmbarkmentsSection';
import { ShipmentsSection } from '@/components/expeditions/ShipmentsSection';
import { TransportLinesSection } from '@/components/expeditions/TransportLinesSection';
import { PageHeader } from '@/components/ui/page-header';

export default function ExpeditionsPage() {
  return (
    <div className="page-stack space-y-6">
      <PageHeader
        title="Expéditions"
        description="Pilotez vos lignes, embarquements et expéditions clients depuis un seul espace."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'Expéditions' }]}
      />
      <TransportLinesSection />
      <EmbarkmentsSection />
      <ShipmentsSection />
    </div>
  );
}
