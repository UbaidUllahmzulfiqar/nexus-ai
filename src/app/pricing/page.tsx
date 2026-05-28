import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import type { AuthOptions } from 'next-auth';
import authOptions from '../../lib/authOptions';
import { resolveDashboardContext } from '../../lib/dashboard-context';
import { getWorkspaceBilling } from '../../lib/billing';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Browse the public site and review the product shell.',
    features: ['Public marketing site', 'Dashboard shell', 'Document previews'],
    action: 'Current default',
    tier: 'FREE',
  },
  {
    name: 'Pro',
    price: 'Paid',
    description: 'For solo builders and small teams shipping document AI.',
    features: ['Document chat', 'AI summaries', 'Workspace-scoped storage'],
    action: 'Start Pro',
    tier: 'PRO',
  },
  {
    name: 'Team',
    price: 'Paid',
    description: 'For teams that want shared billing and collaboration.',
    features: ['Everything in Pro', 'Customer portal', 'Team billing scaffold'],
    action: 'Start Team',
    tier: 'TEAM',
  },
] as const;

export default async function PricingPage() {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session?.user?.email) {
    return (
      <main className="page">
        <section className="section">
          <p className="dashboard-kicker">Pricing</p>
          <h1 className="section-title">Choose a plan</h1>
          <p className="section-copy">
            Sign in to attach billing to a workspace and start a subscription.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link className="button" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const context = await resolveDashboardContext(session.user.email);
  const workspace = await getWorkspaceBilling(context.workspaceId);
  const isActive =
    workspace?.subscriptionStatus === 'ACTIVE' || workspace?.subscriptionStatus === 'TRIALING';

  return (
    <main className="page">
      <section className="section">
        <div className="surface-header">
          <div>
            <p className="dashboard-kicker">Pricing</p>
            <h1 className="section-title">Subscription tiers</h1>
            <p className="section-copy">
              Billing is workspace-scoped. Activate a plan to unlock premium document chat.
            </p>
          </div>
          {isActive ? (
            <Link className="ghost-button" href="/api/billing/portal">
              Manage billing
            </Link>
          ) : (
            <Link className="ghost-button" href="/dashboard">
              Back to dashboard
            </Link>
          )}
        </div>

        <div className="pricing-grid">
          {tiers.map((tier) => {
            const activeTier = workspace?.subscriptionTier === tier.tier;

            return (
              <article className="panel pricing-card" key={tier.name}>
                <div className="pricing-card-header">
                  <div>
                    <p className="dashboard-kicker">{tier.name}</p>
                    <h2 className="section-title">{tier.price}</h2>
                  </div>
                  {activeTier ? <span className="tag">Current</span> : null}
                </div>
                <p className="section-copy">{tier.description}</p>

                <ul className="pricing-list">
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                {tier.tier === 'FREE' ? (
                  <span className="ghost-button pricing-button">{tier.action}</span>
                ) : (
                  <form action="/api/billing/checkout" method="post">
                    <input name="tier" type="hidden" value={tier.tier} />
                    <button className="button pricing-button" type="submit">
                      {tier.action}
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>

        <div className="section" style={{ marginTop: '1rem' }}>
          <p className="dashboard-kicker">Workspace billing</p>
          <p className="section-copy">
            Workspace: {context.workspaceName}{' '}
            {workspace?.subscriptionStatus ? `• ${workspace.subscriptionStatus}` : ''}
          </p>
        </div>
      </section>
    </main>
  );
}
