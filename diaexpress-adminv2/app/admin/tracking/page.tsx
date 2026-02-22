import { PageHeader } from '@/components/ui/page-header';
import { TrackingSearch } from '@/components/tracking/tracking-search';

export default function TrackingPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Tracking"
        description="Recherchez un colis par tracking code et visualisez son statut logistique."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'Tracking' }]}
      />
      <TrackingSearch />
    </div>
  );
}
