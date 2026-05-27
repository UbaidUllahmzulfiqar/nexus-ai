import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: EmptyStateProps) {
  return (
    <section className="empty-state panel">
      <div>
        <p className="dashboard-kicker">Empty state</p>
        <h2 className="section-title">{title}</h2>
        <p className="section-copy">{description}</p>
      </div>

      <div className="empty-state-actions">
        <Link className="button" href={primaryHref}>
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link className="ghost-button" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
