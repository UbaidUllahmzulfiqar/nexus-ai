import Link from 'next/link';
import { UserMenu } from './user-menu';

type DashboardTopbarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  title?: string;
  subtitle?: string;
};

export function DashboardTopbar({
  name,
  email,
  image,
  title = 'Dashboard',
  subtitle = 'Protected workspace shell',
}: DashboardTopbarProps) {
  return (
    <header className="dashboard-topbar panel">
      <div>
        <p className="dashboard-kicker">Signed in workspace</p>
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-copy">{subtitle}</p>
      </div>

      <div className="dashboard-topbar-actions">
        <Link className="ghost-button dashboard-topbar-link" href="/pricing">
          Billing
        </Link>
        <Link className="ghost-button dashboard-topbar-link" href="/">
          Public site
        </Link>
        <UserMenu name={name} email={email} image={image} />
      </div>
    </header>
  );
}
