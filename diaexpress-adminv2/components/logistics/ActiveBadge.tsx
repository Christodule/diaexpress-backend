import { Badge } from '@/components/ui/badge';

export function ActiveBadge({ active }: { active?: boolean }) {
  return (
    <Badge className={active ? 'badge--success' : 'badge--warning'}>{active ? 'Actif' : 'Inactif'}</Badge>
  );
}
