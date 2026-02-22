import { PageHeader } from '@/components/ui/page-header';
import { PricingManager } from '@/components/pricing/PricingManager';

export default function PricingPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Pricing"
        description="Gestion des grilles tarifaires, gabarits et tranches dimensionnelles."
        breadcrumbs={[{ label: 'Finance', href: '/admin' }, { label: 'Pricing' }]}
      />
      <PricingManager />
    </div>
  );
}
