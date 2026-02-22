import { AddressesManager } from '@/components/logistics/AddressesManager';
import { PageHeader } from '@/components/ui/page-header';

export default function AddressesPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Adresses" description="Points physiques rattachés aux MarketPoints." />
      <AddressesManager />
    </div>
  );
}
