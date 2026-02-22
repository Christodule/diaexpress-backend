'use client';

import { Card } from '@/components/ui/card';
import { EmbarkmentsTable } from './EmbarkmentsTable';

export function EmbarkmentsSection() {
  return (
    <Card className="p-6 space-y-4">
      <EmbarkmentsTable />
    </Card>
  );
}
