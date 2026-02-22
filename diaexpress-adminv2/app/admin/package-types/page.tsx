import { PageHeader } from '@/components/ui/page-header';
import { ResourceTable } from '@/components/resource/resource-table';
import { resourceConfigs } from '@/components/resource/config';

const resource = 'packageTypes' as const;

export default function PackageTypesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Types de colis"
        description={resourceConfigs[resource].description}
      />
      <ResourceTable resource={resource} />
    </div>
  );
}
