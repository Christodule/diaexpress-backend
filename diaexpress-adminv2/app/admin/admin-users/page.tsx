import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'adminUsers' as const;

export default function AdminUsersPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Admins diaPay" description={resourceConfigs[resource].description} />
      <ResourceTable resource={resource} />
    </div>
  );
}
