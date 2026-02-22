import { PageHeader } from '@/components/ui/page-header';
import { ApiHealthPanel } from '@/components/debug/api-health-panel';

export default function ApiHealthPage() {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <div className="page-stack">
      <PageHeader
        title="API Health"
        description="Diagnostic des endpoints, authentification et base URLs."
        breadcrumbs={[{ label: 'Ops', href: '/admin' }, { label: 'API Health' }]}
      />
      {isProd ? (
        <div className="alert alert--info">
          Ce panneau est disponible uniquement en environnement de développement.
        </div>
      ) : (
        <ApiHealthPanel />
      )}
    </div>
  );
}
