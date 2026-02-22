import { PageHeader } from '@/components/ui/page-header';

const integrations = [
  { name: 'CMA CGM', status: 'Connecté', lastSync: '15 min' },
  { name: 'diaPay', status: 'Connecté', lastSync: '5 min' },
  { name: 'SAP Logistics', status: 'Bêta', lastSync: '—' }
];

export default function IntegrationsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Intégrations" description="Status des connecteurs critiques." />
      <div className="status-grid">
        {integrations.map((integration) => (
          <div key={integration.name} className="stat-card">
            <p>{integration.name}</p>
            <strong>{integration.status}</strong>
            <p>Dernière sync: {integration.lastSync}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
