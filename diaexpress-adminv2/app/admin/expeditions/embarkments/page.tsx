import { EmbarkmentsTable } from '@/components/expeditions/EmbarkmentsTable';
import { PageHeader } from '@/components/ui/page-header';

export default function EmbarkmentsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Embarquements"
        description="Fenêtres de départ associées aux lignes de transport."
      />
      <EmbarkmentsTable />
    </div>
  );
}
