'use client';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TransportLinesTable } from './TransportLinesTable';

export function TransportLinesSection() {
  return (
    <Card className="p-6 space-y-4">
      <PageHeader
        title="Lignes de transport"
        description="Configurez les couples origine/destination et les modes autorisés."
      />
      <TransportLinesTable />
    </Card>
  );
}
