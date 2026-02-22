import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'apiKeys' as const;

export default function ApiKeysPage() {
  return (
    <div className="page-stack">
      <PageHeader title="API Keys" description={resourceConfigs[resource].description} />
      <ResourceTable resource={resource} />
    </div>
  );
}
