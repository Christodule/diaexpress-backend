import { AppShell } from '@/components/layout/app-shell';
import { hasAdminRole } from '@/lib/auth/roles';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AccessDenied } from '@/components/auth/access-denied';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!hasAdminRole(sessionClaims)) {
    return <AccessDenied />;
  }

  return <AppShell>{children}</AppShell>;
}
