import { MarketPointsManager } from '@/components/logistics/MarketPointsManager';
import { PageHeader } from '@/components/ui/page-header';

export default function MarketPointsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Market Points" description="Agences, hubs et relais DiaExpress par pays." />
      <MarketPointsManager />
    </div>
  );
}
