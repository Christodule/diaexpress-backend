import { redirect } from 'next/navigation';

export default function PendingQuotesPage() {
  redirect('/admin/quotes');
}
