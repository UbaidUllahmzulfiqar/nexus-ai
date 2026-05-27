import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { DashboardShell } from '../../components/dashboard/dashboard-shell';
import { resolveDashboardContext } from '../../lib/dashboard-context';
import getServerSession from '../../lib/session';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const context = await resolveDashboardContext(session.user.email);

  return (
    <DashboardShell
      email={session.user.email}
      image={session.user?.image ?? null}
      name={session.user?.name ?? null}
      subtitle={`Workspace slug: ${context.workspaceSlug}`}
      title={context.workspaceName}
    >
      {children}
    </DashboardShell>
  );
}
