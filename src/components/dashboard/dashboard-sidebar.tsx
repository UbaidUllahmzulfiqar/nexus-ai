'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/dashboard', label: 'Overview', count: '1' },
  { href: '/dashboard/upload', label: 'Upload', count: 'New' },
  { href: '/dashboard/documents', label: 'Documents', count: '0' },
  { href: '/dashboard/documents', label: 'Search', count: 'Soon' },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar panel">
      <div className="dashboard-brand">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <strong>NexusAI</strong>
          <p>Workspace shell</p>
        </div>
      </div>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        {navigationItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/documents')
              : pathname.startsWith(item.href);

          return (
            <Link
              className={`dashboard-nav-link ${isActive ? 'active' : ''}`}
              href={item.href}
              key={`${item.href}-${item.label}`}
            >
              <span>{item.label}</span>
              <span className="dashboard-nav-count">{item.count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-sidebar-footer">
        <p>Upload PDFs, preview summaries, and prepare the AI workflow.</p>
        <Link className="button dashboard-sidebar-button" href="/dashboard/upload">
          Upload document
        </Link>
      </div>
    </aside>
  );
}
