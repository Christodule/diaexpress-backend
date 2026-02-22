import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'jobs' as const;

export default function JobsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Jobs diaPay" description={resourceConfigs[resource].description} />
      <ResourceTable resource={resource} />
    </div>
  );
}
