import { Badge } from '@/components/ui/badge';
import type { QuoteStatus } from '@/src/types/logistics';
import { quoteStatusConfig, resolveStatusClass, resolveStatusLabel } from '@/lib/status';

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const label = resolveStatusLabel(status, quoteStatusConfig);
  const className = resolveStatusClass(status, quoteStatusConfig);

  return <Badge className={className}>{label}</Badge>;
}
