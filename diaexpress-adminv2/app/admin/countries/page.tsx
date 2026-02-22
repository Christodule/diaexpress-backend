import { CountriesManager } from '@/components/logistics/CountriesManager';
import { PageHeader } from '@/components/ui/page-header';

export default function CountriesPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Pays" description="Gestion des pays opérés par DiaExpress." />
      <CountriesManager />
    </div>
  );
}
