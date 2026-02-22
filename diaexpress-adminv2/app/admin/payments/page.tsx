import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'payments' as const;

export default function PaymentsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Paiements diaPay" description={resourceConfigs[resource].description} />
      <ResourceTable resource={resource} />
    </div>
  );
}
