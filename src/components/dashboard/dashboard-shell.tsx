import type { ReactNode } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardTopbar } from './dashboard-topbar';

type DashboardShellProps = {
  children: ReactNode;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  title?: string;
  subtitle?: string;
};

export function DashboardShell({
  children,
  name,
  email,
  image,
  title,
  subtitle,
}: DashboardShellProps) {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-shell-grid">
        <DashboardSidebar />

        <div className="dashboard-main-column">
          <DashboardTopbar
            email={email}
            image={image}
            name={name}
            subtitle={subtitle}
            title={title}
          />
          {children}
        </div>
      </div>
    </main>
  );
}
