import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'users' as const;

export default function UsersPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Utilisateurs" description={resourceConfigs[resource].description} />
      <ResourceTable resource={resource} />
    </div>
  );
}
